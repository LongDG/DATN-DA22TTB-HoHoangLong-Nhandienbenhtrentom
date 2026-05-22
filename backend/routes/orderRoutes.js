const express  = require('express');
const mongoose = require('mongoose');
const router   = express.Router();
const { authMiddleware } = require('../middleware/auth');

const PT_MAP = {
  cod:          'Thanh toán tiền mặt (COD)',
  chuyen_khoan: 'Chuyển khoản ngân hàng',
  vnpay:        'Chuyển khoản VNPay',
  momo:         'Ví MoMo',
};

/**
 * POST /api/orders — Tạo đơn hàng mới
 * Lưu đúng schema DB thực tế
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const {
      ho_ten, so_dien_thoai, dia_chi, tinh_thanh, phuong_xa,
      phuong_thuc_tt, ghi_chu, items,
    } = req.body;

    if (!ho_ten?.trim())        return res.status(400).json({ message: 'Vui lòng nhập họ tên' });
    if (!so_dien_thoai?.trim()) return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    if (!dia_chi?.trim())       return res.status(400).json({ message: 'Vui lòng nhập địa chỉ' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Lấy user từ JWT
    const userId = req.user?.id;
    const nguoidung_id = (() => { try { return new ObjectId(userId); } catch { return null; } })();

    // Tính tiền
    const tong_tien_hang       = items.reduce((s, i) => s + i.price * i.qty, 0);
    const phi_vanchuyen        = tong_tien_hang >= 500000 ? 0 : 30000;
    const giam_gia             = 0;
    const tong_tien_thanh_toan = tong_tien_hang + phi_vanchuyen - giam_gia;

    // Mã đơn hàng: AQUA-DDMMYY-RANDOM4
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    const rnd = Math.random().toString(36).slice(-4).toUpperCase();
    const mavandon = `AQUA-${dd}${mm}${yy}-${rnd}`;

    const doc = {
      nguoidung_id,                          // ObjectId — khớp schema thực
      mavandon,
      tong_tien_hang,
      phi_vanchuyen,
      giam_gia,
      tong_tien_thanh_toan,
      phuong_thuc_thanh_toan: PT_MAP[phuong_thuc_tt] || phuong_thuc_tt || 'COD',
      trang_thai_thanh_toan:  phuong_thuc_tt === 'chuyen_khoan' || phuong_thuc_tt === 'vnpay'
                                ? 'cho_thanh_toan' : 'chua_thanh_toan',
      trang_thai_don_hang:    'cho_xac_nhan',

      // Nhóm thông tin giao hàng vào object — khớp schema thực
      thong_tin_nhan_hang: {
        ho_ten:        ho_ten.trim(),
        so_dien_thoai: so_dien_thoai.trim(),
        dia_chi:       dia_chi.trim(),
        tinh_thanh:    tinh_thanh?.trim() || '',
        phuong_xa:     phuong_xa?.trim()  || '',
      },

      // Lịch sử trạng thái
      lich_su_trang_thai: [{
        trang_thai: 'cho_xac_nhan',
        thoi_gian:  now,
        ghi_chu:    'Đặt hàng thành công',
      }],

      // Danh sách sản phẩm nhúng
      san_pham: items.map(i => ({
        san_pham_id:  i.id,
        ten_san_pham: i.name,
        so_luong:     i.qty,
        don_gia:      i.price,
        thanh_tien:   i.price * i.qty,
        hinhanh:      i.image || '',
      })),

      ghi_chu:  ghi_chu?.trim() || '',
      ngaytao:  now,
      capnhat:  now,
    };

    const result = await db.collection('DONHANG').insertOne(doc);
    const orderId = result.insertedId.toString();

    res.status(201).json({
      ok:          true,
      order_id:    orderId,
      ma_don_hang: mavandon,
      tong_tien:   tong_tien_thanh_toan,
      message:     'Đặt hàng thành công!',
    });
  } catch (error) {
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
  }
});

/**
 * GET /api/orders — Đơn hàng của user đang đăng nhập
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });

    const uid = (() => { try { return new ObjectId(userId); } catch { return null; } })();

    // Hỗ trợ cả schema mới (nguoidung_id) lẫn schema cũ (user_id)
    const orConds = [];
    if (uid) {
      orConds.push({ nguoidung_id: uid });
      orConds.push({ user_id: uid });
    }
    orConds.push({ user_id_str: userId });

    const orders = await db.collection('DONHANG')
      .find({ $or: orConds })
      .sort({ ngaytao: -1, ngay_tao: -1 })
      .toArray();

    res.json(orders.map(o => ({ ...o, _id: o._id.toString() })));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: error.message });
  }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
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

/**
 * PATCH /api/orders/:id/cancel — User hủy đơn
 */
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const order = await db.collection('DONHANG').findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.trang_thai_don_hang !== 'cho_xac_nhan') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang chờ xác nhận' });
    }
    const now = new Date();
    await db.collection('DONHANG').updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: { trang_thai_don_hang: 'da_huy', capnhat: now },
        $push: { lich_su_trang_thai: { trang_thai: 'da_huy', thoi_gian: now, ghi_chu: 'Người dùng hủy đơn' } },
      }
    );
    res.json({ ok: true, message: 'Đã hủy đơn hàng' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hủy đơn hàng', error: error.message });
  }
});

module.exports = router;
