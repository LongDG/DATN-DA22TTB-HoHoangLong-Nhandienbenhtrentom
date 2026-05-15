import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Settings, LayoutDashboard, Microscope,
  Package, ShoppingCart, MessageSquare, Book, LogOut, Users, Tag,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin',             icon: LayoutDashboard, label: 'Tổng quan',         end: true },
  { to: '/admin/diagnostics', icon: Microscope,      label: 'Nhật ký chẩn đoán'  },
  { to: '/admin/inventory',   icon: Package,         label: 'Kho hàng'            },
  { to: '/admin/orders',      icon: ShoppingCart,    label: 'Đơn hàng'            },
  { to: '/admin/categories',  icon: Tag,             label: 'Danh mục'            },
  { to: '/admin/consult',     icon: MessageSquare,   label: 'Tư vấn'              },
  { to: '/admin/users',       icon: Users,           label: 'Người dùng'          },
  { to: '/admin/handbook',    icon: Book,            label: 'Sổ tay kỹ thuật'     },
];

function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-64 flex flex-col pt-20 bg-white border-r border-[#e1e3e4] z-30">
      <div className="px-6 mb-8">
        <h2 className="text-lg font-black text-[#0077b6]">Quản lý</h2>
        <p className="text-xs text-[#707881] uppercase tracking-wider mt-1">Cổng Bệnh Lý Tôm</p>
      </div>
      <div className="flex flex-col flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#e5f1f8] text-[#0077b6] border-r-4 border-[#0077b6]'
                  : 'text-[#707881] hover:bg-[#f3f4f5]'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between px-6 h-16 bg-white border-b border-[#e1e3e4] shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-[#0077b6]">AquaSense Admin</span>
        <div className="ml-8 hidden md:flex items-center bg-[#f3f4f5] px-4 py-2 rounded-full w-96 border border-[#bfc7d1]/30">
          <Search size={18} className="text-[#707881] mr-2" />
          <input
            type="text"
            placeholder="Tìm kiếm nhật ký..."
            className="bg-transparent border-none focus:outline-none text-sm w-full text-[#191c1d]"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-[#707881] hover:bg-[#f3f4f5] rounded-full relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-white" />
        </button>
        <button className="p-2 text-[#707881] hover:bg-[#f3f4f5] rounded-full">
          <Settings size={20} />
        </button>
        <div className="flex items-center gap-3 ml-2 border-l border-[#bfc7d1]/50 pl-4 py-1">
          <div className="h-8 w-8 rounded-full overflow-hidden border border-[#cde5ff]">
            <img
              src={user?.anhdaidien || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.ten || 'Admin')}&background=0077b6&color=fff`}
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-semibold text-[#191c1d] hidden md:block">{user?.ten || 'Admin'}</span>
          <button
            onClick={onLogout}
            className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6]/20 rounded-full active:scale-95 transition-all ml-1"
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="flex justify-between items-center px-8 py-4 bg-[#f8f9fa] border-t border-[#e1e3e4]">
      <span className="text-[#707881] text-xs uppercase tracking-tighter">© 2026 AquaSense. Hệ thống v3.0.0-stable</span>
      <div className="flex gap-6">
        <a href="#" className="text-[#707881] text-xs hover:text-[#0077b6] transition-colors">Trạng thái hệ thống</a>
        <a href="#" className="text-[#707881] text-xs hover:text-[#0077b6] transition-colors">Tài liệu API</a>
      </div>
    </footer>
  );
}

export default function AdminLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Header user={user} onLogout={onLogout} />
      <Sidebar />
      <main className="ml-64 pt-20 flex-1 px-8 py-6">
        <Outlet />
      </main>
      <footer className="ml-64">
        <Footer />
      </footer>
    </div>
  );
}
