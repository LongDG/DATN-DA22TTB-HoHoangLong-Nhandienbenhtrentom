const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * POST /api/orders
 * Tạo đơn hàng mới từ giỏ hàng người dùng
 * body: { ho_ten, so_dien_thoai, dia_chi, phuong_thuc_tt, ghi_chu, items[], user_id? }
 */
router.post('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const {
      ho_ten, so_dien_thoai, dia_chi, tinh_thanh, phuong_xa,
      phuong_thuc_tt, ghi_chu, items, user_id,
    } = req.body;

    // ── Validate ──
    if (!ho_ten?.trim())        return res.status(400).json({ message: 'Vui lòng nhập họ tên' });
    if (!so_dien_thoai?.trim()) return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    if (!dia_chi?.trim())       return res.status(400).json({ message: 'Vui lòng nhập địa chỉ' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // ── Tính tổng tiền ──
    const tong_tien = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const doc = {
      // Thông tin khách hàng
      ho_ten:          ho_ten.trim(),
      so_dien_thoai:   so_dien_thoai.trim(),
      dia_chi:         dia_chi.trim(),
      tinh_thanh:      tinh_thanh?.trim() || '',
      phuong_xa:       phuong_xa?.trim()  || '',
      // Đơn hàng
      phuong_thuc_tt:  phuong_thuc_tt   || 'cod',  // cod | chuyen_khoan
      ghi_chu:         ghi_chu?.trim()  || '',
      san_pham: items.map(i => ({
        san_pham_id:  i.id,
        ten_san_pham: i.name,
        so_luong:     i.qty,
        don_gia:      i.price,
        thanh_tien:   i.price * i.qty,
        hinhanh:      i.image || '',
      })),
      tong_tien,
      trang_thai_don_hang: 'cho_xac_nhan',
      trang_thai_tt:       phuong_thuc_tt === 'chuyen_khoan' ? 'cho_thanh_toan' : 'chua_thanh_toan',
      user_id:    user_id  || null,
      ngay_tao:   new Date(),
      capnhat:    new Date(),
    };

    const result = await db.collection('DONHANG').insertOne(doc);
    const orderId = result.insertedId.toString();

    // Trả mã đơn hàng ngắn gọn (6 ký tự cuối)
    res.status(201).json({
      ok: true,
      order_id: orderId,
      ma_don_hang: 'DH' + orderId.slice(-6).toUpperCase(),
      tong_tien,
      message: 'Đặt hàng thành công!',
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Lấy chi tiết đơn hàng theo ID (để hiển thị trang xác nhận)
 */
router.get('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const order = await db.collection('DONHANG').findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json({ ...order, _id: order._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: error.message });
  }
});

module.exports = router;
