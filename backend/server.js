require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const passport = require("./config/passport"); // Lấy cấu hình passport đã tách
const authRoutes = require("./routes/authRoutes"); // Lấy các route liên quan đến xác thực
const adminRoutes = require("./routes/adminRoutes"); // Lấy các route dành cho admin

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
app.use("/api/auth", authRoutes); // Gắn các route của auth chạy qua tiền tố /api/auth
app.use("/api/admin", adminRoutes); // Gắn các route admin

app.get("/", (req, res) => {
  res.json({ message: "Backend Node.js is running (MVC Architecture)" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
