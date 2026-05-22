const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendSms, msgOrderDelivered } = require('../utils/sms');
const sseManager = require('../utils/sseManager');

// Bảo vệ toàn bộ admin routes: phải đăng nhập và là admin
router.use(authMiddleware);
router.use(adminMiddleware);

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
 * GET /api/admin/low-stock
 * Sản phẩm tồn kho thấp (soluong <= threshold)
 * Query: threshold (default 15), limit (default 10)
 */
router.get('/low-stock', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const threshold = parseInt(req.query.threshold) || 15;
    const limit     = parseInt(req.query.limit)     || 10;

    const products = await db.collection('SANPHAM')
      .find({ soluong: { $lte: threshold }, soluong: { $gt: 0 } })
      .sort({ soluong: 1 })       // Ít nhất lên đầu
      .limit(limit)
      .toArray();

    const outOfStock = await db.collection('SANPHAM').countDocuments({ soluong: 0 });

    const CATEGORY_LABELS = {
      dac_tri:               'Đặc trị',
      vi_sinh:               'Vi sinh',
      vi_sinh_moi_truong:    'Vi sinh MT',
      dinh_duong_de_khang:   'Dinh dưỡng',
    };

    res.json({
      items: products.map(p => ({
        id:       p._id.toString(),
        name:     p.tensanpham || 'Sản phẩm',
        brand:    p.thuonghieu || '',
        qty:      p.soluong ?? 0,
        unit:     p.donvi || 'đơn vị',
        image:    (p.hinhanh && p.hinhanh[0]) || null,
        category: CATEGORY_LABELS[p.loaisanpham] || p.loaisanpham || '',
        // Cấp độ cảnh báo
        level:    p.soluong === 0 ? 'out' : p.soluong <= 5 ? 'critical' : 'low',
      })),
      outOfStock,
      threshold,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy tồn kho thấp', error: error.message });
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
 * Danh sách tư vấn
 * Query: ?status=&user_id= (user_id dùng để filter phiếu của 1 user cụ thể)
 */
router.get('/consultations', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { status, user_id } = req.query;
    const filter = {};
    if (status)  filter.trang_thai = status;
    if (user_id) {
      // Hỗ trợ cả ObjectId và string để tương thích dữ liệu cũ
      const conditions = [{ nguoidung_id: user_id }];
      try { conditions.push({ nguoidung_id: new ObjectId(user_id) }); } catch {}
      filter.$or = conditions;
    }
    const records = await db.collection('LIENHE')
      .find(filter)
      .sort({ ngaytao: -1 })
      .limit(100)
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
        _id: c._id.toString(),
        id:  c._id.toString(),
        nguoidung_id: c.nguoidung_id?.toString() || null,
        name, initials,
        ten_nguoidung: c.ten_nguoidung,
        location: `${c.vitri_tinh}, ${c.vitri_ao}`,
        vitri_tinh: c.vitri_tinh, vitri_ao: c.vitri_ao,
        noidung: c.noidung,
        message: c.noidung,
        lastMsg, time: timeAgo,
        ngaytao: c.ngaytao,
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
      _id:          doc._id.toString(),
      id:           doc._id.toString(),
      nguoidung_id: doc.nguoidung_id?.toString() || null,
      name:         doc.ten_nguoidung,
      ten_nguoidung: doc.ten_nguoidung,
      location:     `${doc.vitri_tinh}, ${doc.vitri_ao}`,
      vitri_tinh:   doc.vitri_tinh,
      vitri_ao:     doc.vitri_ao,
      noidung:      doc.noidung,
      noi_dung:     doc.noidung,
      ngaytao:      doc.ngaytao,
      status:       doc.trang_thai,
      trang_thai:   doc.trang_thai,
      tin_nhan: (doc.tin_nhan || []).map(m => ({
        vai_tro:  m.vai_tro,
        noi_dung: m.noi_dung,
        thoigian: m.thoigian,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy chi tiết tư vấn', error: error.message });
  }
});

/**
 * POST /api/admin/consultations
 * Tạo phiếu tư vấn mới (từ phía user)
 */
router.post('/consultations', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { ten_nguoidung, noidung, vitri_tinh, vitri_ao, nguoidung_id } = req.body;
    if (!ten_nguoidung || !noidung) return res.status(400).json({ message: 'Thiếu thông tin' });

    // Lưu nguoidung_id dưới dạng ObjectId để filter sau này dùng ObjectId khp
    let uid = null;
    if (nguoidung_id) {
      try { uid = new ObjectId(nguoidung_id); } catch { uid = nguoidung_id; }
    }

    const firstMsg = { vai_tro: 'nguoidung', noi_dung: noidung.trim(), thoigian: new Date() };
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
      ok: true,
      id:      result.insertedId.toString(),
      _id:     result.insertedId.toString(),
      message: 'Gửi yêu cầu thành công',
    });
  } catch (error) {
    console.error('Lỗi tạo phiếu:', error);
    res.status(500).json({ message: 'Lỗi tạo phiếu', error: error.message });
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
 * POST /api/admin/consultations/:id/reply-user
 * User gửi tin nhắn trong phiếu (vai_tro: 'nguoidung')
 */
router.post('/consultations/:id/reply-user', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { noi_dung } = req.body;
    if (!noi_dung?.trim()) return res.status(400).json({ message: 'Nội dung không được trống' });
    const newMsg = { vai_tro: 'nguoidung', noi_dung: noi_dung.trim(), thoigian: new Date() };
    await db.collection('LIENHE').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { tin_nhan: newMsg } }
    );
    res.json({ ok: true, tin_nhan: newMsg });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi gửi tin nhắn', error: error.message });
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
  const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
  const buildImgUrl = (d) => {
    if (d.cloud_url) return d.cloud_url;
    if (d.hinhanh_url) return `${SERVER_URL}${d.hinhanh_url}`;
    return null;
  };
  try {
    const db = mongoose.connection.db;
    const {
      disease       = '',     // Lọc theo bệnh: 'Khỏe mạnh' | 'dom_trang' | 'gan_tuy' | ''
      min_confidence = 0,     // Độ tin cậy tối thiểu (0-100)
      date_range    = 'all',  // 'today' | '7days' | '30days' | 'all'
      status        = '',     // 'Đang chờ' | 'Đã xác minh' | 'Sai lệch' | ''
      page          = 1,
      limit         = 20,
    } = req.query;

    // ── Bộ lọc thời gian ──
    const matchStage = {};
    const now = new Date();
    if (date_range === 'today') {
      const start = new Date(now); start.setHours(0,0,0,0);
      matchStage.ngay_nhan_dien = { $gte: start };
    } else if (date_range === '7days') {
      matchStage.ngay_nhan_dien = { $gte: new Date(now - 7 * 86400_000) };
    } else if (date_range === '30days') {
      matchStage.ngay_nhan_dien = { $gte: new Date(now - 30 * 86400_000) };
    }

    // ── Độ tin cậy ──
    const minConf = parseInt(min_confidence) || 0;
    if (minConf > 0) matchStage.do_chinh_xac = { $gte: minConf };

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'BENH',
          localField: 'ketqua_benh_id',
          foreignField: '_id',
          as: 'benh_info',
        },
      },
      { $unwind: { path: '$benh_info', preserveNullAndEmptyArrays: true } },
      { $sort: { ngay_nhan_dien: -1 } },
    ];

    const allDiagnostics = await db.collection('KETQUANHANDIEN').aggregate(pipeline).toArray();

    // ── Map format ──
    let formattedLogs = allDiagnostics.map(d => {
      const isKhoeMạnh = !d.benh_info || (d.chuandoan_text || '').includes('Khỏe mạnh');
      let thoigian = '00:00', ngaytao = 'N/A';
      if (d.ngay_nhan_dien) {
        const dObj = new Date(d.ngay_nhan_dien);
        thoigian = dObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        ngaytao  = dObj.toLocaleDateString('vi-VN');
      }
      const diseaseName = isKhoeMạnh
        ? 'Khỏe mạnh'
        : (d.benh_info?.tenbenh ? d.benh_info.tenbenh.split('(')[0].trim() : 'Đốm trắng');

      // Trạng thái xác minh
      let logStatus = 'Đang chờ';
      if (d.trang_thai_xacminh === 'da_xac_minh') logStatus = 'Đã xác minh';
      else if (d.trang_thai_xacminh === 'sai_lech') logStatus = 'Sai lệch';
      else if (d.muc_do_canh_bao === 'Bình thường') logStatus = 'Đã xác minh';

      return {
        _rawDate:   d.ngay_nhan_dien,
        id:         d._id.toString().substring(18).toUpperCase(),
        fullId:     d._id.toString(),
        image:      buildImgUrl(d),
        heatmap:    buildImgUrl(d),
        time:       thoigian,
        date:       ngaytao,
        disease:    diseaseName,
        confidence: d.do_chinh_xac || 90,
        status:     logStatus,
        device:     d.thiet_bi || 'Cam-Ao-01',
        recommendation: d.chuandoan_text || 'Khuyến nghị kiểm tra môi trường nước.',
        correctedDisease: d.chuandoan_sua || null,
        note:       d.admin_note || '',
      };
    });

    // ── Lọc bệnh (client-friendly disease name filter) ──
    if (disease) {
      const dLower = disease.toLowerCase();
      formattedLogs = formattedLogs.filter(l => {
        if (dLower === 'khoe_manh' || dLower === 'khỏe mạnh') return l.disease === 'Khỏe mạnh';
        if (dLower === 'dom_trang' || dLower === 'đốm trắng') return l.disease.toLowerCase().includes('đốm trắng') || l.disease.toUpperCase().includes('WSSV');
        if (dLower === 'gan_tuy'   || dLower === 'gan tụy')   return l.disease.toLowerCase().includes('gan') || l.disease.includes('AHPND') || l.disease.includes('EMS');
        // match trực tiếp
        return l.disease.toLowerCase().includes(dLower);
      });
    }

    // ── Lọc trạng thái ──
    if (status) {
      formattedLogs = formattedLogs.filter(l => l.status === status);
    }

    // ── Phân trang ──
    const total     = formattedLogs.length;
    const skip      = (parseInt(page) - 1) * parseInt(limit);
    const paginated = formattedLogs.slice(skip, skip + parseInt(limit));

    res.json({ logs: paginated, total, page: parseInt(page), totalPages: Math.max(1, Math.ceil(total / parseInt(limit))) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy nhật ký', error: error.message });
  }
});

