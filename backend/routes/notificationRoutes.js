/**
 * notificationRoutes.js
 * GET    /api/notifications         — Danh sách thông báo (auth required)
 * GET    /api/notifications/stream  — SSE realtime stream (token qua query ?token=)
 * PATCH  /api/notifications/read-all  — Đánh dấu tất cả đã đọc
 * PATCH  /api/notifications/:id/read  — Đánh dấu 1 thông báo đã đọc
 */

const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const jwt        = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');
const sseManager = require('../utils/sseManager');

// ─── GET /api/notifications/stream  (SSE — EventSource không gửi được header) ──
router.get('/stream', (req, res) => {
  // Verify JWT từ query param (EventSource API không hỗ trợ custom headers)
  const token = req.query.token;
  if (!token) return res.status(401).end();

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).end();
  }
  const userId = user.id?.toString();

  // ── Thiết lập SSE headers ──
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // tắt Nginx buffering nếu deploy
  res.flushHeaders();

  // Ping ngay để xác nhận kết nối
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  // Keep-alive mỗi 25 giây (tránh proxy timeout)
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 25_000);

  // Đăng ký vào SSE manager
  sseManager.register(userId, res);

  // Cleanup khi client đóng tab / mất mạng
  req.on('close', () => {
    clearInterval(keepAlive);
    sseManager.unregister(userId, res);
  });
});

// ─── Các routes còn lại cần authMiddleware ────────────────────────────────────
router.use(authMiddleware);

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const uid = req.user?.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const filter = uid ? { nguoidung_id: new ObjectId(uid) } : {};

    const [docs, unreadCount] = await Promise.all([
      db.collection('THONGBAO')
        .find(filter)
        .sort({ ngaytao: -1 })
        .limit(limit)
        .toArray(),
      db.collection('THONGBAO').countDocuments({ ...filter, da_doc: false }),
    ]);

    res.json({
      notifications: docs.map(d => ({
        id:       d._id.toString(),
        loai:     d.loai     || 'he_thong',
        tieu_de:  d.tieu_de  || 'Thông báo',
        noi_dung: d.noi_dung || '',
        da_doc:   d.da_doc   || false,
        lien_ket: d.lien_ket || null,
        ngaytao:  d.ngaytao,
      })),
      unread_count: unreadCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy thông báo', error: err.message });
  }
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
router.patch('/read-all', async (req, res) => {
  try {
    const db  = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const uid = req.user?.id;
    if (!uid) return res.status(401).json({ message: 'Chưa đăng nhập' });

    await db.collection('THONGBAO').updateMany(
      { nguoidung_id: new ObjectId(uid), da_doc: false },
      { $set: { da_doc: true, doc_luc: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi', error: err.message });
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('THONGBAO').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { da_doc: true, doc_luc: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi', error: err.message });
  }
});

module.exports = router;
