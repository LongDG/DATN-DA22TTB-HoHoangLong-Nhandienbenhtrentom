import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, Eye, Search,
  X, Save, AlertTriangle, ChevronLeft, ChevronRight,
  CheckCircle2, Clock,
} from 'lucide-react';

const API = 'http://localhost:5000/api';
import { authFetch } from '../../utils/authFetch';

const CATEGORIES = [
  { key: 'ky_thuat_nuoi',  label: 'Kỹ thuật nuôi'   },
  { key: 'phong_tri_benh', label: 'Phòng & Trị bệnh' },
  { key: 'quan_ly_ao',     label: 'Quản lý ao nuôi'  },
  { key: 'sop',            label: 'Quy trình SOP'    },
  { key: 'dinh_duong',     label: 'Dinh dưỡng'       },
];

// Map danh mục → label ngắn + class màu cỏ định (Tailwind compile được)
const CATEGORY_STYLE = {
  ky_thuat_nuoi:  { label: 'Kỹ thuật nuôi', cls: 'bg-blue-600 text-white'   },
  phong_tri_benh: { label: 'Phòng & Trị',    cls: 'bg-red-600 text-white'    },
  quan_ly_ao:     { label: 'Quản lý ao',    cls: 'bg-emerald-700 text-white' },
  sop:            { label: 'SOP',           cls: 'bg-orange-700 text-white'  },
  dinh_duong:     { label: 'Dinh dưỡng',    cls: 'bg-purple-600 text-white'  },
};

const STATUS_STYLE = {
  published: { label: 'Đã đăng',  cls: 'bg-green-100 text-green-700 whitespace-nowrap'  },
  nhap:      { label: 'Nháp',     cls: 'bg-slate-100 text-slate-500 whitespace-nowrap'  },
  archived:  { label: 'Lưu trữ', cls: 'bg-amber-100 text-amber-700 whitespace-nowrap'  },
};

const EMPTY_FORM = { tieude: '', tomtat: '', noidung: '', danhmuc: 'ky_thuat_nuoi', hinhanh: '', video_url: '', video_thoigian: '', tacgia: '', trangthai: 'nhap', tags: '' };

const INPUT = 'w-full px-3 py-2.5 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none';
const TEXTAREA = `${INPUT} resize-none`;

