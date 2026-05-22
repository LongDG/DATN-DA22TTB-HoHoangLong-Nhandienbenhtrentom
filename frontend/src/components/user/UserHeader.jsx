import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Bell, User, LogOut, Menu, X,
  CheckCircle2, AlertTriangle, Info, Check,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

const NAV_LINKS = [
  { to: '/home',         label: 'Chẩn đoán AI',     end: true },
  { to: '/store',        label: 'Cửa hàng thuốc',   end: false },
  { to: '/handbook',     label: 'Sổ tay kỹ thuật',  end: false },
  { to: '/consult-user', label: 'Tư vấn',            end: false },
  { to: '/my-orders',    label: 'Đơn hàng',           end: false },
];

const LOAI_CFG = {
  chan_doan: { Icon: CheckCircle2, color: 'text-[#0077b6]', bg: 'bg-[#0077b6]/10' },
  don_hang:  { Icon: Info,         color: 'text-amber-600',  bg: 'bg-amber-50'      },
  he_thong:  { Icon: Info,         color: 'text-slate-500',  bg: 'bg-slate-100'     },
};

function fmtTime(iso) {
  if (!iso) return '';
  const diff = Math.round((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)    return 'Vừa xong';
  if (diff < 60)   return `${diff} phút trước`;
  if (diff < 1440) return `${Math.round(diff / 60)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

/* ── Notification Bell ── */
function NotificationBell() {
  const [open,         setOpen]        = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [unread,        setUnread]    = useState(0);
  const [loading,       setLoading]   = useState(false);
  const dropRef = useRef(null);

  const fetchNotifs = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/notifications?limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications || []);
      setUnread(data.unread_count  || 0);
    } catch {}
    finally { if (!silent) setLoading(false); }
  }, []);

  /* Lần đầu load + mở SSE realtime */
  useEffect(() => {
    fetchNotifs(); // Load lịch sử thông báo ngay

    const token = localStorage.getItem('token');
    if (!token) return;

    // Mở kết nối SSE — browser tự reconnect nếu mất mạng
    const es = new EventSource(
      `${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`
    );

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'notification' && data.notification) {
          // Thêm vào đầu danh sách ngay lập tức — không cần refresh
          setNotifs(prev => [data.notification, ...prev]);
          setUnread(prev => prev + 1);
        }
      } catch {}
    };

    es.onerror = () => {
      console.warn('[SSE] Kết nối bị gián đoạn, browser tự thử lại...');
    };

    return () => es.close(); // Đóng khi unmount
  }, [fetchNotifs]);

  /* Click ngoài → đóng */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => ({ ...n, da_doc: true })));
    setUnread(0);
  };

  const markRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, da_doc: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs(); }}
        className="relative p-2 text-slate-500 hover:bg-[#0077b6]/10 hover:text-[#0077b6] rounded-full transition-colors"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0077b6]" />
              <span className="font-bold text-sm text-slate-800">Thông báo</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#0077b6] hover:underline font-semibold flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-400">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = LOAI_CFG[n.loai] || LOAI_CFG.he_thong;
                const { Icon } = cfg;
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.da_doc) markRead(n.id); }}
                    className={`flex gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.da_doc ? 'bg-[#0077b6]/5' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-tight ${!n.da_doc ? 'text-slate-800' : 'text-slate-600'}`}>
                          {n.tieu_de}
                        </p>
                        {!n.da_doc && <span className="w-2 h-2 bg-[#0077b6] rounded-full shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.noi_dung}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{fmtTime(n.ngaytao)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Header ── */
export function UserHeader({ user, onLogout, cartCount = 0, onOpenCart }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/home" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0077b6] to-[#005d90] rounded-xl flex items-center justify-center shadow-md shadow-[#0077b6]/30 group-hover:shadow-[#0077b6]/50 transition-shadow">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3 C8 3, 14 6, 14 12 C14 18, 8 21, 8 21" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M16 3 C16 3, 10 6, 10 12 C10 18, 16 21, 16 21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <line x1="8.5"  y1="6.5"  x2="15.5" y2="5.5"  stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="9.5"  y1="10"   x2="14.5" y2="10"   stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="9.5"  y1="13.5" x2="14.5" y2="14"   stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="8.5"  y1="17.5" x2="15.5" y2="18.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="leading-tight">
            <span className="text-base font-extrabold text-[#0077b6] tracking-tight block">Nhận Diện</span>
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase block -mt-0.5">Bệnh Tôm Sú</span>
          </div>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'text-[#0077b6] bg-[#0077b6]/10'
                    : 'text-slate-600 hover:text-[#0077b6] hover:bg-slate-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#0077b6]/10 text-[#0077b6] px-3 py-2 rounded-xl font-semibold text-sm hover:bg-[#0077b6] hover:text-white transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* 🔔 Notification Bell (thay Package icon) */}
          <NotificationBell />

          {/* User */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {user?.anhdaidien ? (
              <img src={user.anhdaidien} alt={user.ten} className="w-8 h-8 rounded-full border border-slate-200 object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0077b6]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#0077b6]" />
              </div>
            )}
            <span className="text-sm font-semibold text-slate-700 hidden lg:block max-w-[120px] truncate">
              {user?.ten || user?.name || 'Tài khoản'}
            </span>
            <button
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive ? 'text-[#0077b6] bg-[#0077b6]/10' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
