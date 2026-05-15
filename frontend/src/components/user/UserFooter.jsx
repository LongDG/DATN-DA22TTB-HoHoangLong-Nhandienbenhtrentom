import { Share2, Play, Send, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  'Dịch vụ': [
    { label: 'Chẩn đoán AI',      to: '/home' },
    { label: 'Cửa hàng thuốc',    to: '/store' },
    { label: 'Theo dõi giá tôm',  to: '#' },
    { label: 'Tư vấn chuyên gia', to: '#' },
  ],
  'Hỗ trợ': [
    { label: 'Hướng dẫn sử dụng', to: '#' },
    { label: 'Báo cáo sự cố',     to: '#' },
    { label: 'Thư viện bệnh học', to: '#' },
    { label: 'Chính sách hoàn tiền', to: '#' },
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
          <div className="flex gap-3">
            {[Share2, Play, Send].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-[#0077b6] transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#0077b6]/20 flex items-center justify-center text-[#0077b6]">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hotline 24/7</p>
              <p className="text-white font-bold">1900 6789</p>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Trụ sở: Tòa nhà TechHub, Quận 1, TP. Hồ Chí Minh, Việt Nam.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 text-center text-slate-500 text-xs">
        © 2026 AquaHealth AI (Aquatic Health Intelligence). Bảo lưu mọi quyền.
      </div>
    </footer>
  );
}
