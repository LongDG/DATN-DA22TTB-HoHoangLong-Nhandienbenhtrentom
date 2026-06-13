import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, Calendar, User, Tag, Share2,
  BookOpen, Clock, ChevronRight, PlayCircle,
  Link2, Beaker, BriefcaseMedical, Activity, Download,
} from 'lucide-react';

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const API = 'http://localhost:5000/api';

const CATEGORY_STYLE = {
  ky_thuat_nuoi:  { bg: 'bg-blue-100',    text: 'text-blue-700',   icon: Beaker           },
  phong_tri_benh: { bg: 'bg-red-100',     text: 'text-red-600',    icon: BriefcaseMedical },
  quan_ly_ao:     { bg: 'bg-green-100',   text: 'text-green-700',  icon: Activity         },
  sop:            { bg: 'bg-orange-100',  text: 'text-orange-700', icon: Download         },
  dinh_duong:     { bg: 'bg-blue-100',    text: 'text-blue-700',   icon: Beaker           },
};

function getYouTubeEmbed(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/\s]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="animate-pulse max-w-5xl mx-auto px-6 py-10">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="h-12 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-6 bg-slate-200 rounded w-1/2 mb-8" />
      <div className="h-72 bg-slate-200 rounded-2xl mb-8" />
      <div className="space-y-3">
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="h-4 bg-slate-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Thẻ bài viết liên quan ── */
function RelatedCard({ article }) {
  const navigate = useNavigate();
  const cat = CATEGORY_STYLE[article.category] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <article
      onClick={() => navigate(`/handbook/${article.id}`)}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
    >
      <div className="h-36 overflow-hidden relative">
        {article.image ? (
          <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white opacity-30" />
          </div>
        )}
      </div>
      <div className="p-4">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${cat.bg} ${cat.text} mb-2`}>
          {article.categoryLabel}
        </span>
        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700 transition-colors mb-2">
          {article.title}
        </h4>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Eye className="w-3 h-3" /> {article.views} lượt xem
        </div>
      </div>
    </article>
  );
}

export default function HandbookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setArticle(null);
    setRelated([]);

    fetch(`${API}/handbook/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(d => {
        setArticle(d);
        return fetch(`${API}/handbook?category=${d.category}&limit=4`);
      })
      .then(r => r.json())
      .then(d => {
        setRelated((d.articles ?? []).filter(a => a.id !== id).slice(0, 3));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* NOT FOUND */
  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 bg-slate-50">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-2">
          <BookOpen className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-700">Không tìm thấy bài viết</h2>
        <p className="text-slate-500 max-w-sm">Bài viết này có thể đã bị xóa hoặc chưa được công bố.</p>
        <button
          onClick={() => navigate('/handbook')}
          className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Sổ tay
        </button>
      </div>
    );
  }

  /* LOADING */
  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="bg-gradient-to-br from-blue-900 to-blue-600 h-24" />
        <Skeleton />
      </div>
    );
  }

  if (!article) return null;

  const cat     = CATEGORY_STYLE[article.category] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: BookOpen };
  const CatIcon = cat.icon;
  const embedUrl = getYouTubeEmbed(article.videoUrl);
  const wordCount = article.content ? article.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length : 0;
  const readTime = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : null;

  return (
    <div className="bg-slate-50 min-h-screen pb-16">

      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #003f5e 0%, #005d90 50%, #0077b6 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-6 pb-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <button onClick={() => navigate('/home')} className="hover:text-white transition-colors">Trang chủ</button>
            <ChevronRight className="w-3.5 h-3.5 mx-0.5" />
            <button onClick={() => navigate('/handbook')} className="hover:text-white transition-colors">Sổ tay kỹ thuật</button>
            <ChevronRight className="w-3.5 h-3.5 mx-0.5" />
            <span className="truncate max-w-48" style={{ color: 'rgba(255,255,255,0.4)' }}>{article.title}</span>
          </nav>

          {/* Category badge */}
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold mb-4 ${cat.bg} ${cat.text}`}>
            <CatIcon className="w-4 h-4" />
            {article.categoryLabel}
          </span>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-lg mb-6 max-w-2xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {article.summary}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{article.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{article.createdAt}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{article.views.toLocaleString()} lượt xem</span>
            {readTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{readTime} phút đọc</span>}
          </div>
        </div>
      </div>

      {/* ── Ảnh bìa (nếu có và không phải video) ── */}
      {article.image && !embedUrl && (
        <div className="max-w-5xl mx-auto px-6 -mt-5 relative z-20 mb-8">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-100">
            <img src={article.image} alt={article.title} className="w-full object-cover" style={{ maxHeight: 400 }} />
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className={`max-w-5xl mx-auto px-6 flex flex-col lg:flex-row gap-8 items-start ${article.image && !embedUrl ? '' : 'mt-8'}`}>

        {/* ── CONTENT ── */}
        <main className="flex-1 min-w-0">

          {/* YouTube embed */}
          {embedUrl && (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-black"
              style={{ aspectRatio: '16/9' }}>
              <iframe
                src={embedUrl}
                title={article.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {/* Video link ngoài */}
          {article.videoUrl && !embedUrl && (
            <a
              href={article.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 mb-8 rounded-2xl p-5 border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group no-underline"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <PlayCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-700">Xem video hướng dẫn</p>
                <p className="text-sm text-slate-500 mt-0.5">{article.videoUrl}</p>
              </div>
            </a>
          )}

          {/* ── Article body ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-5">
            {article.content ? (
              <div
                className="handbook-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400">Bài viết chưa có nội dung chi tiết.</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-default"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chia sẻ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Chia sẻ bài viết
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: '#1877f2' }}
              >
                <FacebookIcon className="w-4 h-4" /> Facebook
              </button>
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  copied
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Link2 className="w-4 h-4" />
                {copied ? 'Đã sao chép!' : 'Sao chép link'}
              </button>
            </div>
          </div>

          {/* Nút quay lại (mobile) */}
          <button
            onClick={() => navigate('/handbook')}
            className="lg:hidden w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors bg-white"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>
        </main>

        {/* ── SIDEBAR ── */}
        <aside className="w-full lg:w-72 shrink-0 space-y-5">

          {/* Nút quay lại (desktop) */}
          <button
            onClick={() => navigate('/handbook')}
            className="hidden lg:flex w-full items-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </button>

          {/* Thông tin bài viết */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 text-sm uppercase tracking-wide">
              Thông tin bài viết
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Tác giả</p>
                  <p className="text-sm font-semibold text-slate-800">{article.author}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Ngày đăng</p>
                  <p className="text-sm font-semibold text-slate-800">{article.createdAt}</p>
                </div>
              </li>
              {article.updatedAt && article.updatedAt !== article.createdAt && (
                <li className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Cập nhật lần cuối</p>
                    <p className="text-sm font-semibold text-slate-800">{article.updatedAt}</p>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Lượt xem</p>
                  <p className="text-sm font-semibold text-slate-800">{article.views.toLocaleString()}</p>
                </div>
              </li>
              {readTime && (
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Thời gian đọc</p>
                    <p className="text-sm font-semibold text-slate-800">{readTime} phút</p>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-3">
                <CatIcon className={`w-4 h-4 mt-0.5 shrink-0 ${cat.text}`} />
                <div>
                  <p className="text-xs text-slate-400 mb-1">Danh mục</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.bg} ${cat.text}`}>
                    {article.categoryLabel}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Bài liên quan */}
          {related.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide pl-1">
                Bài viết liên quan
              </h3>
              <div className="space-y-4">
                {related.map(a => <RelatedCard key={a.id} article={a} />)}
              </div>
            </div>
          )}

          {/* CTA */}
          <div
            className="rounded-2xl p-5 text-white"
            style={{ background: 'linear-gradient(135deg, #005d90, #0077b6)' }}
          >
            <h4 className="font-bold mb-2">🔬 Cần tư vấn thêm?</h4>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Đội ngũ chuyên gia sẵn sàng hỗ trợ bạn 24/7.
            </p>
            <button
              onClick={() => navigate('/consult-user')}
              className="w-full bg-white font-bold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ color: '#0077b6' }}
            >
              Gửi yêu cầu tư vấn
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
