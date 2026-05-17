const mongoose = require('mongoose');

/**
 * Lưu OTP tạm thời cho reset mật khẩu qua SĐT
 * TTL: tự xóa sau 5 phút
 */
const otpSchema = new mongoose.Schema({
  sodienthoai: { type: String, required: true, index: true },
  otp:         { type: String, required: true },
  createdAt:   { type: Date, default: Date.now, expires: 300 }, // 5 phút
});

module.exports = mongoose.model('OTP', otpSchema, 'OTP_RESET');
