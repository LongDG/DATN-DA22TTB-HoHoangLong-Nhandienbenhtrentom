/**
 * diagnoseRoutes.js — Chẩn đoán AI + Dual-write ảnh (Local + Cloudinary) + Gợi ý thuốc
 */

const express    = require('express');
const multer     = require('multer');
const axios      = require('axios');
const FormData   = require('form-data');
const mongoose   = require('mongoose');
const path       = require('path');
const fs         = require('fs');
const { authMiddleware }              = require('../middleware/auth');
const { uploadDiagnosisImage, getBestImageUrl } = require('../utils/cloudStorage');

const router = express.Router();

// ─── Upload config ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'diagnoses');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext    = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `diag-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png/.test(file.mimetype) &&
               /jpeg|jpg|png/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Chỉ hỗ trợ file JPG và PNG'));
  },
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

function cleanupFile(p) { try { fs.unlinkSync(p); } catch {} }

// Map AI disease code → keyword tìm trong collection BENH
const DISEASE_KEYWORDS = {
  dom_trang:  ['đốm trắng', 'WSSV'],
  mang_den:   ['đen mang', 'Black Gill', 'mang đen'],
  dau_vang:   ['đầu vàng', 'YHV', 'Yellowhead'],
  gan_tuy:    ['gan tụy', 'AHPND', 'EMS'],
  ruot_trang: ['phân trắng', 'WFD', 'EHP'],
};

