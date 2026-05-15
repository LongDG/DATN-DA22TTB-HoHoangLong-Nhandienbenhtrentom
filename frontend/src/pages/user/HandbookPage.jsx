import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, ChevronRight, PlayCircle,
  Beaker, BriefcaseMedical, Activity, Download,
  Eye, BookOpen, Filter, X,
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const CATEGORIES = [
  { key: 'all',           label: 'Tất cả',           icon: BookOpen,         color: 'text-[#0077b6]', bg: 'bg-[#cde5ff]' },
  { key: 'ky_thuat_nuoi', label: 'Kỹ thuật nuôi',   icon: Beaker,           color: 'text-[#0077b6]', bg: 'bg-[#cde5ff]' },
  { key: 'phong_tri_benh',label: 'Phòng & Trị bệnh', icon: BriefcaseMedical, color: 'text-red-600',    bg: 'bg-red-50'    },
  { key: 'quan_ly_ao',    label: 'Quản lý ao nuôi',  icon: Activity,         color: 'text-[#2c694e]', bg: 'bg-[#aeeecb]/40' },
  { key: 'sop',           label: 'Quy trình SOP',    icon: Download,         color: 'text-[#904300]', bg: 'bg-[#ffdbc8]' },
  { key: 'dinh_duong',    label: 'Dinh dưỡng',       icon: Beaker,           color: 'text-[#0077b6]', bg: 'bg-[#cde5ff]' },
];

const CATEGORY_CARDS = [
  { key: 'ky_thuat_nuoi', icon: Beaker,           iconBg: 'bg-[#cde5ff]', iconHover: 'group-hover:bg-[#0077b6]', color: 'text-[#0077b6]', items: ['Chuẩn bị ao', 'Quản lý nước', 'Cho ăn khoa học'] },
  { key: 'phong_tri_benh', icon: BriefcaseMedical, iconBg: 'bg-red-100',   iconHover: 'group-hover:bg-red-600',   color: 'text-red-600',    items: ['Dấu hiệu nhận biết', 'Phương pháp trị', 'Vaccine & Vi sinh'] },
  { key: 'quan_ly_ao',    icon: Activity,          iconBg: 'bg-[#aeeecb]/50', iconHover: 'group-hover:bg-[#2c694e]', color: 'text-[#2c694e]', items: ['Giám sát môi trường', 'Ứng dụng công nghệ', 'Xử lý chất thải'] },
  { key: 'sop',           icon: Download,          iconBg: 'bg-[#ffdbc8]', iconHover: 'group-hover:bg-[#904300]', color: 'text-[#904300]', items: ['Tải tài liệu PDF', 'Hướng dẫn thực địa', 'Biểu mẫu nhật ký'] },
];

const FALLBACK_IMGS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDEnI37HNFicM3EvMUdddsG2faOcaPc1uOjRMcqk6NV2272-vbJvBlwyZMurgJCCEsgWk1PjQ2Gdph9N_JW3FSIG59gJYT6Xy2tKlzUomOfqSHR7u0LPOFjE5a6oAS1nlfSA3tPBpFGV8OaqBHDRIZaiRk2ELscDah7vES9cZySDL-pWeLHnYh6KiLS_8KUBnHWvzNHX7b9UuUoSFz-lQCV14XDdW5qui-fNzqlKAsUOvm22srWmbm33J46JkYVolzjPa9uLi8ONg',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD_JE3tRXClh7WmLv500mSs9DeaFCSUUyIjbB6MvcTmzv5NkklkvE0lDJ_aXcIRSbdddkdkSRKdHy7umnATcBcaVSq5bxIbI2KMb2FSEfCA-lloZLb12_yJI-WoP28CW48-1w-sIAvZzYhtolWoNQXjA41SI5n_ULbk7D93nuTaRX8MCEkUEr3e-No7YCcRJ4zmGivWetsCMGfjtumxAZimjsYYV26RRwF4dYkjUCDIGqn_R-iABpxYZIiHUMaq28N5qjDjhA5dog',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBa4M-AouzN7W5EBYlpZUfUxWlvJPqsZ0gEwCURMPo1CrNtAKiwHX7be0JNXXmHLtbq6h2GtTwqNW8-nfyipVIjnKyykmtlzOb8_S3AnEbD5FyJHkV4hM7mgJqardAj2H17K_g6Sc5VTSL6ues4xMsAMcUXeQh6yEE02Wyoa54C7TYy_uTHpzU_AtsWLkd4iMn0Sjo2CNBJ3fmByHLCPEx5qKK-Ifiko-vf2B5TsvGBNsZve43Y5ISJ8-nO5sl0oTUIvFsC4pjZxw',
];

