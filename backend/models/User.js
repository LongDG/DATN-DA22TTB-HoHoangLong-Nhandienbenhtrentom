const mongoose = require('mongoose');

// Schema cho địa chỉ (subdocument)
const diaChiSchema = new mongoose.Schema({
  macdinh: { type: Boolean, default: false },
  tennguoinhan: { type: String, required: true },
  sodienthoai: { type: String, required: true },
  sonha: { type: String, required: true },
  xa: { type: String, required: true },
  huyen: { type: String, required: true },
  tinh: { type: String, required: true },
});

// Schema chính cho User
const userSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  matkhau: { type: String }, // Có thể null nếu đăng nhập bằng Google
  sodienthoai: { type: String, default: '' },
  vaitro: { type: String, enum: ['user', 'admin'], default: 'user' },
  anhdaidien: { type: String, default: '' },
  googleId: { type: String, default: '' },
  diachi: [diaChiSchema],
  ngaytao: { type: Date, default: Date.now },
});

// Chỉ định rõ tên Collection là 'NGUOIDUNG' thay vì mặc định (users)
module.exports = mongoose.model('User', userSchema, 'NGUOIDUNG');