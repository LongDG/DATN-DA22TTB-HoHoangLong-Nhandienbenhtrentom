const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const OTP  = require("../models/OTP");
const OTPRegister = require("../models/OTPRegister");
const { sendSms, msgOtp } = require('../utils/sms');

/**
 * Tạo mã OTP 6 chữ số ngẫu nhiên
 */
function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


/**
 * Tạo JWT token cho user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      ten: user.ten,
      vaitro: user.vaitro,
      anhdaidien: user.anhdaidien,
      sodienthoai: user.sodienthoai,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * Bước 1 đăng ký: Gửi OTP xác thực số điện thoại
 * POST /api/auth/register/send-otp
 * Body: { ten, sodienthoai, email, matkhau }
 */
const registerSendOtp = async (req, res) => {
  try {
    const { ten, sodienthoai, email, matkhau } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!ten || !sodienthoai || !matkhau) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (matkhau.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existPhone = await User.findOne({ sodienthoai });
    if (existPhone) {
      return res.status(400).json({ message: 'Số điện thoại đã được đăng ký' });
    }

    // Kiểm tra email đã tồn tại chưa (nếu có)
    if (email) {
      const existEmail = await User.findOne({ email });
      if (existEmail) {
        return res.status(400).json({ message: 'Email đã được đăng ký' });
      }
    }

    // Hash mật khẩu trước khi lưu tạm
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(matkhau, salt);

    // Xóa OTP cũ nếu có
    await OTPRegister.deleteMany({ sodienthoai });

    // Tạo OTP mới và lưu thông tin đăng ký tạm
    const otp = genOtp();
    await OTPRegister.create({
      sodienthoai,
      otp,
      pendingData: { ten, email: email || '', matkhau: hashedPassword },
    });

    // Gửi SMS qua TextBee
    await sendSms(sodienthoai, msgOtp(otp));

    res.json({
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp }),
    });
  } catch (error) {
    console.error('registerSendOtp error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi OTP' });
  }
};

/**
 * Bước 2 đăng ký: Xác thực OTP và tạo tài khoản
 * POST /api/auth/register
 * Body: { sodienthoai, otp }
 */
const register = async (req, res) => {
  try {
    const { sodienthoai, otp } = req.body;

    if (!sodienthoai || !otp) {
      return res.status(400).json({ message: 'Thiếu thông tin xác thực' });
    }

    // Tìm bản ghi OTP đăng ký
    const record = await OTPRegister.findOne({ sodienthoai });
    if (!record) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại.' });
    }
    if (record.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    const { ten, email, matkhau } = record.pendingData;

    // Kiểm tra lần cuối trước khi tạo user (tránh race condition)
    const existPhone = await User.findOne({ sodienthoai });
    if (existPhone) {
      await OTPRegister.deleteMany({ sodienthoai });
      return res.status(400).json({ message: 'Số điện thoại đã được đăng ký' });
    }

    // Tạo user mới
    const newUser = await User.create({
      ten,
      email,
      matkhau,
      sodienthoai,
      vaitro: 'user',
    });

    // Xóa OTP sau khi tạo user thành công
    await OTPRegister.deleteMany({ sodienthoai });

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        id: newUser._id,
        ten: newUser.ten,
        email: newUser.email,
        vaitro: newUser.vaitro,
        sodienthoai: newUser.sodienthoai,
        anhdaidien: newUser.anhdaidien,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

/**
 * Đăng nhập bằng số điện thoại + mật khẩu
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { sodienthoai, matkhau } = req.body;

    if (!sodienthoai || !matkhau) {
      return res.status(400).json({ message: "Vui lòng nhập số điện thoại và mật khẩu" });
    }

    // Tìm user theo số điện thoại
    const user = await User.findOne({ sodienthoai });
    if (!user) {
      return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    // Kiểm tra mật khẩu
    if (!user.matkhau) {
      return res.status(401).json({ message: "Tài khoản này đăng nhập bằng Google. Vui lòng sử dụng nút Google." });
    }

    const isMatch = await bcrypt.compare(matkhau, user.matkhau);
    if (!isMatch) {
      return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng" });
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.trangthai === 'inactive') {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    const token = generateToken(user);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        ten: user.ten,
        email: user.email,
        vaitro: user.vaitro,
        sodienthoai: user.sodienthoai,
        anhdaidien: user.anhdaidien,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập" });
  }
};

/**
 * Callback sau khi Google xác thực thành công
 */
const googleCallback = async (req, res) => {
  try {
    // Kiểm tra tài khoản có bị khóa không
    if (req.user && req.user.trangthai === 'inactive') {
      return res.redirect('http://localhost:5173/login?error=account_locked');
    }
    const token = generateToken(req.user);
    // Chuyển hướng về Frontend kèm token
    res.redirect(`http://localhost:5173/?token=${token}`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect("http://localhost:5173/login?error=server_error");
  }
};

/**
 * Lấy thông tin user hiện tại
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-matkhau");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

/**
 * Gửi OTP về số điện thoại để reset mật khẩu
 * POST /api/auth/forgot-password
 * Body: { sodienthoai }
 */
const forgotPassword = async (req, res) => {
  try {
    const { sodienthoai } = req.body;
    if (!sodienthoai) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    }

    // Kiểm tra số điện thoại có tồn tại không
    const user = await User.findOne({ sodienthoai });
    if (!user) {
      return res.status(404).json({ message: 'Số điện thoại chưa được đăng ký trong hệ thống' });
    }

    // Xóa OTP cũ nếu có
    await OTP.deleteMany({ sodienthoai });

    // Tạo OTP mới
    const otp = genOtp();
    await OTP.create({ sodienthoai, otp });

    // Gửi SMS qua TextBee
    await sendSms(sodienthoai, msgOtp(otp));

    res.json({
      message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
      // Chỉ trả về trong môi trường dev — xóa khi production
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp }),
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi OTP' });
  }
};

/**
 * Xác thực OTP
 * POST /api/auth/verify-otp
 * Body: { sodienthoai, otp }
 */
const verifyOtp = async (req, res) => {
  try {
    const { sodienthoai, otp } = req.body;
    if (!sodienthoai || !otp) {
      return res.status(400).json({ message: 'Thiếu thông tin xác thực' });
    }

    const record = await OTP.findOne({ sodienthoai });
    if (!record) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại.' });
    }
    if (record.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    // OTP đúng — đánh dấu đã xác minh (đổi otp thành "VERIFIED")
    record.otp = 'VERIFIED';
    await record.save();

    res.json({ message: 'Xác thực OTP thành công', verified: true });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ message: 'Lỗi server khi xác thực OTP' });
  }
};

