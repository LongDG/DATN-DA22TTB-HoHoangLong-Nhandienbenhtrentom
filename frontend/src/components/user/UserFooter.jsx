import { PhoneCall, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  'Dịch vụ': [
    { label: 'Chẩn đoán AI',       to: '/home' },
    { label: 'Cửa hàng thuốc',     to: '/store' },
    { label: 'Sổ tay bệnh học',    to: '/handbook' },
    { label: 'Tư vấn chuyên gia',  to: '/consult-user' },
  ],
  'Khám phá': [
    { label: 'Trang chủ',          to: '/home' },
    { label: 'Sản phẩm nổi bật',   to: '/store' },
    { label: 'Đơn hàng của tôi',   to: '/my-orders' },
    { label: 'Tư vấn trực tuyến',  to: '/consult-user' },
  ],
};

export function UserFooter() {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

        {/* Brand */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0077b6] to-[#005d90] rounded-xl flex items-center justify-center shadow-md shadow-[#0077b6]/40">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <path d="M8 3 C8 3, 14 6, 14 12 C14 18, 8 21, 8 21" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M16 3 C16 3, 10 6, 10 12 C10 18, 16 21, 16 21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <line x1="8.5" y1="6.5"  x2="15.5" y2="5.5"  stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="9.5" y1="10"   x2="14.5" y2="10"   stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="9.5" y1="13.5" x2="14.5" y2="14"   stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="8.5" y1="17.5" x2="15.5" y2="18.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="leading-tight">
              <span className="text-base font-extrabold text-white tracking-tight block">Nhận Diện</span>
              <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase block -mt-0.5">Bệnh Tôm Sú</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tiên phong ứng dụng trí tuệ nhân tạo trong chẩn đoán và quản lý sức khỏe thủy sản tại Việt Nam.
          </p>
        </div>

        {/* Links */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h5 className="font-bold text-base mb-5">{title}</h5>
            <ul className="space-y-3">
              {links.map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-slate-400 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact */}
        <div>
          <h5 className="font-bold text-base mb-5">Liên hệ</h5>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#0077b6]/20 flex items-center justify-center text-[#0077b6] shrink-0 mt-0.5">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Điện thoại</p>
              <a href="tel:0383277120" className="text-white font-bold hover:text-[#38bdf8] transition-colors">
                0383 277 120
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#0077b6]/20 flex items-center justify-center text-[#0077b6] shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email</p>
              <a href="mailto:longho.28112003@gmail.com" className="text-white font-bold hover:text-[#38bdf8] transition-colors text-sm break-all">
                longho.28112003@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0077b6]/20 flex items-center justify-center text-[#0077b6] shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Địa chỉ</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Số 126, Nguyễn Thiện Thành,<br />
                Phường Hòa Thuận, Tỉnh Vĩnh Long
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 text-center text-slate-500 text-xs">
        © 2026 Nhận Diện Bệnh Tôm Sú. Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
