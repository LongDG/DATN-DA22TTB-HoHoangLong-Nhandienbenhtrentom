require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const passport = require("./config/passport"); // Lấy cấu hình passport đã tách
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes  = require("./routes/productRoutes");
const handbookRoutes = require("./routes/handbookRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const orderRoutes    = require("./routes/orderRoutes");    // Route đặt hàng người dùng
const shrimpPriceRoutes = require("./routes/shrimpPriceRoutes"); // Giá tôm
const diagnoseRoutes       = require('./routes/diagnoseRoutes');       // Chẩn đoán AI
const consultationRoutes   = require('./routes/consultationRoutes');   // Tư vấn (user)
const notificationRoutes   = require('./routes/notificationRoutes');   // Thông báo
const sepayRoutes          = require('./routes/sepayRoutes');           // Thanh toán SePay

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Cấu hình CORS để Frontend (port 5173) có thể gọi API
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Serve ảnh chẩn đoán đã upload
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Khởi tạo passport
app.use(passport.initialize());

// ==========================================
// ĐỊNH TUYẾN (ROUTES)
// ==========================================
app.use("/api/auth",       authRoutes);
app.use("/api/admin",      adminRoutes);
app.use("/api/products",   productRoutes);
app.use("/api/handbook",   handbookRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/shrimp-prices", shrimpPriceRoutes); // Giá tôm thị trường
app.use('/api/diagnose',        diagnoseRoutes);
app.use('/api/consultations',   consultationRoutes);
app.use('/api/notifications',   notificationRoutes);  // Thông báo user
app.use('/api/sepay',           sepayRoutes);           // Webhook thanh toán SePay

app.get("/", (req, res) => {
  res.json({ message: "Backend Node.js is running (MVC Architecture)" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// ══════════════════════════════════════════════════════════════════
// CRON JOB — Tự động hủy đơn chuyển khoản chưa thanh toán sau 2h
// Chạy mỗi 30 phút
// ══════════════════════════════════════════════════════════════════
const mongoose = require('mongoose');

async function autoCancelUnpaidOrders() {
  try {
    const db = mongoose.connection.db;
    if (!db) return; // DB chưa kết nối

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Tìm đơn chuyển khoản chưa thanh toán quá 2 giờ
    const result = await db.collection('DONHANG').updateMany(
      {
        trang_thai_thanh_toan: 'cho_thanh_toan',
        trang_thai_don_hang:   { $ne: 'da_huy' },
        ngaytao:               { $lte: twoHoursAgo },
      },
      {
        $set: {
          trang_thai_don_hang:  'da_huy',
          trang_thai_thanh_toan: 'het_han_thanh_toan',
          capnhat: new Date(),
        },
        $push: {
          lich_su_trang_thai: {
            trang_thai: 'da_huy',
            thoi_gian:  new Date(),
            ghi_chu:    'Tự động hủy: chưa thanh toán sau 2 giờ',
          },
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log(`[CRON] ⏰ Đã hủy ${result.modifiedCount} đơn chưa thanh toán quá 2 giờ`);
    }
  } catch (err) {
    console.error('[CRON] Lỗi auto-cancel:', err.message);
  }
}

// Chạy ngay lúc khởi động và mỗi 30 phút
setTimeout(autoCancelUnpaidOrders, 10_000); // Chờ 10s sau khi DB kết nối
setInterval(autoCancelUnpaidOrders, 30 * 60 * 1000);

