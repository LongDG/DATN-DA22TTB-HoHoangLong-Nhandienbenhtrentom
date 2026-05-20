import { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Camera, Upload, ShieldCheck, Users, TrendingUp, TrendingDown,
  ArrowRight, Share2, Play, Send, ShoppingCart, CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';

/* ── Hero ── */
function Hero() {
  return (
    <section className="relative min-h-[700px] flex items-center overflow-hidden bg-slate-900 border-b border-white/5">
      <div className="absolute inset-0 z-0">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJK6DQ0ULDCE9RIQ3-KszpZtksQaGglLAvBHT_3LvZ1X7OlU7PGium2S0F-M3rnJdoZhSYhs1iF8cjqx6Biz8qVqXHSiMTW5xDQ69epT8D9eQbO7wk_3Dgrv8ArndCpTkIvzUdMDK5CoQX3NMS9DWTfi5DYxvVh3dSrZGsVt795V4Kt50M97GEs88uG9TuS9etN-RQ86TveIRPlACcIfBXCKI8hze-VtV0gP7CFTpJLyZO-rhIoBTOLI0MvbWBIoSihHJBy1qCYA"
          alt="Shrimp pond"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2c694e]/20 text-[#aeeecb] border border-[#2c694e]/30 rounded-full text-xs font-bold tracking-wider">
            <CheckCircle2 className="w-4 h-4" /> KIỂM ĐỊNH BẰNG AI
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]">
            Giải Pháp AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0077b6] to-blue-400">
              Chẩn Đoán Bệnh Tôm
            </span> Tức Thì
          </h1>
          <p className="text-lg text-slate-300 max-w-lg leading-relaxed">
            Công nghệ phân tích hình ảnh tiên tiến giúp người nuôi tôm chẩn đoán bệnh chính xác đến 98% chỉ trong vài giây.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="h-14 px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl shadow-amber-600/20 flex items-center gap-3 transition-all hover:scale-105">
              <Camera className="w-5 h-5" /> QUÉT BỆNH NGAY
            </button>
            <button className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl backdrop-blur-md transition-all">
              Tìm hiểu thêm
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="hidden lg:flex justify-end">
          <div className="relative w-72 h-[520px] bg-slate-800 rounded-[48px] border-4 border-slate-700 overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAeo6wqblkqghpzUlRwt0V5yKkK3Iy1r7tdggkcLyNfEG9ipBO50j8AtMFn5_YqKjHZJnp3MOA1lR9obw1vwruPfWkk9t1XDWREag06qE_p03iw4vCfyn4UOgrXfP8qo_k-z7f5gNEMZG6-owd2Y3_V2Ln4__w_fEalQdp_8jo7lhfVKPzKTIvCJp98g6wgheGmtF5Cc0NmieMKHNegkOE5_EAfA2vAu4TRBKv9a7ebvnBzfrBHP2YfX3vmFkZ6QPS9h1bpC2knQ"
              alt="AI Scanning"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-48 h-48 border-2 border-[#0077b6]/50 relative overflow-hidden rounded-3xl">
                <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute left-0 w-full h-[2px] bg-[#0077b6] shadow-[0_0_15px_#0077b6]" />
                {[['top-0 left-0 border-t-4 border-l-4'], ['top-0 right-0 border-t-4 border-r-4'], ['bottom-0 left-0 border-b-4 border-l-4'], ['bottom-0 right-0 border-b-4 border-r-4']].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-[#0077b6] ${c[0]}`} />
                ))}
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
}

/* ── Diagnostic Upload ── */
function DiagnosticSection() {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
        <h2 className="text-4xl font-bold text-slate-900">Chẩn đoán thông minh</h2>
        <p className="text-slate-500 text-lg">Kéo và thả hình ảnh tôm có dấu hiệu bệnh lý vào khu vực dưới đây để AI phân tích.</p>
      </div>
      <div className="max-w-3xl mx-auto">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragActive(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-16 border-2 border-dashed rounded-3xl transition-all cursor-pointer group flex flex-col items-center gap-6 ${isDragActive ? 'border-[#0077b6] bg-[#0077b6]/5' : 'border-slate-200 bg-slate-50 hover:border-[#0077b6] hover:bg-slate-100'}`}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          <div className="w-20 h-20 bg-[#0077b6]/10 rounded-3xl flex items-center justify-center text-[#0077b6] group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">Tải lên hoặc kéo thả ảnh</h3>
            <p className="text-slate-500">Hỗ trợ JPG, PNG (Dung lượng tối đa: 10MB)</p>
          </div>
          <button className="mt-4 px-10 h-14 bg-[#0077b6] text-white font-bold rounded-2xl shadow-lg hover:bg-[#005d90] transition-colors">
            Chọn tệp tin
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Market Stats — fetch từ /api/shrimp-prices ── */
function MarketStats() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/shrimp-prices')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const fmtVND = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const fmtTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const diff = Math.round((Date.now() - d) / 60000);
    if (diff < 1)   return 'Vừa cập nhật';
    if (diff < 60)  return `${diff} phút trước`;
    if (diff < 1440) return `${Math.round(diff / 60)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const gia   = data?.gia   || [];
  const vung  = data?.vung  || 'ĐBSCL';
  const capNhat = fmtTime(data?.capnhat_luc);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold">Giá tôm thị trường</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                {capNhat ? `Cập nhật: ${capNhat} • ${vung}` : `Khu vực: ${vung}`}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold animate-pulse">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full" /> TRỰC TIẾP
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Cỡ tôm', 'Tôm Sú', 'Tôm Thẻ', 'Xu hướng'].map(h => (
                  <th key={h} className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading
                ? /* Skeleton rows */
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      {[1, 2, 3, 4].map(j => (
                        <td key={j} className="py-5">
                          <div className="h-4 bg-slate-100 rounded-full w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : gia.length === 0
                ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                        Chưa có dữ liệu giá. Admin vui lòng cập nhật.
                      </td>
                    </tr>
                  )
                : gia.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 font-bold text-slate-700">{row.co}</td>
                      <td className="py-5 text-[#0077b6] font-bold">{fmtVND(row.tom_su)}</td>
                      <td className="py-5 text-[#0077b6] font-bold">{fmtVND(row.tom_the)}</td>
                      <td className="py-5">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          row.xu_huong > 0 ? 'text-green-600' : row.xu_huong < 0 ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {row.xu_huong > 0
                            ? <TrendingUp className="w-4 h-4" />
                            : row.xu_huong < 0
                            ? <TrendingDown className="w-4 h-4" />
                            : <span className="w-4 h-4 inline-block text-center">—</span>
                          }
                          {row.xu_huong !== 0 && (
                            <span>{row.xu_huong > 0 ? '+' : '-'}{Number(row.thay_doi || 0).toLocaleString('vi-VN')}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="bg-[#2c694e] p-8 rounded-3xl h-1/2 flex flex-col justify-center text-white relative overflow-hidden group">
            <ShieldCheck className="w-12 h-12 mb-4 text-white/50 group-hover:scale-110 transition-transform" />
            <h4 className="text-xl font-bold mb-2">An Toàn & Bảo Mật</h4>
            <p className="text-white/70 text-sm leading-relaxed">Dữ liệu trang trại và lịch sử thăm khám của bạn được mã hóa hoàn toàn trên hệ thống đám mây.</p>
          </div>
          <div className="bg-[#0077b6] p-8 rounded-3xl h-1/2 flex flex-col justify-center text-white relative overflow-hidden group">
            <Users className="w-12 h-12 mb-4 text-white/50 group-hover:scale-110 transition-transform" />
            <h4 className="text-xl font-bold mb-2">Cộng Đồng 50,000+</h4>
            <p className="text-white/70 text-sm leading-relaxed">Mạng lưới người nuôi tôm thông minh tại Việt Nam, cùng chia sẻ giải pháp và kinh nghiệm hiệu quả.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Product Preview (fetch từ API /products/featured) ── */
function ProductPreview() {
  const { addToCart } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/featured')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setFetching(false));
  }, []);

  // Skeleton placeholder trong khi lộad
  const skeletons = Array.from({ length: 4 });

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-slate-900">Cửa hàng thuốc thủy sản</h2>
          <p className="text-slate-500 text-lg">Sản phẩm đặc trị &amp; dinh dưỡng chất lượng cao được chuyên gia khuyên dùng.</p>
        </div>
        <Link to="/store" className="flex items-center gap-2 text-[#0077b6] font-bold hover:translate-x-2 transition-transform shrink-0">
          Xem tất cả sản phẩm <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fetching
          /* Skeleton cards */
          ? skeletons.map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
                <div className="h-56 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))
          /* Real product cards */
          : products.length === 0
          ? (
              <div className="col-span-4 text-center py-16 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có sản phẩm nổi bật. Hãy thêm sản phẩm trong kho hàng.</p>
              </div>
            )
          : products.map(p => (
              <motion.div key={p.id} whileHover={{ y: -8 }} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                {/* ảnh */}
                <div className="h-56 relative bg-slate-50 p-6 overflow-hidden">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingCart className="w-16 h-16" /></div>
                  }
                  <div className="absolute top-4 left-4">
                    <span className={`${p.tagColor || 'bg-[#0077b6]'} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest`}>
                      {p.categoryLabel || p.category}
                    </span>
                  </div>
                  {/* Badge bán chạy */}
                  {p.sold > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Đã bán {p.sold.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-5 space-y-3">
                  <div className="h-20">
                    <h4 className="text-base font-bold text-slate-800 mb-1 line-clamp-1">{p.name}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xl font-bold text-[#0077b6]">{p.priceLabel}</p>
                    <button
                      onClick={() => addToCart({
                        id:         p.id,
                        name:       p.name,
                        price:      p.price,
                        priceLabel: p.priceLabel,
                        image:      p.image,
                        unit:       p.unit || 'gói',
                        qty:        1,
                      })}
                      className="w-10 h-10 bg-slate-100 hover:bg-[#0077b6] hover:text-white rounded-2xl flex items-center justify-center transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
        }
      </div>
    </section>
  );
}

/* ── Main Page ── */
export default function UserDashboard() {
  return (
    <div>
      <Hero />
      <DiagnosticSection />
      <MarketStats />
      <ProductPreview />
    </div>
  );
}
