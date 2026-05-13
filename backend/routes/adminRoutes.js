const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Tổng số chẩn đoán
    const totalDiagnostics = await db.collection('KETQUANHANDIEN').countDocuments();
    
    // Đơn hàng mới (trạng thái cho_xac_nhan hoặc dựa vào the toàn bộ đơn hàng)
    // Tạm lấy tổng số đơn hàng nếu chưa có dữ liệu 'cho_xac_nhan' rõ ràng
    const totalOrders = await db.collection('DONHANG').countDocuments();
    const newOrders = await db.collection('DONHANG').countDocuments({ trang_thai_don_hang: 'cho_xac_nhan' });
    
    // Tính tổng doanh thu từ tất cả đơn hàng hoặc các đơn hàng đã thanh toán
    const orders = await db.collection('DONHANG').find({}).toArray();
    let totalRevenue = 0;
    orders.forEach(order => {
        totalRevenue += order.tong_tien_thanh_toan || 0;
    });

    // Tổng số người dùng
    const totalUsers = await db.collection('NGUOIDUNG').countDocuments();

    // Số lượng tư vấn chưa phản hồi
    const pendingConsultations = await db.collection('LIENHE').countDocuments({ trang_thai: 'cho_phan_hoi' });

    res.json({
        totalDiagnostics,
        totalOrders,
        newOrders: newOrders > 0 ? newOrders : totalOrders,
        totalRevenue,
        totalUsers,
        pendingConsultations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
});

/**
 * GET /api/admin/consultations/stats
 * Thống kê tư vấn
 */
router.get('/consultations/stats', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const [total, pending, active, done] = await Promise.all([
      db.collection('LIENHE').countDocuments(),
      db.collection('LIENHE').countDocuments({ trang_thai: 'cho_phan_hoi' }),
      db.collection('LIENHE').countDocuments({ trang_thai: 'dang_tu_van' }),
      db.collection('LIENHE').countDocuments({ trang_thai: 'da_dong' }),
    ]);
    // Tính đánh giá trung bình từ các tư vấn đã đóng có đánh giá
    const rated = await db.collection('LIENHE').find({ danh_gia: { $exists: true } }).toArray();
    const avgRating = rated.length > 0
      ? (rated.reduce((s, r) => s + (r.danh_gia || 0), 0) / rated.length).toFixed(1)
      : '—';
    res.json({ total, pending, active, done, avgRating });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thống kê tư vấn', error: error.message });
  }
});

/**
 * GET /api/admin/consultations
 * Danh sách tư vấn (tất cả trạng thái)
 */
router.get('/consultations', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const records = await db.collection('LIENHE')
      .find({})
      .sort({ ngaytao: -1 })
      .limit(20)
      .toArray();

    const now = new Date();
    const formatted = records.map(c => {
      const name = c.ten_nguoidung || 'Người dùng';
      const words = name.trim().split(/\s+/);
      const initials = words.length >= 2
        ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
      const diffMs = now - new Date(c.ngaytao);
      const diffMins = Math.floor(diffMs / 60_000);
      const diffHours = Math.floor(diffMins / 60);
      const timeAgo = diffHours > 24 ? 'Hôm qua'
                    : diffHours > 0  ? `${diffHours} giờ`
                    : `${Math.max(1, diffMins)} phút`;
      const lastMsg = c.tin_nhan?.length > 0
        ? c.tin_nhan[c.tin_nhan.length - 1].noi_dung
        : c.noidung;
      return {
        id: c._id.toString(), name, initials,
        location: `${c.vitri_tinh}, ${c.vitri_ao}`,
        message: c.noidung,
        lastMsg, time: timeAgo,
        status: c.trang_thai,
        msgCount: c.tin_nhan?.length || 0,
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy tư vấn', error: error.message });
  }
});

/**
 * GET /api/admin/consultations/:id
 * Chi tiết 1 tư vấn kèm tin nhắn
 */
router.get('/consultations/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const doc = await db.collection('LIENHE').findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tư vấn' });
    res.json({
      id: doc._id.toString(),
      name: doc.ten_nguoidung,
      location: `${doc.vitri_tinh}, ${doc.vitri_ao}`,
      noidung: doc.noidung,
      status: doc.trang_thai,
      tin_nhan: (doc.tin_nhan || []).map(m => ({
        vai_tro: m.vai_tro,
        noi_dung: m.noi_dung,
        thoigian: m.thoigian,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết tư vấn', error: error.message });
  }
});

/**
 * POST /api/admin/consultations/:id/reply
 * Gửi tin nhắn phản hồi, đổi trạng thái → dang_tu_van
 */
router.post('/consultations/:id/reply', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { noi_dung } = req.body;
    if (!noi_dung?.trim()) return res.status(400).json({ message: 'Nội dung không được trống' });
    const newMsg = { vai_tro: 'chuyen_gia', noi_dung: noi_dung.trim(), thoigian: new Date() };
    await db.collection('LIENHE').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { tin_nhan: newMsg }, $set: { trang_thai: 'dang_tu_van' } }
    );
    res.json({ ok: true, tin_nhan: newMsg });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi gửi phản hồi', error: error.message });
  }
});

