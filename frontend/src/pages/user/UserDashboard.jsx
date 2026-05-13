import React, { useState, useRef } from 'react';
import { 
  Dna as Biotech, 
  Search, 
  User, 
  ShoppingCart, 
  Camera, 
  Upload, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Share2,
  Play,
  Send,
  CheckCircle2,
  PhoneCall,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';

// --- Sub-components ---

const Header = ({ user, onLogout }) => (
  <header className="sticky top-0 w-full z-50 glass-panel border-b border-slate-200">
    <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Biotech className="w-6 h-6 text-primary" />
        </div>
        <span className="hidden md:block">Nhận diện bệnh tôm sú</span>
      </div>
      
      <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
        <a href="#" className="text-primary relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-primary">Chẩn đoán AI</a>
        <a href="#" className="hover:text-primary transition-colors">Cửa hàng thuốc</a>
        <a href="#" className="hover:text-primary transition-colors">Sổ tay kỹ thuật</a>
        <a href="#" className="hover:text-primary transition-colors">Liên hệ</a>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm..." className="bg-transparent border-none outline-none text-sm ml-2 w-32 focus:w-48 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          {user?.anhdaidien ? (
            <img src={user.anhdaidien} alt="User" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
          ) : (
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <User className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <span className="text-sm font-medium hidden md:block">{user?.ten || user?.name}</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors" title="Đăng xuất">
          <LogOut className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
          <ShoppingCart className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-amber-600 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </nav>
  </header>
);

const Hero = () => (
  <section className="relative min-h-[700px] flex items-center overflow-hidden bg-slate-900 border-b border-white/5">
    <div className="absolute inset-0 z-0">
      <img 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJK6DQ0ULDCE9RIQ3-KszpZtksQaGglLAvBHT_3LvZ1X7OlU7PGium2S0F-M3rnJdoZhSYhs1iF8cjqx6Biz8qVqXHSiMTW5xDQ69epT8D9eQbO7wk_3Dgrv8ArndCpTkIvzUdMDK5CoQX3NMS9DWTfi5DYxvVh3dSrZGsVt795V4Kt50M97GEs88uG9TuS9etN-RQ86TveIRPlACcIfBXCKI8hze-VtV0gP7CFTpJLyZO-rhIoBTOLI0MvbWBIoSihHJBy1qCYA" 
        alt="Shrimp pond" 
        className="w-full h-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent"></div>
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-xs font-bold tracking-wider">
          <CheckCircle2 className="w-4 h-4" />
          KIỂM ĐỊNH BẰNG AI
        </div>
        <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]">
          Giải Pháp AI <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Chẩn Đoán Bệnh Tôm
          </span> Tức Thì
        </h1>
        <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
          Công nghệ phân tích hình ảnh tiên tiến giúp người nuôi tôm chẩn đoán bệnh chính xác đến 98% chỉ trong vài giây, giảm thiểu rủi ro mất trắng.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="h-14 px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl shadow-amber-600/20 flex items-center gap-3 transition-all hover:scale-105">
            <Camera className="w-5 h-5" />
            QUÉT BỆNH NGAY
          </button>
          <button className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl backdrop-blur-md transition-all">
            Tìm hiểu thêm
          </button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="hidden lg:flex justify-end"
      >
        <div className="phone-mockup">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAeo6wqblkqghpzUlRwt0V5yKkK3Iy1r7tdggkcLyNfEG9ipBO50j8AtMFn5_YqKjHZJnp3MOA1lR9obw1vwruPfWkk9t1XDWREag06qE_p03iw4vCfyn4UOgrXfP8qo_k-z7f5gNEMZG6-owd2Y3_V2Ln4__w_fEalQdp_8jo7lhfVKPzKTIvCJp98g6wgheGmtF5Cc0NmieMKHNegkOE5_EAfA2vAu4TRBKv9a7ebvnBzfrBHP2YfX3vmFkZ6QPS9h1bpC2knQ" 
            alt="AI Scanning" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-48 h-48 border-2 border-primary/50 relative overflow-hidden rounded-3xl">
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_#005d90]"
              />
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
            </div>
            <div className="text-white text-xs font-bold tracking-[0.2em] bg-black/60 px-4 py-1.5 rounded-full uppercase">
              Đang phân tích...
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const DiagnosticSection = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
        <h2 className="text-4xl font-bold text-slate-900 font-sans">Chẩn đoán thông minh</h2>
        <p className="text-slate-500 text-lg">
          Kéo và thả hình ảnh tôm có dấu hiệu bệnh lý vào khu vực dưới đây để hệ thống AI bắt đầu phân tích kỹ thuật.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative p-16 border-2 border-dashed rounded-3xl transition-all cursor-pointer group flex flex-col items-center gap-6
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50 hover:border-primary hover:bg-slate-100'}
          `}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Tải lên hoặc kéo thả ảnh</h3>
            <p className="text-slate-500">Hỗ trợ JPG, PNG (Dung lượng tối đa: 10MB)</p>
          </div>
          <button className="mt-4 px-10 h-14 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/20">
            Chọn tệp tin
          </button>
        </div>
      </div>
    </section>
  );
};

const MarketStats = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Market Board */}
      <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold">Giá tôm thị trường</h3>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Cập nhật: 10 phút trước • Đồng Bằng Sông Cửu Long</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold animate-pulse">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
            TRỰC TIẾP
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cỡ tôm</th>
                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tôm Sú</th>
                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tôm Thẻ</th>
                <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Xu hướng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { size: '20 con/kg', su: '285,000đ', the: '165,000đ', trend: 'up', val: '+2,500' },
                { size: '30 con/kg', su: '240,000đ', the: '142,000đ', trend: 'up', val: '+1,800' },
                { size: '40 con/kg', su: '210,000đ', the: '135,000đ', trend: 'down', val: '-500' },
              ].map((row, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 font-bold text-slate-700">{row.size}</td>
                  <td className="py-5 text-primary font-bold">{row.su}</td>
                  <td className="py-5 text-primary font-bold">{row.the}</td>
                  <td className="py-5">
                    <span className={`inline-flex items-center gap-1 font-bold ${row.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                      {row.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {row.val}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust Cards */}
      <div className="space-y-6">
        <div className="bg-secondary p-8 rounded-3xl h-1/2 flex flex-col justify-center text-white relative overflow-hidden group">
          <ShieldCheck className="w-12 h-12 mb-4 text-white/50 group-hover:scale-110 transition-transform" />
          <h4 className="text-xl font-bold mb-2">An Toàn & Bảo Mật</h4>
          <p className="text-white/70 text-sm leading-relaxed">
            Dữ liệu trang trại và lịch sử thăm khám của bạn được mã hóa hoàn toàn và bảo vệ tuyệt đối trên hệ thống đám mây.
          </p>
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        <div className="bg-primary p-8 rounded-3xl h-1/2 flex flex-col justify-center text-white relative overflow-hidden group">
          <Users className="w-12 h-12 mb-4 text-white/50 group-hover:scale-110 transition-transform" />
          <h4 className="text-xl font-bold mb-2">Cộng Đồng 50,000+</h4>
          <p className="text-white/70 text-sm leading-relaxed">
            Mạng lưới người nuôi tôm thông minh tại Việt Nam, cùng chia sẻ giải pháp và kinh nghiệm phòng trị bệnh hiệu quả.
          </p>
          <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  </section>
);

const ProductStore = () => {
  const products = [
    {
      id: 1,
      name: "AquaShield WS-99",
      desc: "Diệt virus đốm trắng và tăng đề kháng cấp tốc cho tôm sú.",
      price: "450.000đ",
      oldPrice: "520.000đ",
      tag: "Đặc trị đốm trắng",
      tagColor: "bg-red-600",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDe7bSaF-knXz_qrFOgsVN7NKjstVaF7zZvKQ3NYrRioyUidXCF1ffgvz3Oii5yvm253wpKeqtho3MstK6yxs0vJypcX5zh_MmqiKYun_eny9wKXp5DnE6VHhM840XVDjFgYVGgMNc9LRnjQIq6ZTS3JpjPXXp7-rLOLhZw4oJXMYITweh7-jBsh7qaMeQlga3t9bKkAhWI0q9sBFOSbty4tqm4ghoGmBF-eesCPjvTb2oopBC5GrIGc3UTCirBusTYSnmMzrTIRg"
    },
    {
      id: 2,
      name: "Hepato-Clean Plus",
      desc: "Phục hồi chức năng gan, giải độc và ngừa bệnh gan tụy cấp.",
      price: "325.000đ",
      tag: "Hỗ trợ Gan Tụy",
      tagColor: "bg-green-700",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdIZ6lsDWTzMuicVRbB_LzmhDrW2gyV3KcHVDgFVs4RD02gkOI0YTkLE8cLznDRCdqKamgXTe7K0Eigi_8HcUEZfHw8tuzppApCjjgiJDv_mpObWVfKLvt9_7GXm7xdtA3bb3cocG2b1OBxjNK110u6AFNdUYlo1wW5t1OtP_q4VuO_hHA7LGqeHpYIL_76SCiF6ywSc9HkP5BKCb52EGoJX-IBl2OUVpsbF4M8BBXO_0xZijtdC_AUsi2zNQuxnd0PxBSWsjohw"
    },
    {
      id: 3,
      name: "BioMaster Pond",
      desc: "Làm sạch đáy ao, ổn định màu nước và ức chế vi khuẩn hại.",
      price: "210.000đ",
      tag: "Men vi sinh",
      tagColor: "bg-primary",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgodrjm2mnOv2ijZFQxXxtlbpRYgZtr8wmFZTzItd_BJDolH1xpm6T1J_IUiZKR-ipx6_M7m4yu-mBrYWpyc9DQ_792qRxAWvcTO10qQvbh3Ej7GymX4W9VoL7BhDrb68JiQWCxxnxJFSh2P-VBqjV3UZdoWSF1AJGtqxsXUGebkh-fymr0sGkKBI8JVvqc3XzRx_U6y9FBDQKyJJq1DnAM163_179MNvCMmi4FyyvpvuWhald8SyBb1hy41qwlIQzMdSRKTeWBg"
    },
    {
      id: 4,
      name: "Growth Booster C+",
      desc: "Tổng hợp khoáng và Vitamin thiết yếu giúp tôm nhanh lớn, vỏ bóng.",
      price: "185.000đ",
      tag: "Combo Vitamin",
      tagColor: "bg-amber-600",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwg1H0s1EUH7TcSSq6H77KaVoYVVUFXnoLm2M8s-XymwqKJsAZ_mfYtFuAk2cQ_hnxnBIOCeCJloenBXSSE6YWcMxsdvfO9neBMJZhFZlV6qo4FLfDQwH7EohcesIBTA6QWvcYvLMrgLHRlIaUjZ4mqw-I0dRmHI8S9RL-H1uxfOgmMSvOi0VsG_F9SHjxZbUhuohHSEJ-GvF2WNBKEQZvlzYAVDARuEN6my2qb_ZCxi6y4HyYPleQmpi8XkIBBwr6ORFf8gX7CA"
    }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-slate-900">Cửa hàng thuốc thủy sản</h2>
          <p className="text-slate-500 text-lg">Sản phẩm đặc trị & dinh dưỡng chất lượng cao được chuyên gia khuyên dùng.</p>
        </div>
        <a href="#" className="flex items-center gap-2 text-primary font-bold hover:translate-x-2 transition-transform">
          Xem tất cả sản phẩm <ArrowRight className="w-5 h-5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((p) => (
          <motion.div 
            key={p.id}
            whileHover={{ y: -10 }}
            className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="h-60 relative bg-slate-50 p-8 overflow-hidden">
              <img 
                src={p.img} 
                alt={p.name} 
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute top-4 left-4">
                <span className={`${p.tagColor} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                  {p.tag}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="h-28">
                <h4 className="text-xl font-bold text-slate-800 mb-2">{p.name}</h4>
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">{p.desc}</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{p.price}</p>
                  {p.oldPrice && <p className="text-xs text-slate-400 line-through">{p.oldPrice}</p>}
                </div>
                <button className="w-12 h-12 bg-slate-100 hover:bg-primary hover:text-white rounded-2xl flex items-center justify-center transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-white pt-24 pb-12 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
      <div className="space-y-6">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <Biotech className="w-8 h-8 text-primary" />
          <span>Nhận diện bầm tôm sú</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-sm">
          Tiên phong ứng dụng trí tuệ nhân tạo (AI) trong chẩn đoán và quản lý sức khỏe thủy sản tại Việt Nam.
        </p>
        <div className="flex gap-4">
          {[Share2, Play, Send].map((Icon, i) => (
            <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors">
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </div>
      
      <div>
        <h5 className="font-bold text-lg mb-8">Dịch vụ</h5>
        <ul className="space-y-4 text-slate-400 text-sm">
          <li><a href="#" className="hover:text-white transition-colors">Chẩn đoán AI</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Theo dõi giá tôm</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Tư vấn chuyên gia</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Cửa hàng thuốc</a></li>
        </ul>
      </div>

      <div>
        <h5 className="font-bold text-lg mb-8">Hỗ trợ khách hàng</h5>
        <ul className="space-y-4 text-slate-400 text-sm">
          <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Báo cáo sự cố</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Thư viện bệnh học</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Chính sách hoàn tiền</a></li>
        </ul>
      </div>

      <div className="space-y-6">
        <h5 className="font-bold text-lg mb-8">Liên hệ</h5>
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Hotline 24/7</p>
            <p className="text-white font-bold">1900 6789</p>
          </div>
        </div>
        <p className="text-slate-400 text-xs">
          Trụ sở: Tòa nhà TechHub, Quận 1, TP. Hồ Chí Minh, Việt Nam.
        </p>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 text-center text-slate-500 text-xs">
      &copy; 2024 Nhận diện bệnh tôm sú (Aquatic Health Intelligence). Bảo lưu mọi quyền.
    </div>
  </footer>
);

export default function UserDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={onLogout} />
      <main>
        <Hero />
        <DiagnosticSection />
        <MarketStats />
        <ProductStore />
      </main>
      <Footer />

      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-[#0068ff] text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 border-4 border-white"
      >
        <span className="absolute -top-2 -right-1 w-6 h-6 bg-red-600 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">2</span>
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQc90St0y5eUw9cYfQ_VNjLCShWq46gmgYLqngFb6MDnj2Uclw1g--11HWVJGc1DiwJdptWvVDGidAQS0QBfn5O9vFtg36hsDMmNIX6_LHDsKMQpDXQStkgMo3WbspWiVdug47GP148tBreoGJgmD7Ivkwhe48NsxTR8hsrPy5xm1cBpfnj4dbtfYVXaMtueYX3zFGXu_pAYcFehrjd7402oYNMINvSib5OmL6FavqYsWbAu-wUppjyYKndOtp_rzT1SCXbKR9qA" 
          alt="Zalo"
          className="w-8 h-8 invert brightness-0"
        />
      </motion.button>
    </div>
  );
}
