const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

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
 * Đăng ký tài khoản mới
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { ten, sodienthoai, matkhau, email } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!ten || !sodienthoai || !matkhau) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existPhone = await User.findOne({ sodienthoai });
    if (existPhone) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }

    // Kiểm tra email đã tồn tại chưa (nếu có)
    if (email) {
      const existEmail = await User.findOne({ email });
      if (existEmail) {
        return res.status(400).json({ message: "Email đã được đăng ký" });
      }
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(matkhau, salt);

    // Tạo user mới
    const newUser = await User.create({
      ten,
      email: email || "",
      matkhau: hashedPassword,
      sodienthoai,
      vaitro: "user",
    });

    const token = generateToken(newUser);

    res.status(201).json({
      message: "Đăng ký thành công",
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
    console.error("Register error:", error);
    res.status(500).json({ message: "Lỗi server khi đăng ký" });
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

module.exports = {
  register,
  login,
  googleCallback,
  getMe,
};