/* ── Article Form Modal ── */
function ArticleModal({ article, onClose, onSave }) {
  const isEdit = !!article;
  const [form, setForm] = useState(isEdit ? {
    ...article,
    tags: article.tags?.join(', ') || '',
    noidung: (article.noidung || '').replace(/<br\s*\/?>/gi, '\n'),
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.tieude?.trim()) { setError('Vui lòng nhập tiêu đề bài viết'); return; }
    if (!form.danhmuc)        { setError('Vui lòng chọn danh mục'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        noidung: form.noidung.replace(/\n/g, '<br>'),
      };
      const url    = isEdit ? `${API}/handbook/${article.id}` : `${API}/handbook`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).message);
      onSave(isEdit ? '✅ Đã cập nhật bài viết!' : '✅ Đã tạo bài viết mới!');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e4] shrink-0">
          <h2 className="text-lg font-bold text-[#191c1d]">{isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full"><X className="w-5 h-5 text-[#707881]" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a]"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tiêu đề *</label>
            <input className={INPUT} value={form.tieude} onChange={e => set('tieude', e.target.value)} placeholder="Nhập tiêu đề bài viết..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Danh mục *</label>
              <select className={INPUT} value={form.danhmuc} onChange={e => set('danhmuc', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Trạng thái</label>
              <select className={INPUT} value={form.trangthai} onChange={e => set('trangthai', e.target.value)}>
                <option value="nhap">Nháp</option>
                <option value="published">Đăng ngay</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tóm tắt</label>
            <textarea className={TEXTAREA} rows={2} value={form.tomtat} onChange={e => set('tomtat', e.target.value)} placeholder="Mô tả ngắn về bài viết..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Nội dung</label>
            <textarea className={TEXTAREA} rows={6} value={form.noidung} onChange={e => set('noidung', e.target.value)} placeholder="Nhập nội dung chi tiết bài viết..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">URL Hình ảnh</label>
              <input className={INPUT} value={form.hinhanh} onChange={e => set('hinhanh', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tác giả</label>
              <input className={INPUT} value={form.tacgia} onChange={e => set('tacgia', e.target.value)} placeholder="Tên tác giả..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">URL Video (tuỳ chọn)</label>
              <input className={INPUT} value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Thời lượng video</label>
              <input className={INPUT} value={form.video_thoigian} onChange={e => set('video_thoigian', e.target.value)} placeholder="VD: 12:30" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tags (cách nhau bởi dấu phẩy)</label>
            <input className={INPUT} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="VD: đốm trắng, WSSV, tôm sú" />
          </div>

          {form.hinhanh && (
            <div className="rounded-xl overflow-hidden border border-[#e1e3e4] h-40">
              <img src={form.hinhanh} alt="Preview" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e1e3e4] shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5]">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-bold bg-[#0077b6] text-white rounded-xl hover:bg-[#005d90] disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Lưu thay đổi' : 'Đăng bài viết'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ── */
function DeleteModal({ article, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-[#ba1a1a]" />
        </div>
        <h3 className="text-lg font-bold mb-2">Xóa bài viết?</h3>
        <p className="text-sm text-[#707881] mb-6">Bài viết "<strong>{article?.tieude}</strong>" sẽ bị xóa vĩnh viễn.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5]">Hủy</button>
          <button disabled={deleting} onClick={async () => { setDeleting(true); await onConfirm(article.id); }} className="flex-1 py-2.5 text-sm font-bold bg-[#ba1a1a] text-white rounded-xl hover:bg-[#93000a] disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />} Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function HandbookAdminPage() {
  const [articles, setArticles] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal]       = useState(null); // { type: 'create'|'edit'|'delete', article }
  const [toast, setToast]       = useState('');
  const [editLoading, setEditLoading] = useState(null); // id bài đang fetch chi tiết
  const LIMIT = 10;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchArticles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.set('search', search);
    // Admin fetches all statuses — workaround: fetch without trangthai filter
    authFetch(`${API}/handbook?${params}&_admin=1`)
      .then(r => r.json())
      .then(d => { setArticles(d.articles ?? []); setTotal(d.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id) => {
    await authFetch(`${API}/handbook/${id}`, { method: 'DELETE' });
    setModal(null);
    showToast('✅ Đã xóa bài viết!');
    fetchArticles();
  };

  // Fetch chi tiết đầy đủ (field gốc) rồi mở modal chỉnh sửa
  const openEditModal = async (a) => {
    setEditLoading(a.id);
    try {
      const res = await authFetch(`${API}/handbook/admin-detail/${a.id}`);
      const detail = await res.json();
      setModal({ type: 'edit', article: res.ok ? detail : a });
    } catch {
      setModal({ type: 'edit', article: a }); // fallback
    } finally {
      setEditLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      {toast && <div className="fixed top-6 right-6 z-[100] bg-[#191c1d] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold">{toast}</div>}
      {modal?.type === 'create' && <ArticleModal onClose={() => setModal(null)} onSave={(msg) => { setModal(null); showToast(msg); fetchArticles(); }} />}
      {modal?.type === 'edit'   && <ArticleModal article={modal.article} onClose={() => setModal(null)} onSave={(msg) => { setModal(null); showToast(msg); fetchArticles(); }} />}
      {modal?.type === 'delete' && <DeleteModal  article={modal.article} onClose={() => setModal(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Sổ tay kỹ thuật</h1>
          <p className="text-[#404850]">Quản lý bài viết hướng dẫn và tài liệu kỹ thuật nuôi tôm.</p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-[#0077b6] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#005d90] transition-all active:scale-95 shadow-lg shadow-[#0077b6]/25 shrink-0"
        >
          <Plus className="w-5 h-5" /> Tạo bài viết mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: BookOpen, bg: 'bg-[#cde5ff]', color: 'text-[#0077b6]', label: 'Tổng bài viết', value: total },
          { icon: CheckCircle2, bg: 'bg-[#aeeecb]', color: 'text-[#2c694e]', label: 'Đã đăng', value: articles.filter(a => a.status === 'published').length },
          { icon: Clock, bg: 'bg-[#e7e8e9]', color: 'text-[#707881]', label: 'Nháp', value: articles.filter(a => a.status === 'nhap').length },
          { icon: Eye, bg: 'bg-[#ffdbc8]', color: 'text-[#904300]', label: 'Lượt xem', value: articles.reduce((s, a) => s + (a.views || 0), 0) },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div>
              <p className="text-xs font-semibold text-[#707881] uppercase">{s.label}</p>
              <p className="text-2xl font-bold text-[#191c1d]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#e1e3e4] p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" />
          <input className="w-full pl-9 pr-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none" placeholder="Tìm tiêu đề bài viết..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        {['all', 'published', 'nhap'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filterStatus === s ? 'bg-[#0077b6] text-white' : 'border border-[#bfc7d1] text-[#404850] hover:bg-[#f3f4f5]'}`}>
            {s === 'all' ? 'Tất cả' : STATUS_STYLE[s]?.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e1e3e4] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-[#f3f4f5] border-b border-[#e1e3e4]">
            <tr>
              {['Bài viết', 'Danh mục', 'Tác giả', 'Lượt xem', 'Trạng thái', 'Ngày tạo', ''].map((h, i) => (
                <th key={h + i} className="px-5 py-4 text-xs font-semibold text-[#404850] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7e8e9]">
            {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-[#707881]"><div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-[#0077b6] border-t-transparent rounded-full animate-spin" />Đang tải...</div></td></tr>}
            {!loading && articles.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-[#bfc7d1] mb-3" />
                <p className="text-[#707881] text-sm">Chưa có bài viết nào. Tạo bài viết đầu tiên!</p>
              </td></tr>
            )}
            {!loading && articles
              .filter(a => filterStatus === 'all' || a.status === filterStatus)
              .map(a => {
                const sts = STATUS_STYLE[a.status] || STATUS_STYLE.nhap;
                return (
                  <tr key={a.id} className="hover:bg-[#f8f9fa]/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#f3f4f5] shrink-0">
                          {a.image ? <img src={a.image} alt={a.title} className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-[#bfc7d1] m-auto mt-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#191c1d] line-clamp-1 max-w-xs">{a.title}</p>
                          <p className="text-xs text-[#707881] line-clamp-1">{a.summary}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {(() => {
                        const cs = CATEGORY_STYLE[a.category] || { label: a.categoryLabel, cls: 'bg-slate-500 text-white' };
                        return (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${cs.cls}`}>
                            {cs.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#404850]">{a.author}</td>
                    <td className="px-5 py-4 text-sm text-[#404850] font-semibold text-center">{a.views}</td>
                    <td className="px-3 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${sts.cls}`}>
                        {sts.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#707881]">{a.createdAt}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(a)}
                          disabled={editLoading === a.id}
                          className="p-2 hover:bg-[#e7e8e9] rounded-lg transition-colors disabled:opacity-50" title="Chỉnh sửa"
                        >
                          {editLoading === a.id
                            ? <div className="w-[17px] h-[17px] border-2 border-[#0077b6] border-t-transparent rounded-full animate-spin" />
                            : <Pencil className="w-[17px] h-[17px] text-[#404850]" />}
                        </button>
                        <button onClick={() => setModal({ type: 'delete', article: a })} className="p-2 hover:bg-[#ffdad6] rounded-lg transition-colors" title="Xóa"><Trash2 className="w-[17px] h-[17px] text-[#ba1a1a]" /></button>
                      </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-4 bg-[#f3f4f5]/50 border-t border-[#e1e3e4] flex items-center justify-between">
          <span className="text-sm text-[#707881]">Tổng <span className="font-semibold text-[#191c1d]">{total}</span> bài viết</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white disabled:opacity-40"><ChevronLeft className="w-5 h-5" /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`px-3.5 py-2 rounded-lg text-sm font-bold ${page === n ? 'bg-[#0077b6] text-white' : 'border border-[#bfc7d1] hover:bg-white text-[#404850]'}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white disabled:opacity-40"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