/**
 * PATCH /api/admin/consultations/:id/close
 * Đóng tư vấn → da_dong
 */
router.patch('/consultations/:id/close', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('LIENHE').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { trang_thai: 'da_dong' } }
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đóng tư vấn', error: error.message });
  }
});

router.get('/diagnostics', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Lấy 10 kết quả chẩn đoán gần nhất và Join với bảng BENH
    const diagnostics = await db.collection('KETQUANHANDIEN').aggregate([
      {
        $lookup: {
          from: "BENH", // Tên collection chứa thông tin bệnh
          localField: "ketqua_benh_id", // Khóa ngoại từ bảng KETQUANHANDIEN
          foreignField: "_id", // Khóa chính của bảng BENH
          as: "benh_info"
        }
      },
      {
        $unwind: {
          path: "$benh_info",
          preserveNullAndEmptyArrays: true // Giữ lại kể cả nếu không tìm thấy bệnh
        }
      },
      { $sort: { ngay_nhan_dien: -1 } }, // Sắp xếp mới nhất
      { $limit: 20 }
    ]).toArray();

    // Map lại format để front-end dễ hiển thị
    const formattedLogs = diagnostics.map(d => {
      const isKhỏeMạnh = !d.benh_info || d.chuandoan_text.includes("Khỏe mạnh");
      
      let thoigian = '00:00';
      let ngaytao = 'N/A';
      if (d.ngay_nhan_dien) {
        const dObj = new Date(d.ngay_nhan_dien);
        thoigian = dObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        ngaytao = dObj.toLocaleDateString('vi-VN');
      }

      return {
        id: d._id.toString().substring(18).toUpperCase(), // Giả lập short ID
        image: d.hinhanh_url || 'https://storage.thuy-san.com/detect/tom_ruot_trang_1.jpg',
        heatmap: d.hinhanh_url || 'https://storage.thuy-san.com/detect/tom_ruot_trang_1.jpg',
        time: thoigian,
        date: ngaytao,
        disease: isKhỏeMạnh ? 'Khỏe mạnh' : (d.benh_info?.tenbenh ? d.benh_info.tenbenh.split('(')[0].trim() : 'Đốm trắng'),
        confidence: d.do_chinh_xac || 90,
        status: d.muc_do_canh_bao === 'Bình thường' ? 'Đã xác minh' : 'Đang chờ',
        device: 'Cam-Ao-01', // Tạm Hardcode theo mock
        recommendation: d.chuandoan_text || 'Khuyến nghị kiểm tra môi trường nước.'
      };
    });

    res.json(formattedLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy nhật ký', error: error.message });
  }
});

/**
 * GET /api/admin/inventory
 * Lấy danh sách sản phẩm từ SANPHAM với thông tin tồn kho
 */
