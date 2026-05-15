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

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Cấu hình CORS để Frontend (port 5173) có thể gọi API
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

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
app.use("/api/orders",     orderRoutes);    // Đặt hàng người dùng

app.get("/", (req, res) => {
  res.json({ message: "Backend Node.js is running (MVC Architecture)" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
