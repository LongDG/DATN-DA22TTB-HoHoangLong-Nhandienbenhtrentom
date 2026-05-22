/**
 * consultationRoutes.js
 * Route dành cho USER (không cần quyền admin):
 *   POST   /api/consultations          → tạo phiếu tư vấn mới
 *   GET    /api/consultations          → lấy danh sách phiếu của user hiện tại
 *   GET    /api/consultations/:id      → chi tiết phiếu (chỉ xem phiếu của mình)
 *   POST   /api/consultations/:id/reply-user → gửi tin nhắn từ user
 */

const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const { authMiddleware } = require('../middleware/auth');

// Tất cả route đều cần đăng nhập nhưng KHÔNG cần admin
router.use(authMiddleware);

// ─── POST /api/consultations — Tạo phiếu tư vấn ────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { ten_nguoidung, noidung, vitri_tinh, vitri_ao, nguoidung_id } = req.body;

    if (!ten_nguoidung || !noidung)
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });

    let uid = null;
    const rawId = nguoidung_id || req.user?.id;
    if (rawId) {
      try { uid = new ObjectId(rawId); } catch { uid = rawId; }
    }

    const firstMsg = {
      vai_tro:  'nguoidung',
      noi_dung: noidung.trim(),
      thoigian: new Date(),
    };

    const doc = {
      ten_nguoidung: ten_nguoidung.trim(),
      vitri_tinh:    vitri_tinh?.trim()  || '',
      vitri_ao:      vitri_ao?.trim()    || 'Chưa xác định',
      noidung:       noidung.trim(),
      trang_thai:    'cho_phan_hoi',
      nguoidung_id:  uid,
      ngaytao:       new Date(),
      tin_nhan:      [firstMsg],
    };

    const result = await db.collection('LIENHE').insertOne(doc);
    res.status(201).json({
      ok:      true,
      id:      result.insertedId.toString(),
      _id:     result.insertedId.toString(),
      message: 'Gửi yêu cầu thành công',
    });
  } catch (err) {
    console.error('[CONSULT] Lỗi tạo phiếu:', err);
    res.status(500).json({ message: 'Lỗi tạo phiếu', error: err.message });
  }
});

// ─── GET /api/consultations — Lấy danh sách phiếu của user ─────────────────
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;

    // Lọc theo user đang đăng nhập (hoặc query param user_id)
    const rawId = req.query.user_id || req.user?.id;
    let filter  = {};
    if (rawId) {
      try {
        filter = { nguoidung_id: new ObjectId(rawId) };
      } catch {
        filter = { nguoidung_id: rawId };
      }
    }

    const docs = await db.collection('LIENHE')
      .find(filter)
      .sort({ ngaytao: -1 })
      .limit(50)
      .toArray();

    const list = docs.map(d => ({
      _id:          d._id.toString(),
      id:           d._id.toString(),
      ten:          d.ten_nguoidung || '—',
      noidung:      d.noidung       || '',
      vitri_tinh:   d.vitri_tinh    || '',
      vitri_ao:     d.vitri_ao      || '',
      trang_thai:   d.trang_thai    || 'cho_phan_hoi',
      status:       d.trang_thai    || 'cho_phan_hoi',
      ngaytao:      d.ngaytao,
      so_tin_nhan:  (d.tin_nhan || []).length,
    }));

    res.json(list);
  } catch (err) {
    console.error('[CONSULT] Lỗi lấy danh sách:', err);
    res.status(500).json({ message: 'Lỗi lấy danh sách', error: err.message });
  }
});

// ─── GET /api/consultations/:id — Chi tiết phiếu ────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;

    let ticketId;
    try { ticketId = new ObjectId(req.params.id); }
    catch { return res.status(400).json({ message: 'ID không hợp lệ' }); }

    const doc = await db.collection('LIENHE').findOne({ _id: ticketId });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy phiếu' });

    res.json({
      _id:        doc._id.toString(),
      id:         doc._id.toString(),
      ten:        doc.ten_nguoidung || '—',
      noidung:    doc.noidung       || '',
      vitri_tinh: doc.vitri_tinh   || '',
      vitri_ao:   doc.vitri_ao     || '',
      trang_thai: doc.trang_thai   || 'cho_phan_hoi',
      status:     doc.trang_thai   || 'cho_phan_hoi',
      ngaytao:    doc.ngaytao,
      tin_nhan:   doc.tin_nhan     || [],
    });
  } catch (err) {
    console.error('[CONSULT] Lỗi lấy chi tiết:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// ─── POST /api/consultations/:id/reply-user — User gửi tin nhắn ────────────
router.post('/:id/reply-user', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { noi_dung } = req.body;

    if (!noi_dung?.trim())
      return res.status(400).json({ message: 'Nội dung không được trống' });

    let ticketId;
    try { ticketId = new ObjectId(req.params.id); }
    catch { return res.status(400).json({ message: 'ID không hợp lệ' }); }

    const msg = {
      vai_tro:  'nguoidung',
      noi_dung: noi_dung.trim(),
      thoigian: new Date(),
    };

    const result = await db.collection('LIENHE').updateOne(
      { _id: ticketId },
      {
        $push:  { tin_nhan: msg },
        $set:   { cap_nhat: new Date() },
      }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ message: 'Không tìm thấy phiếu' });

    res.json({ ok: true, message: 'Đã gửi tin nhắn' });
  } catch (err) {
    console.error('[CONSULT] Lỗi gửi tin nhắn:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;