// ─── POST /api/diagnose ───────────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Vui lòng gửi ảnh trong trường "image".' });

  try {
    // 1. Gọi Python AI service
    const form = new FormData();
    form.append('image', fs.createReadStream(file.path), {
      filename:    file.originalname || file.filename,
      contentType: file.mimetype,
    });

    let aiResponse;
    try {
      const { data } = await axios.post(`${AI_SERVICE_URL}/predict`, form, {
        headers:          { ...form.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength:    Infinity,
        timeout:          60_000,
      });
      aiResponse = data;
    } catch (aiErr) {
      cleanupFile(file.path);
      if (aiErr.response) return res.status(aiErr.response.status).json(aiErr.response.data);
      return res.status(503).json({
        message: 'AI service không phản hồi. Vui lòng thử lại sau.',
        error:   aiErr.message,
      });
    }

    // 2. Validation thất bại → trả ngay (KHÔNG xóa file local — giữ để debug)
    if (!aiResponse.ok) {
      cleanupFile(file.path);
      return res.status(422).json(aiResponse);
    }

    const db      = mongoose.connection.db;
    const result  = aiResponse.result;
    const disease = result.disease;

    // 3. Dual-write ảnh: local (đã có) + Cloudinary (nếu cấu hình)
    const { cloud_url, local_relative } = await uploadDiagnosisImage(file.path);

    // 4. Tìm BENH + SANPHAM gợi ý
    let benhDoc          = null;
    let benhId           = null;
    let suggestedProducts = [];

    if (disease.code !== 'khoe_manh') {
      try {
        const keywords = DISEASE_KEYWORDS[disease.code] || [disease.name.split('(')[0].trim()];
        const orQuery  = keywords.map(kw => ({ tenbenh: { $regex: kw, $options: 'i' } }));
        benhDoc = await db.collection('BENH').findOne({ $or: orQuery });
        if (benhDoc) benhId = benhDoc._id;
      } catch {}

      if (benhId) {
        try {
          const products = await db.collection('SANPHAM')
            .find({
              benh_ids:  { $elemMatch: { $eq: benhId } },
              trangthai: 'dang_ban',
              soluong:   { $gt: 0 },
            })
            .sort({ daban: -1 })
            .limit(3)
            .toArray();

          suggestedProducts = products.map(p => ({
            id:         p._id.toString(),
            ten:        p.tensanpham  || '',
            thuonghieu: p.thuonghieu  || '',
            loai:       p.loaisanpham || '',
            mota:       p.mota        || '',
            congdung:   p.congdung    || [],
            lieudung:   p.lieudung    || {},
            gia:        p.gia         || 0,
            hinhanh:    (p.hinhanh    || [])[0] || null,
            muc_dich:   p.muc_dich_su_dung || [],
          }));
        } catch {}
      }
    }

    // 5. Lưu vào KETQUANHANDIEN (có cả cloud_url và local_relative)
    const diagDoc = {
      nguoidung_id:       req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null,
      ketqua_benh_id:     benhId,
      chuandoan_text:     disease.severity === 'none'
                            ? 'Khỏe mạnh — không phát hiện bệnh lý.'
                            : `Phát hiện: ${disease.name}. ${disease.recommendation}`,
      ten_benh:           disease.name,
      ma_benh:            disease.code,
      do_chinh_xac:       result.confidence,
      muc_do_canh_bao:    { none: 'Bình thường', medium: 'Cảnh báo', high: 'Nguy hiểm', critical: 'Rất nguy hiểm' }[disease.severity] || 'Không rõ',
      hinhanh_url:        local_relative,   // URL relative local (fallback)
      cloud_url:          cloud_url,         // Cloudinary URL (null nếu chưa cấu hình)
      thiet_bi:           req.body.device || 'Web-Upload',
      ket_qua_xac_suat:   result.all_probs,
      model_version:      result.model_version,
      chat_luong_anh:     aiResponse.validation?.details || {},
      trang_thai_xacminh: 'chua_xac_minh',
      san_pham_goi_y:     suggestedProducts.map(p => p.id),
      ngay_nhan_dien:     new Date(),
    };
    const inserted = await db.collection('KETQUANHANDIEN').insertOne(diagDoc);

    // 6. Trả kết quả
    return res.status(201).json({
      ok:          true,
      diagnose_id: inserted.insertedId.toString(),
      image_url:   cloud_url || local_relative,  // Frontend dùng field này
      cloud_url,
      local_url:   local_relative,
      validation:  aiResponse.validation,
      benh_info:   benhDoc ? {
        id:         benhDoc._id.toString(),
        tenbenh:    benhDoc.tenbenh,
        mota:       benhDoc.mota,
        trieuchung: benhDoc.trieuchung || [],
        dieutri:    benhDoc.dieutri,
        phongngua:  benhDoc.phongngua,
        nhom:       benhDoc.nhom,
        mucdo:      benhDoc.mucdo,
      } : null,
      suggested_products: suggestedProducts,
      result: { ...result, disease: { ...disease } },
    });

  } catch (err) {
    if (file) cleanupFile(file.path);
    console.error('[DIAGNOSE]', err);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// ─── GET /api/diagnose/history ────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const db    = mongoose.connection.db;
    const uid   = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const skip  = (page - 1) * limit;
    const filter = uid ? { nguoidung_id: new mongoose.Types.ObjectId(uid) } : {};

    const [docs, total] = await Promise.all([
      db.collection('KETQUANHANDIEN').find(filter).sort({ ngay_nhan_dien: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('KETQUANHANDIEN').countDocuments(filter),
    ]);

    res.json({
      history: docs.map(d => ({
        id:           d._id.toString(),
        ten_benh:     d.ten_benh      || 'Không xác định',
        ma_benh:      d.ma_benh       || '',
        do_chinh_xac: d.do_chinh_xac  || 0,
        muc_do:       d.muc_do_canh_bao || '',
        image_url:    getBestImageUrl(d),  // cloud_url nếu có, else full local URL
        ngay:         d.ngay_nhan_dien
                        ? new Date(d.ngay_nhan_dien).toLocaleDateString('vi-VN') : '—',
        gio:          d.ngay_nhan_dien
                        ? new Date(d.ngay_nhan_dien).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
      })),
      total, page, limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy lịch sử', error: err.message });
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message)
    return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Lỗi server' });
});

module.exports = router;
