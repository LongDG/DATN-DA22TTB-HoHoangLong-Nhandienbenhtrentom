/**
 * authFetch — Wrapper fetch tự động gắn Bearer token từ localStorage
 * Dùng cho tất cả API calls cần xác thực
 */
export const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token') || '';
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });
};

export const API_BASE = 'http://localhost:5000/api';
