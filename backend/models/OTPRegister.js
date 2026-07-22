const mongoose = require('mongoose');

/**
 * Lưu OTP tạm thời cho luồng đăng ký tài khoản mới
 * TTL: tự xóa sau 5 phút
 */
const otpRegisterSchema = new mongoose.Schema({
  sodienthoai: { type: String, required: true, index: true },
  otp:         { type: String, required: true },
  pendingData: {
    ten:     { type: String, required: true },
    email:   { type: String, default: '' },
    matkhau: { type: String, required: true }, // đã hash
  },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // 5 phút
});

module.exports = mongoose.model('OTPRegister', otpRegisterSchema, 'OTP_REGISTER');