function ArticleCard({ article, index }) {
  const navigate = useNavigate();
  const img = article.image || FALLBACK_IMGS[index % 3];

  return (
    <article
      onClick={() => navigate(`/handbook/${article.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100 flex flex-col cursor-pointer group hover:-translate-y-1"
    >
      <div className="h-52 relative overflow-hidden">
        <img src={img} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${article.categoryColor}`}>
          {article.categoryLabel}
        </span>
        {article.videoUrl && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle className="w-12 h-12 text-white" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h4 className="text-base font-bold text-[#191c1d] mb-2 line-clamp-2 group-hover:text-[#0077b6] transition-colors leading-snug">
          {article.title}
        </h4>
        <p className="text-sm text-slate-500 flex-grow line-clamp-2 mb-4">{article.summary}</p>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Eye className="w-3.5 h-3.5" /> {article.views} lượt xem
          </div>
          <span className="text-xs font-semibold text-[#0077b6] flex items-center gap-1">
            Đọc tiếp <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

export default function HandbookPage() {
  const navigate       = useNavigate();
  const [articles, setArticles]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchArticles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ category, page, limit: 9 });
    if (search) params.set('search', search);
    fetch(`${API}/handbook?${params}`)
      .then(r => r.json())
      .then(d => { setArticles(d.articles ?? []); setTotal(d.total ?? 0); setTotalPages(d.totalPages ?? 1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, page, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#005d90] to-[#0077b6] relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXmLQvX3GM68JnblqMrKdq0utMfc5NkdyPi8M_cqrXtPkXxGXWBmJiaUZ_qU_KuorBOssgmtbfttQT6MpMggeKvrpiRYpaxAroCIIByGzNwgDoSBWs9_f9cRWexyMAQZA1h00p7Wcn77jLSNAecXO_OiPJJbra34PfMcSniEcOztjE6AJpzwLkfvt2-tIN5NW688-Mt7E2MMwJq6bOXdMuu88z21Mx5gl8BWOv7hdjAWDh8SWTj1euACqayEplm1MFTZHX4p-kgw" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">📚 Sổ tay kỹ thuật nuôi tôm</h1>
          <p className="text-lg text-white/85 mb-8 leading-relaxed">
            Tổng hợp kiến thức, quy trình nuôi tôm chuẩn từ các chuyên gia hàng đầu, giúp bạn tối ưu hóa sản lượng và giảm thiểu rủi ro.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-xl max-w-xl mx-auto">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-5 h-5 text-[#0077b6] shrink-0" />
              <input
                className="w-full border-none outline-none text-sm py-2.5 ml-3 placeholder-slate-400"
                placeholder="Tìm kiếm tài liệu, kỹ thuật..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && <button onClick={() => setSearchInput('')}><X className="w-4 h-4 text-slate-400" /></button>}
            </div>
            <button className="bg-[#0077b6] text-white px-7 py-2.5 rounded-xl text-sm font-bold hover:bg-[#005d90] transition-colors">
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-20 mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORY_CARDS.map(c => (
            <button
              key={c.key}
              onClick={() => { setCategory(c.key); setPage(1); document.getElementById('articles-section')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-all duration-300 text-left group"
            >
              <div className={`w-12 h-12 ${c.iconBg} ${c.iconHover} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                <c.icon className={`w-6 h-6 ${c.color} group-hover:text-white transition-colors`} />
              </div>
              <h3 className={`text-base font-bold ${c.color} mb-3 leading-snug`}>{CATEGORIES.find(x => x.key === c.key)?.label}</h3>
              <ul className="space-y-1.5">
                {c.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-slate-500 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.color.replace('text-', 'bg-')}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section id="articles-section" className="max-w-7xl mx-auto px-6 pb-16">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#191c1d]">
              {category === 'all' ? 'Hướng dẫn mới nhất' : CATEGORIES.find(c => c.key === category)?.label}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Tìm thấy <span className="font-semibold text-[#191c1d]">{total}</span> bài viết</p>
          </div>
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${category === c.key ? 'bg-[#0077b6] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="h-52 bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-500">Chưa có bài viết nào</h3>
            <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`w-10 h-10 rounded-xl font-semibold text-sm transition-colors ${page === n ? 'bg-[#0077b6] text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600'}`}>{n}</button>
            ))}
          </div>
        )}
      </section>

      {/* Video Library */}
      <section className="bg-slate-50 py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#191c1d] mb-1">🎬 Thư viện Video hướng dẫn</h2>
            <p className="text-slate-500">Hướng dẫn trực quan từng bước thực hiện trên thực địa.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1lkHBNiREip_QMm1qtBBvbi7kmzRwTYUKYwSjS3_O3OcruoA1QLW4YAcN01Pph-cJMfy_R_VhU66iFEqzJNJg2WvKPeUwHDT26rMrX-yZdiTpGZ4Jm5AWWY-kXKzuvyR9GltD89ffd3Vj6n03nBOoyG5B2VNKAHTCtpPDixM6giHxwWaujuCPqArJI31fNEICdD5P5uuG6UAAifIiol9FCBTcS8ol4-YFivH2ArzanE26176zd6OHZN_-8diQCDAF23w2gDEn3g', time: '12:45', title: 'Quy trình xử lý nước ao trước khi thả tôm' },
              { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKjtY0LD1SIzuGzeZGRDywZI5aEllocrqEkM6nT6QozGYbBnmKljJ5CmWh5m3M217FQn6naS1-4JMtp-m5vrij_DaTIAMn22MSMowuSj5CL6WbPJmT-xzc9yngtwAqnkKxNLMOmxnp1tXrMomqBUpTDpqjcWJndTZI_eOCE8v6kZ-tsOw_1jK3NFp8e7Es9jW62Fy20vu-K74mEIrhPZeSZ-HIKKVjXhqzrU2LnMXbp0gOa8XabGvRm9A09TqZxIjIxT44nXb51g', time: '08:20', title: 'Cách lắp đặt hệ thống quạt nước tối ưu oxy' },
              { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBallN9mt5ehTzzSlzRz52fMd-Dzkep1joWUgonfthFcpdsQuN-opoPHhe91CiPs9LYaPvgMnJBxcXWd8dyG_8NE9rnZv91hgD0Zp-Yn4YBhiuJyNDgnsapkFHYfaJADp7oEoNYzaQ5sGMFtiRLl5D8xFnj5_jIsgiOwwVHmbSScd4FoGUvM9cTjBzxqzqrIui2j-XVzmoBMxKpSXrsksFSUknLtCrwToI2cU25NjC8eJ4j-r14ksg_x3hliN3f6bQfAEfc6qJW2Q', time: '15:10', title: 'Nhận diện sớm bệnh phân trắng trên tôm thẻ' },
              { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBUVduOKEKxl-o2NPHS01ggDT5N6x5eSZx_evDe4r0PAt4jazbxObOOvos_LO6p3xPkAjmtygq0ICeLo929IHKsVICSZMnOrhdEB5YXnskIW6ymQUUlfOKrbkdt9vkx9yrgNvryRs878QymtEGcouPjk7z-NLGtNRehQNlrqbjbh3yDhGoD5iqaYeUXcP996C4WqjUydE1v3I8yy1aOEM4ZnR_FmdaqWBvXh3BDQlueP6kreOjzUN8fACxmaprd6Zv3ohJ5sXlZA', time: '05:30', title: 'Hướng dẫn ghi chép nhật ký nuôi tôm số hóa' },
            ].map((v, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative rounded-xl overflow-hidden mb-3 aspect-video">
                  <img src={v.img} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">{v.time}</span>
                </div>
                <h5 className="text-sm font-semibold text-[#191c1d] line-clamp-2 leading-snug">{v.title}</h5>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-[#005d90] to-[#0077b6] rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-3">📬 Nhận tài liệu miễn phí</h2>
            <p className="text-white/80 mb-8 leading-relaxed">
              Để lại email để nhận trọn bộ cẩm nang kỹ thuật nuôi tôm thâm canh và các cảnh báo dịch bệnh mới nhất hàng tháng.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 bg-white/10 p-2 rounded-2xl">
              <input className="flex-1 bg-white text-[#191c1d] px-5 py-3.5 rounded-xl outline-none text-sm focus:ring-2 focus:ring-white/50" placeholder="Nhập địa chỉ email..." type="email" />
              <button className="bg-[#904300] text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-[#743500] transition-colors whitespace-nowrap">
                Đăng ký nhận tài liệu
              </button>
            </form>
            <p className="mt-4 text-xs text-white/50 italic">* Chúng tôi cam kết không spam và bảo mật thông tin của bạn.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
