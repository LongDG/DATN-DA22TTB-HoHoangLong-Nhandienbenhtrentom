import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
  { to: '/home',         label: 'Chẩn đoán AI',     end: true },
  { to: '/store',        label: 'Cửa hàng thuốc',   end: false },
  { to: '/handbook',     label: 'Sổ tay kỹ thuật',  end: false },
  { to: '/consult-user', label: 'Tư vấn',            end: false },
  { to: '/my-orders',    label: 'Đơn hàng',           end: false },
];

export function UserHeader({ user, onLogout, cartCount = 0, onOpenCart }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/home" className="flex items-center gap-2.5 shrink-0 group">
          {/* Khung vuông xanh với DNA xoắn */}
          <div className="w-9 h-9 bg-gradient-to-br from-[#0077b6] to-[#005d90] rounded-xl flex items-center justify-center shadow-md shadow-[#0077b6]/30 group-hover:shadow-[#0077b6]/50 transition-shadow">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Chuỗi gen DNA xoắn đôi */}
              {/* Sợi 1 - đường cong trái */}
              <path
                d="M8 3 C8 3, 14 6, 14 12 C14 18, 8 21, 8 21"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"
              />
              {/* Sợi 2 - đường cong phải */}
              <path
                d="M16 3 C16 3, 10 6, 10 12 C10 18, 16 21, 16 21"
                stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" fill="none"
              />
              {/* Cầu nối 1 */}
              <line x1="8.5" y1="6.5"  x2="15.5" y2="5.5"  stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              {/* Cầu nối 2 */}
              <line x1="9.5"  y1="10"   x2="14.5" y2="10"   stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              {/* Cầu nối 3 */}
              <line x1="9.5"  y1="13.5" x2="14.5" y2="14"   stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              {/* Cầu nối 4 */}
              <line x1="8.5" y1="17.5" x2="15.5" y2="18.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
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

          {/* My Orders shortcut */}
          <NavLink to="/my-orders"
            className="p-2 text-slate-500 hover:bg-[#0077b6]/10 hover:text-[#0077b6] rounded-full transition-colors"
            title="Đơn hàng của tôi">
            <Package className="w-5 h-5" />
          </NavLink>

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
