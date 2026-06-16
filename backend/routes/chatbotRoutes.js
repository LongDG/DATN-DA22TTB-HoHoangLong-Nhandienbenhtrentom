const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const mongoose = require('mongoose');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Thứ tự ưu tiên dựa trên quota thực tế của tài khoản:
// gemini-2.0-flash-lite = Gemini 3.1 Flash Lite → 500 RPD (ổn định nhất)
// gemini-2.5-flash-lite = Gemini 2.5 Flash Lite → 20 RPD
// gemini-2.5-flash      = Gemini 3.5 Flash      → 20 RPD
// gemini-1.5-flash      = Gemini 3 Flash         → 20 RPD
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',   // ← Chính: 500 req/ngày, 15 req/phút
  'gemini-2.5-flash-lite',   // ← Dự phòng 1
  'gemini-2.5-flash',        // ← Dự phòng 2
  'gemini-1.5-flash',        // ← Dự phòng cuối
];


/* ── Cache đơn giản — tránh gọi Gemini lặp lại (tiết kiệm quota 30/ngày) ── */
const responseCache = new Map();
const CACHE_TTL_MS  = 10 * 60 * 1000; // Cache 10 phút

function getCacheKey(messages) {
  // Key = nội dung cuối cùng user gõ (lowercase, bỏ dấu)
  const lastMsg = messages.filter(m => m.role === 'user').at(-1)?.content || '';
  return lastMsg.toLowerCase().trim().substring(0, 100);
}
function getCache(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return hit.data;
}
function setCache(key, data) {
  if (responseCache.size > 50) responseCache.clear(); // Giới hạn 50 entries
  responseCache.set(key, { data, time: Date.now() });
}


/* ── GET /api/chatbot/test — Kiểm tra API key + DB ── */
router.get('/test', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Test DB
    const benhCount  = await db.collection('BENH').countDocuments();
    const sanphamCount = await db.collection('SANPHAM').countDocuments();

    // Test Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    const geminiRes = await axios.post(
      `${GEMINI_URL}?key=${apiKey}`,
      { contents: [{ role: 'user', parts: [{ text: 'Xin chào, trả lời 1 từ.' }] }] },
      { timeout: 10000 }
    );
    const reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({
      ok: true,
      db: { benhCount, sanphamCount },
      gemini: { ok: true, reply },
      apiKeyPrefix: apiKey?.substring(0, 10) + '...',
    });
  } catch (err) {
    const geminiErr = err.response?.data?.error;
    res.status(500).json({
      ok: false,
      error: geminiErr?.message || err.message,
      geminiStatus: geminiErr?.status,
      apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
    });
  }
});

/* ── Lấy dữ liệu BENH + SANPHAM từ MongoDB ── */
async function getDBContext() {
  const db = mongoose.connection.db;
  const [benh, sanpham] = await Promise.all([
    db.collection('BENH').find({}).toArray(),
    db.collection('SANPHAM').find({ trangthai: 'dang_ban' })
      .project({ tensanpham: 1, mota: 1, congdung: 1, lieudung: 1, gia: 1, benh_ids: 1, loaisanpham: 1 })
      .toArray(),
  ]);
  return { benh, sanpham };
}

/* ── System prompt ── */
function buildSystemPrompt(benh, sanpham) {
  return `Bạn là trợ lý chuyên gia chẩn đoán bệnh tôm của hệ thống AquaVet.
Nhiệm vụ: Phân tích triệu chứng người dùng mô tả và đưa ra chẩn đoán dựa trên dữ liệu bệnh dưới đây.

=== DỮ LIỆU BỆNH TÔM ===
${JSON.stringify(benh.map(b => ({
  id: b._id.toString(),
  tenbenh: b.tenbenh,
  nhom: b.nhom,
  mucdo: b.mucdo,
  trieuchung: b.trieuchung,
  nguyennhan: b.nguyennhan,
  dieutri: b.dieutri,
  phongngua: b.phongngua,
})), null, 2)}

=== DỮ LIỆU THUỐC / SẢN PHẨM ===
${JSON.stringify(sanpham.map(s => ({
  id: s._id.toString(),
  tensanpham: s.tensanpham,
  loai: s.loaisanpham,
  congdung: s.congdung,
  lieudung: s.lieudung,
  gia: s.gia,
  benh_ids: (s.benh_ids || []).map(x => x.toString()),
})), null, 2)}

=== QUY TẮC TRẢ LỜI ===
Chỉ trả về JSON hợp lệ, KHÔNG có markdown, KHÔNG có backtick, KHÔNG có text thêm ngoài JSON.

Có 3 dạng response:

1. Tìm được bệnh (confidence >= 60%):
{
  "type": "diagnosis",
  "benh": {
    "id": "<id từ DB>",
    "tenbenh": "<tên bệnh>",
    "nhom": "<nhóm>",
    "mucdo": "<mức độ>",
    "mo_ta_ngan": "<1-2 câu mô tả ngắn gọn>",
    "dieu_tri": "<hướng điều trị cụ thể>",
    "phong_ngua": "<cách phòng ngừa>",
    "do_tin_cay": <số từ 0-100>,
    "trieuchung_khop": ["<các triệu chứng người dùng mô tả khớp với bệnh>"]
  },
  "thuoc_goiy": [
    {
      "id": "<id thuốc>",
      "tensanpham": "<tên>",
      "loai": "<loại>",
      "cong_dung_chinh": "<tại sao dùng thuốc này>",
      "lieudung_xu_ly": "<liều dùng khi điều trị>",
      "gia": <số>,
      "muc_do_uu_tien": "chinh" | "ho_tro"
    }
  ],
  "loi_khuyen": "<lời khuyên tổng quát ngắn gọn, thân thiện>"
}

2. Cần hỏi thêm thông tin (confidence 30-60%):
{
  "type": "ask_more",
  "phan_tich_so_bo": "<bệnh có thể là gì, nêu 1-2 khả năng>",
  "cau_hoi": "<câu hỏi cụ thể cần hỏi thêm>",
  "lua_chon": ["<lựa chọn 1>", "<lựa chọn 2>", "<lựa chọn 3>", "<lựa chọn 4>"]
}

3. Không xác định được (confidence < 30% hoặc triệu chứng quá chung chung):
{
  "type": "transfer_admin",
  "ly_do": "<lý do ngắn gọn tại sao cần chuyên gia>",
  "tom_tat": "<tóm tắt vấn đề người dùng mô tả để gửi cho admin>"
}

Luôn trả lời bằng tiếng Việt. Thân thiện, chuyên nghiệp.`;
}