/**
 * PUT /api/admin/diagnostics/:id/verify
 * Xác nhận kết quả chẩn đoán AI
 * body: { action: 'correct' | 'update', corrected_disease?: string, note?: string }
 */
router.put('/diagnostics/:id/verify', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { action, corrected_disease, note } = req.body;

    if (!['correct', 'update'].includes(action)) {
      return res.status(400).json({ message: 'action phải là "correct" hoặc "update"' });
    }

    // Tìm theo _id đầy đủ hoặc substring match
    let record;
    // Thử tìm theo ObjectId đầy đủ (nếu id là ObjectId)
    const all = await db.collection('KETQUANHANDIEN').find({}).toArray();
    record = all.find(r => r._id.toString().toUpperCase().endsWith(req.params.id.toUpperCase())
                       || r._id.toString() === req.params.id);

    if (!record) return res.status(404).json({ message: 'Không tìm thấy bản ghi chẩn đoán' });

    const updateFields = {
      admin_verified:     true,
      admin_action:       action,           // 'correct' hoặc 'update'
      admin_note:         note || '',
      admin_verified_at:  new Date(),
      // Trạng thái mới
      trang_thai_xacminh: action === 'correct' ? 'da_xac_minh' : 'sai_lech',
    };

    if (action === 'update' && corrected_disease?.trim()) {
      updateFields.chuandoan_sua = corrected_disease.trim();
    }

    await db.collection('KETQUANHANDIEN').updateOne(
      { _id: record._id },
      { $set: updateFields }
    );

    // ── Gửi thông báo cho người dùng ──
    if (record.nguoidung_id) {
      const isCorrect  = action === 'correct';
      const diseaseName = corrected_disease?.trim() || record.ten_benh || 'Không rõ';
      const tieu_de = isCorrect
        ? '✅ Kết quả chẩn đoán đã được xác minh'
        : '⚠️ Kết quả chẩn đoán cần điều chỉnh';
      const noi_dung = isCorrect
        ? `Admin đã xác nhận kết quả AI là chính xác: "${record.ten_benh || 'Khỏe mạnh'}". Bạn có thể xem lại lịch sử chẩn đoán.`
        : `Admin đã xác nhận kết quả AI không chính xác. Chẩn đoán đúng là: "${diseaseName}". Vui lòng tham khảo ý kiến chuyên gia.`;
      try {
        const notifDoc = {
          nguoidung_id: record.nguoidung_id,
          loai:         'chan_doan',
          tieu_de,
          noi_dung,
          da_doc:       false,
          lien_ket:     '/home',
          ngaytao:      new Date(),
        };
        const inserted = await db.collection('THONGBAO').insertOne(notifDoc);

        // ── Push SSE realtime ──
        sseManager.notify(record.nguoidung_id.toString(), {
          type: 'notification',
          notification: {
            id:       inserted.insertedId.toString(),
            loai:     notifDoc.loai,
            tieu_de:  notifDoc.tieu_de,
            noi_dung: notifDoc.noi_dung,
            da_doc:   false,
            lien_ket: notifDoc.lien_ket,
            ngaytao:  notifDoc.ngaytao,
          },
        });
      } catch (notifErr) {
        console.error('[NOTIFY] Lỗi tạo thông báo:', notifErr.message);
      }
    }

    res.json({
      ok: true,
      message: action === 'correct' ? 'Đã xác nhận kết quả chính xác' : 'Đã cập nhật chẩn đoán mới',
      new_status: action === 'correct' ? 'Đã xác minh' : 'Sai lệch',
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xác minh', error: error.message });
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
    // Tìm kiếm theo tên hoặc SĐT
    if (search) {
      filter.$or = [
        { ho_ten:        { $regex: search, $options: 'i' } },
        { so_dien_thoai: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await db.collection('DONHANG').countDocuments(filter);
    const skip  = (parseInt(page) - 1) * parseInt(limit);

    // san_pham đã embedded trong DONHANG — không cần lookup CHITIETDONHANG
    const orders = await db.collection('DONHANG').aggregate([
      { $match: filter },
      { $sort: { ngay_tao: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'NGUOIDUNG', localField: 'user_id', foreignField: '_id', as: 'user_info' } },
      { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
    ]).toArray();

    const STATUS_MAP = {
      cho_xac_nhan:   { label: 'Chờ xử lý',  color: 'warning' },
      dang_giao_hang: { label: 'Đang giao',   color: 'info'    },
      da_giao_hang:   { label: 'Đã giao',     color: 'success' },
      da_huy:         { label: 'Đã hủy',      color: 'error'   },
    };

    const PAYMENT_MAP = {
      chuyen_khoan: 'Chuyển khoản',
      vnpay:        'VNPay',
      cod:          'COD',
      momo:         'MoMo',
    };

    const formatted = orders.map(o => {
      const st = STATUS_MAP[o.trang_thai_don_hang] || { label: o.trang_thai_don_hang, color: 'info' };

      // Tên: ưu tiên field trực tiếp trong đơn, fallback user_info
      const name     = o.ho_ten || o.user_info?.ten || 'Khách hàng';
      const words    = name.trim().split(/\s+/);
      const initials = words.length >= 2
        ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();

      // Địa chỉ rút gọn
      const parts    = [o.dia_chi, o.tinh_thanh].filter(Boolean);
      const location = parts.length ? parts.slice(-2).join(', ') : '—';

      // Ngày tạo — field thực tế là ngay_tao
      const rawDate  = o.ngay_tao || o.ngaytao;
      const date     = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '—';

      // Thanh toán
      const pttt    = o.phuong_thuc_tt || o.phuong_thuc_thanh_toan || '';
      const payment = PAYMENT_MAP[pttt.toLowerCase()] || pttt || '—';

      // Sản phẩm nhúng
      const sanPham  = Array.isArray(o.san_pham) ? o.san_pham : [];

      return {
        id:           o._id.toString(),
        code:         o.ma_don_hang || o.mavandon || ('DH-' + o._id.toString().slice(-6).toUpperCase()),
        name,
        phone:        o.so_dien_thoai || o.user_info?.sodienthoai || '',
        initials,
        location,
        date,
        totalItems:   sanPham.length,
        total:        o.tong_tien || o.tong_tien_thanh_toan || 0,
        payment,
        paymentStatus: o.trang_thai_tt || o.trang_thai_thanh_toan || '',
        status:       o.trang_thai_don_hang,
        statusLabel:  st.label,
        statusColor:  st.color,
        note:         o.ghi_chu || '',
        // Trả về sản phẩm cho frontend hiển thị
        items: sanPham.map(sp => ({
          name:  sp.ten_san_pham || sp.tensanpham || 'Sản phẩm',
          qty:   sp.so_luong || sp.soluong || 1,
          price: sp.don_gia || sp.gia || 0,
          image: Array.isArray(sp.hinhanh) ? sp.hinhanh[0] : (sp.hinhanh || null),
        })),
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


// ═══════════════════════════════════════════════════
// INVENTORY CRUD
// ═══════════════════════════════════════════════════

/** POST /api/admin/inventory — Thêm sản phẩm mới */
router.post('/inventory', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const {
      tensanpham, thuonghieu, loaisanpham, soluong, gia, donvi, mota,
      goc_thuoc, congdung, lieudung, hinhanh, trangthai, muc_dich_su_dung,
    } = req.body;
    if (!tensanpham?.trim() || !loaisanpham) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: tên sản phẩm và danh mục' });
    }
    const doc = {
      tensanpham:        tensanpham.trim(),
      thuonghieu:        thuonghieu?.trim()  || '',
      loaisanpham,
      soluong:           parseInt(soluong)   || 0,
      gia:               parseFloat(gia)     || 0,
      donvi:             donvi               || 'gói',
      mota:              mota?.trim()        || '',
      goc_thuoc:         goc_thuoc?.trim()   || '',
      congdung:          Array.isArray(congdung) ? congdung : [],
      lieudung:          lieudung && typeof lieudung === 'object'
                           ? { dinh_ky: lieudung.dinh_ky || '', xu_ly_benh: lieudung.xu_ly_benh || '' }
                           : { dinh_ky: '', xu_ly_benh: '' },
      hinhanh:           Array.isArray(hinhanh) ? hinhanh : (hinhanh ? [hinhanh] : []),
      trangthai:         trangthai           || 'dang_ban',
      muc_dich_su_dung:  Array.isArray(muc_dich_su_dung) ? muc_dich_su_dung : [],
      daban:             0,
      ngaytao:           new Date(),
    };
    const result = await db.collection('SANPHAM').insertOne(doc);
    res.json({ ok: true, id: result.insertedId.toString(), message: 'Thêm sản phẩm thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi thêm sản phẩm', error: error.message });
  }
});

/** PUT /api/admin/inventory/:id — Cập nhật sản phẩm */
router.put('/inventory/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const {
      tensanpham, thuonghieu, loaisanpham, soluong, gia, donvi, mota,
      goc_thuoc, congdung, lieudung, hinhanh, trangthai, muc_dich_su_dung,
    } = req.body;
    const update = { capnhat: new Date() };
    if (tensanpham    !== undefined) update.tensanpham        = tensanpham.trim();
    if (thuonghieu    !== undefined) update.thuonghieu        = thuonghieu.trim();
    if (loaisanpham   !== undefined) update.loaisanpham       = loaisanpham;
    if (soluong       !== undefined) update.soluong           = parseInt(soluong)  || 0;
    if (gia           !== undefined) update.gia               = parseFloat(gia)    || 0;
    if (donvi         !== undefined) update.donvi             = donvi;
    if (mota          !== undefined) update.mota              = mota.trim();
    if (goc_thuoc     !== undefined) update.goc_thuoc         = goc_thuoc.trim();
    if (trangthai     !== undefined) update.trangthai         = trangthai;
    if (Array.isArray(congdung))          update.congdung          = congdung;
    if (Array.isArray(muc_dich_su_dung))  update.muc_dich_su_dung  = muc_dich_su_dung;
    if (Array.isArray(hinhanh))           update.hinhanh           = hinhanh;
    if (lieudung && typeof lieudung === 'object') {
      update.lieudung = { dinh_ky: lieudung.dinh_ky || '', xu_ly_benh: lieudung.xu_ly_benh || '' };
    }
    await db.collection('SANPHAM').updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ ok: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi cập nhật sản phẩm', error: error.message });
  }
});

/** DELETE /api/admin/inventory/:id — Xóa sản phẩm */
router.delete('/inventory/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('SANPHAM').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ORDERS — cập nhật trạng thái
// ═══════════════════════════════════════════════════

/** PATCH /api/admin/orders/:id/status — Đổi trạng thái đơn hàng */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { trang_thai } = req.body;
    const VALID = ['cho_xac_nhan', 'dang_giao_hang', 'da_giao_hang', 'da_huy'];
    if (!VALID.includes(trang_thai)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });

    // Lấy thông tin đơn trước khi cập nhật (cần SĐT và tên để gửi SMS)
    const order = await db.collection('DONHANG').findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    await db.collection('DONHANG').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { trang_thai_don_hang: trang_thai, capnhat: new Date() } }
    );

    // ── Gửi SMS xác nhận khi đơn hàng đã giao thành công ──
    if (trang_thai === 'da_giao_hang') {
      const phone  = order.so_dien_thoai || order.thong_tin_nhan_hang?.sodienthoai;
      const hoTen  = order.ho_ten || order.thong_tin_nhan_hang?.nguoi_nhan || 'Quý khách';
      const maDon  = order.ma_don_hang || ('DH' + order._id.toString().slice(-6).toUpperCase());
      const tongTien  = order.tong_tien || order.tong_tien_thanh_toan || 0;
      const sanPham   = order.san_pham?.[0]?.ten_san_pham || 'sản phẩm';

      if (phone) {
        sendSms(phone, msgOrderDelivered({
          maDon,
          hoTen,
          tongTien,
          sanPhamDau: sanPham,
        })).catch(err => console.error('[SMS delivery]', err.message));
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
});

/** GET /api/admin/orders/:id — Chi tiết đơn hàng */
router.get('/orders/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    // san_pham đã embedded trong DONHANG
    const o = await db.collection('DONHANG').findOne({ _id: new ObjectId(req.params.id) });
    if (!o) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const rawDate = o.ngay_tao || o.ngaytao;
    const pttt    = o.phuong_thuc_tt || o.phuong_thuc_thanh_toan || '';
    const sanPham = Array.isArray(o.san_pham) ? o.san_pham : [];

    res.json({
      id:           o._id.toString(),
      code:         o.ma_don_hang || o.mavandon || ('DH-' + o._id.toString().slice(-6).toUpperCase()),
      name:         o.ho_ten || 'Khách hàng',
      phone:        o.so_dien_thoai || '',
      address:      [o.dia_chi, o.tinh_thanh].filter(Boolean).join(', '),
      date:         rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : '—',
      status:       o.trang_thai_don_hang,
      payment:      pttt,
      paymentStatus: o.trang_thai_tt || o.trang_thai_thanh_toan || '',
      total:        o.tong_tien || o.tong_tien_thanh_toan || 0,
      note:         o.ghi_chu || '',
      items: sanPham.map(sp => ({
        id:    sp.san_pham_id?.toString() || '',
        name:  sp.ten_san_pham || sp.tensanpham || 'Sản phẩm',
        qty:   sp.so_luong || sp.soluong || 1,
        price: sp.don_gia || sp.gia || 0,
        image: Array.isArray(sp.hinhanh) ? sp.hinhanh[0] : (sp.hinhanh || null),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy chi tiết đơn hàng', error: error.message });
  }
});

// ═══════════════════════════════════════════════════
// USERS — Quản lý người dùng
// ═══════════════════════════════════════════════════

/** GET /api/admin/users — Danh sách người dùng */
router.get('/users', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { search, page = 1, limit = 10, role } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { ten: { $regex: search, $options: 'i' } },
      { sodienthoai: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role && role !== 'all') filter.vaitro = role;
    const total = await db.collection('NGUOIDUNG').countDocuments(filter);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await db.collection('NGUOIDUNG').find(filter)
      .sort({ ngaytao: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    const formatted = users.map(u => ({
      id: u._id.toString(),
      ten: u.ten || 'Người dùng',
      email: u.email || '',
      sodienthoai: u.sodienthoai || '',
      vaitro: u.vaitro || 'user',
      trangthai: u.trangthai || 'active',
      anhdaidien: u.anhdaidien || null,
      ngaytao: u.ngaytao ? new Date(u.ngaytao).toLocaleDateString('vi-VN') : '—',
      vitri: u.vitri_tinh || '',
    }));
    res.json({ users: formatted, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi lấy người dùng', error: error.message });
  }
});

/** PUT /api/admin/users/:id — Cập nhật người dùng (role, status) */
router.put('/users/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const { ten, email, vaitro, trangthai } = req.body;
    const update = { capnhat: new Date() };
    if (ten !== undefined) update.ten = ten;
    if (email !== undefined) update.email = email;
    if (vaitro !== undefined) update.vaitro = vaitro;
    if (trangthai !== undefined) update.trangthai = trangthai;
    await db.collection('NGUOIDUNG').updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi cập nhật người dùng', error: error.message });
  }
});

/** DELETE /api/admin/users/:id — Xóa người dùng */
router.delete('/users/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('NGUOIDUNG').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi xóa người dùng', error: error.message });
  }
});

module.exports = router;

