const express = require("express");
const passport = require("passport");
const { register, login, googleCallback, getMe, forgotPassword, verifyOtp, resetPassword } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Đăng ký tài khoản mới
router.post("/register", register);

// Đăng nhập bằng phone + password
router.post("/login", login);

// Lấy thông tin user hiện tại (cần token)
router.get("/me", authMiddleware, getMe);

// ── Quên mật khẩu qua SĐT (OTP) ──
router.post("/forgot-password", forgotPassword);   // Bước 1: gửi OTP
router.post("/verify-otp",      verifyOtp);        // Bước 2: xác thực OTP
router.post("/reset-password",  resetPassword);    // Bước 3: đặt mật khẩu mới

// Api nhảy sang trang đăng nhập của Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Api hứng kết quả trả về từ Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/login?error=failed",
  }),
  googleCallback
);

module.exports = router;