/**
 * Đặt lại mật khẩu mới
 * POST /api/auth/reset-password
 * Body: { sodienthoai, matkhau_moi }
 */
const resetPassword = async (req, res) => {
  try {
    const { sodienthoai, matkhau_moi } = req.body;
    if (!sodienthoai || !matkhau_moi) {
      return res.status(400).json({ message: 'Thiếu thông tin' });
    }
    if (matkhau_moi.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Kiểm tra đã verify OTP chưa
    const record = await OTP.findOne({ sodienthoai, otp: 'VERIFIED' });
    if (!record) {
      return res.status(400).json({ message: 'Phiên xác thực không hợp lệ. Vui lòng thực hiện lại từ đầu.' });
    }

    // Hash mật khẩu mới
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(matkhau_moi, salt);

    await User.updateOne({ sodienthoai }, { matkhau: hashed });

    // Xóa record OTP
    await OTP.deleteMany({ sodienthoai });

    res.json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu' });
  }
};

/**
 * Cập nhật số điện thoại cho tài khoản Google (lần đầu đăng nhập)
 * PUT /api/auth/update-phone
 * Body: { sodienthoai }
 * Header: Authorization: Bearer <token>
 */
const updatePhone = async (req, res) => {
  try {
    const { sodienthoai } = req.body;

    if (!sodienthoai) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    }

    // Validate định dạng SĐT Việt Nam: 10 chữ số, bắt đầu bằng 0
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(sodienthoai.replace(/\s/g, ''))) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)' });
    }

    const cleanPhone = sodienthoai.replace(/\s/g, '');

    // Kiểm tra SĐT đã tồn tại chưa (user khác)
    const existPhone = await User.findOne({ sodienthoai: cleanPhone, _id: { $ne: req.user.id } });
    if (existPhone) {
      return res.status(400).json({ message: 'Số điện thoại đã được sử dụng bởi tài khoản khác' });
    }

    // Cập nhật SĐT
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { sodienthoai: cleanPhone },
      { new: true }
    ).select('-matkhau');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Tạo token mới có SĐT cập nhật
    const newToken = generateToken(updatedUser);

    res.json({
      message: 'Cập nhật số điện thoại thành công',
      token: newToken,
      user: {
        id: updatedUser._id,
        ten: updatedUser.ten,
        email: updatedUser.email,
        vaitro: updatedUser.vaitro,
        sodienthoai: updatedUser.sodienthoai,
        anhdaidien: updatedUser.anhdaidien,
      },
    });
  } catch (error) {
    console.error('updatePhone error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật số điện thoại' });
  }
};

module.exports = {
  register,
  registerSendOtp,
  login,
  googleCallback,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
  updatePhone,
};