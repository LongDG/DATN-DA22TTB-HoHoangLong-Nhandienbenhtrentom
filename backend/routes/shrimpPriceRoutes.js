/**
 * GET  /api/shrimp-prices       — Public: user xem giá tôm hiện tại
 * PUT  /api/shrimp-prices       — Admin: cập nhật giá tôm thủ công
 *
 * MongoDB collection: GIATOM
 * Chỉ có 1 document duy nhất (upsert pattern), gồm mảng `gia[]`
 */

const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// ── Dữ liệu mặc định nếu DB chưa có ──────────────────────────────────────
const DEFAULT_PRICES = [
  { co: '20 con/kg', tom_su: 285000, tom_the: 165000, xu_huong: 1, thay_doi: 2500 },
  { co: '30 con/kg', tom_su: 240000, tom_the: 142000, xu_huong: 1, thay_doi: 1800 },
  { co: '40 con/kg', tom_su: 210000, tom_the: 135000, xu_huong: -1, thay_doi: 500 },
  { co: '50 con/kg', tom_su: 185000, tom_the: 118000, xu_huong: 0,  thay_doi: 0   },
];

// ─────────────────────────────────────────────────────────────────────────
// GET /api/shrimp-prices — Public
// ─────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const doc = await db.collection('GIATOM').findOne({ _id: 'current' });

    if (!doc) {
      // Trả về giá mặc định nếu chưa có dữ liệu
      return res.json({
        gia:         DEFAULT_PRICES,
        capnhat_luc: null,
        capnhat_boi: 'Hệ thống',
        vung:        'ĐBSCL',
      });
    }

    res.json({
      gia:         doc.gia         || DEFAULT_PRICES,
      capnhat_luc: doc.capnhat_luc || null,
      capnhat_boi: doc.capnhat_boi || 'Admin',
      vung:        doc.vung        || 'ĐBSCL',
    });
  } catch (err) {
    console.error('[GIATOM] GET lỗi:', err.message);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/shrimp-prices — Admin only
// body: { gia: [...], vung?: string }
// ─────────────────────────────────────────────────────────────────────────
router.put('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const { gia, vung } = req.body;

    if (!Array.isArray(gia) || gia.length === 0) {
      return res.status(400).json({ message: 'Dữ liệu giá không hợp lệ' });
    }

    // Validate từng dòng
    const cleaned = gia.map(row => ({
      co:       String(row.co       || '').trim(),
      tom_su:   Number(row.tom_su)  || 0,
      tom_the:  Number(row.tom_the) || 0,
      xu_huong: Number(row.xu_huong) || 0,  // 1=tăng, -1=giảm, 0=đứng
      thay_doi: Math.abs(Number(row.thay_doi) || 0),
    }));

    await db.collection('GIATOM').updateOne(
      { _id: 'current' },
      {
        $set: {
          gia:         cleaned,
          vung:        String(vung || 'ĐBSCL').trim(),
          capnhat_luc: new Date(),
          capnhat_boi: req.user?.ten || 'Admin',
        },
      },
      { upsert: true }
    );

    res.json({ ok: true, message: 'Cập nhật giá tôm thành công' });
  } catch (err) {
    console.error('[GIATOM] PUT lỗi:', err.message);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;