/* ── POST /api/chatbot/chat ── */
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Thiếu nội dung tin nhắn' });
    }

    // Kiểm tra cache trước — tiết kiệm quota
    const cacheKey = getCacheKey(messages);
    const cached   = getCache(cacheKey);
    if (cached) {
      console.log('[CHATBOT] Cache hit:', cacheKey);
      return res.json({ result: cached, fromCache: true });
    }

    const { benh, sanpham } = await getDBContext();
    const systemPrompt = buildSystemPrompt(benh, sanpham);

    // Chuyển messages sang format Gemini
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    };

    // Gọi Gemini với fallback model tự động
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let geminiRes;
    for (let mi = 0; mi < GEMINI_MODELS.length; mi++) {
      const model = GEMINI_MODELS[mi];
      const url   = `${GEMINI_BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      let success = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          geminiRes = await axios.post(url, payload,
            { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
          );
          success = true;
          if (mi > 0) console.log(`[CHATBOT] Dùng model dự phòng: ${model}`);
          break;
        } catch (e) {
          const status = e.response?.data?.error?.status;
          if ((status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED') && attempt < 2) {
            console.log(`[CHATBOT] ${model} lỗi (${status}), thử lại...`);
            await sleep(2000);
          } else {
            console.log(`[CHATBOT] ${model} thất bại: ${status || e.message}`);
            break; // Thử model tiếp theo
          }
        }
      }
      if (success) break;
      if (mi === GEMINI_MODELS.length - 1) {
        // Tất cả model đều lỗi
        return res.json({
          result: {
            type: 'transfer_admin',
            ly_do: 'Hệ thống AI tạm thời không khả dụng. Vui lòng thử lại sau hoặc liên hệ chuyên gia.',
            tom_tat: messages[messages.length - 1]?.content || '',
          }
        });
      }
    }

    // Lấy text từ parts — gemini-2.5-flash có thể trả nhiều parts
    const parts   = geminiRes.data?.candidates?.[0]?.content?.parts || [];
    const rawText = parts.map(p => p.text || '').join('').trim();

    // Parse JSON từ response
    let parsed;
    try {
      // Xóa markdown nếu Gemini vẫn trả thêm
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Nếu không parse được, trả dạng transfer_admin
      parsed = {
        type: 'transfer_admin',
        ly_do: 'Hệ thống gặp sự cố khi phân tích, vui lòng thử lại hoặc liên hệ chuyên gia.',
        tom_tat: messages[messages.length - 1]?.content || '',
      };
    }

    // Lưu vào cache (chỉ cache diagnosis và ask_more, không cache transfer_admin)
    if (parsed.type !== 'transfer_admin') {
      setCache(cacheKey, parsed);
    }

    res.json({ result: parsed });
  } catch (err) {
    const geminiError = err.response?.data?.error;
    console.error('[CHATBOT] Lỗi Gemini:', geminiError?.status, geminiError?.message || err.message);

    // Hết quota free tier
    if (geminiError?.status === 'RESOURCE_EXHAUSTED') {
      return res.status(429).json({
        result: {
          type: 'transfer_admin',
          ly_do: 'Hệ thống AI đang bận, vui lòng thử lại sau vài phút hoặc liên hệ chuyên gia trực tiếp.',
          tom_tat: 'Người dùng cần tư vấn (hệ thống AI tạm thời không khả dụng)',
        }
      });
    }
    // API key sai
    if (geminiError?.status === 'INVALID_ARGUMENT') {
      return res.status(400).json({ message: 'Cấu hình AI không hợp lệ, liên hệ quản trị viên.' });
    }
    res.status(500).json({ message: 'Lỗi kết nối AI', error: geminiError?.message || err.message });
  }
});

/* ── POST /api/chatbot/transfer — tạo yêu cầu tư vấn cho admin ── */
router.post('/transfer', async (req, res) => {
  try {
    const { nguoidung_id, hoten, sodienthoai, tom_tat, lich_su_chat } = req.body;
    const db = mongoose.connection.db;

    const doc = {
      hoten:        hoten || 'Người dùng chatbot',
      sodienthoai:  sodienthoai || '',
      email:        '',
      noidung:      `[Chuyển từ Chatbot]\n${tom_tat}`,
      loai:         'tu_van_benh',
      trangthai:    'cho_xu_ly',
      nguoidung_id: nguoidung_id ? new mongoose.Types.ObjectId(nguoidung_id) : null,
      lich_su_chat: lich_su_chat || [],
      ngaytao:      new Date(),
    };

    const result = await db.collection('LIENHE').insertOne(doc);
    res.json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    console.error('[CHATBOT TRANSFER] Lỗi:', err.message);
    res.status(500).json({ message: 'Lỗi tạo yêu cầu tư vấn' });
  }
});

module.exports = router;
