const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT token
 * Kiểm tra token trong header Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Không có token, truy cập bị từ chối' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

/**
 * Middleware kiểm tra quyền admin
 * Phải gọi SAU authMiddleware
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.vaitro === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập (chỉ admin)' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