router.get('/inventory', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { category, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category && category !== 'all') filter.loaisanpham = category;
    if (search) filter.tensanpham = { $regex: search, $options: 'i' };

    const total = await db.collection('SANPHAM').countDocuments(filter);
    const skip  = (parseInt(page) - 1) * parseInt(limit);

    const products = await db.collection('SANPHAM')
      .find(filter)
      .sort({ ngaytao: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const CATEGORY_LABELS = {
      dac_tri:               'Đặc trị',
      vi_sinh:               'Vi sinh',
      vi_sinh_moi_truong:    'Vi sinh MT',
      dinh_duong_de_khang:   'Dinh dưỡng',
    };

    const formatted = products.map(p => {
      const qty = p.soluong ?? 0;
      const status = qty === 0 ? 'het_hang' : qty <= 15 ? 'sap_het' : 'con_hang';
      const statusLabel = { het_hang: 'Hết hàng', sap_het: 'Sắp hết', con_hang: 'Còn hàng' }[status];
      return {
        id:       p._id.toString(),
        name:     p.tensanpham,
        brand:    p.thuonghieu,
        sku:      p._id.toString().slice(-8).toUpperCase(),
        category: CATEGORY_LABELS[p.loaisanpham] || p.loaisanpham,
        categoryKey: p.loaisanpham,
        qty,
        unit:     p.donvi || (p.loaisanpham === 'vi_sinh_moi_truong' ? 'gói' : p.loaisanpham === 'dac_tri' ? 'chai' : 'gói'),
        price:    p.gia,
        sold:     p.daban || 0,
        status,
        statusLabel,
        image:    (p.hinhanh && p.hinhanh[0]) || null,
      };
    });

    // Đếm sản phẩm sắp hết / hết hàng
    const lowStock = await db.collection('SANPHAM').countDocuments({ soluong: { $lte: 15 } });

    res.json({ products: formatted, total, page: parseInt(page), limit: parseInt(limit), lowStock });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy kho hàng', error: error.message });
  }
});

/**
 * GET /api/admin/orders
 * Lấy danh sách đơn hàng, join với NGUOIDUNG và CHITIETDONHANG
 */
router.get('/orders', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.trang_thai_don_hang = status;

    const total = await db.collection('DONHANG').countDocuments(filter);
    const skip  = (parseInt(page) - 1) * parseInt(limit);

    const orders = await db.collection('DONHANG').aggregate([
      { $match: filter },
      { $sort: { ngaytao: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'NGUOIDUNG',       localField: 'nguoidung_id', foreignField: '_id', as: 'user_info' } },
      { $lookup: { from: 'CHITIETDONHANG',  localField: '_id',          foreignField: 'donhang_id', as: 'items' } },
      { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
    ]).toArray();

    const STATUS_MAP = {
      cho_xac_nhan:   { label: 'Chờ xử lý',  color: 'warning' },
      dang_giao_hang: { label: 'Đang giao',   color: 'info'    },
      da_giao_hang:   { label: 'Đã giao',     color: 'success' },
      da_huy:         { label: 'Đã hủy',      color: 'error'   },
    };

    const PAYMENT_MAP = {
      chuyen_khoan:     'Chuyển khoản',
      'Chuyển khoản VNPay': 'VNPay',
      cod:              'COD',
      momo:             'MoMo',
    };

    const formatted = orders.map(o => {
      const st = STATUS_MAP[o.trang_thai_don_hang] || { label: o.trang_thai_don_hang, color: 'info' };
      const user = o.user_info;
      const name = o.thong_tin_nhan_hang?.nguoi_nhan || user?.ten || 'Khách hàng';
      const words = name.trim().split(/\s+/);
      const initials = words.length >= 2
        ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
      const location = o.thong_tin_nhan_hang?.diachi?.split(',').slice(-2).join(',').trim() || '—';
      const date = o.ngaytao ? new Date(o.ngaytao).toLocaleDateString('vi-VN') : '—';
      const payment = PAYMENT_MAP[o.phuong_thuc_thanh_toan] || o.phuong_thuc_thanh_toan || '—';

      return {
        id:           o._id.toString(),
        code:         o.mavandon || `DH-${o._id.toString().slice(-6).toUpperCase()}`,
        name,
        initials,
        location,
        date,
        totalItems:   o.items?.length || 0,
        total:        o.tong_tien_thanh_toan || 0,
        payment,
        paymentStatus: o.trang_thai_thanh_toan,
        status:       o.trang_thai_don_hang,
        statusLabel:  st.label,
        statusColor:  st.color,
        note:         o.ghi_chu,
      };
    });

    // Stats tổng quan
    const [totalAll, totalPending, totalDelivering, totalDone] = await Promise.all([
      db.collection('DONHANG').countDocuments(),
      db.collection('DONHANG').countDocuments({ trang_thai_don_hang: 'cho_xac_nhan' }),
      db.collection('DONHANG').countDocuments({ trang_thai_don_hang: 'dang_giao_hang' }),
      db.collection('DONHANG').countDocuments({ trang_thai_don_hang: 'da_giao_hang' }),
    ]);

    res.json({ orders: formatted, total, page: parseInt(page), limit: parseInt(limit), stats: { totalAll, totalPending, totalDelivering, totalDone } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy đơn hàng', error: error.message });
  }
});

module.exports = router;
