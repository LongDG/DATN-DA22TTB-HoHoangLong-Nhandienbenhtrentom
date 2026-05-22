/**
 * sseManager.js — Quản lý kết nối SSE (Server-Sent Events)
 *
 * Map: userId (string) → Set<res>
 * Cho phép 1 user mở nhiều tab/cửa sổ cùng lúc.
 */

const clients = new Map(); // Map<userId: string, Set<res>>

/**
 * Đăng ký kết nối SSE mới
 * @param {string} userId
 * @param {import('express').Response} res
 */
function register(userId, res) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
  console.log(`[SSE] ➕ User ${userId} kết nối (${clients.get(userId).size} tab)`);
}

/**
 * Xóa kết nối khi client disconnect
 * @param {string} userId
 * @param {import('express').Response} res
 */
function unregister(userId, res) {
  const set = clients.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
  }
  console.log(`[SSE] ➖ User ${userId} ngắt kết nối`);
}

/**
 * Gửi thông báo realtime đến user
 * @param {string} userId
 * @param {{ type: string, [key: string]: any }} data
 */
function notify(userId, data) {
  const id = userId?.toString();
  const set = clients.get(id);
  if (!set || set.size === 0) return; // User không online
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  set.forEach(res => {
    try { res.write(payload); } catch {}
  });
  console.log(`[SSE] 📨 Gửi thông báo → User ${id}`);
}

/** Số lượng user đang kết nối */
function getOnlineCount() { return clients.size; }

module.exports = { register, unregister, notify, getOnlineCount };
