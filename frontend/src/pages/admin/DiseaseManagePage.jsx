import { useState, useEffect, useCallback } from 'react';
import {
  Bug, Plus, Pencil, Trash2, X, Save, AlertTriangle,
  Search, ChevronLeft, ChevronRight, Loader2, ShieldAlert,
  Info, Leaf, Stethoscope, FlaskConical, ImagePlus, Link,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

const API = 'http://localhost:5000/api';

// ── Mức độ nguy hiểm ─────────────────────────────────
const MUC_DO_CONFIG = {
  nhe:        { label: 'Nhẹ',         cls: 'bg-[#e8f5e9] text-[#2e7d32] border-[#2e7d32]/20' },
  trung_binh: { label: 'Trung bình',  cls: 'bg-[#fff8e1] text-[#f57f17] border-[#f57f17]/20' },
  nang:       { label: 'Nặng',        cls: 'bg-[#ffdbc8] text-[#743500] border-[#743500]/20' },
  rat_nang:   { label: 'Rất nặng',    cls: 'bg-[#ffdad6] text-[#93000a] border-[#93000a]/20' },
};

// Chuẩn hoá giá trị muc_do từ DB cũ (chuỗi tiếng Việt) → key chuẩn
const normalizeMucDo = (v = '') => {
  if (!v) return 'trung_binh';
  const map = {
    'nhẹ': 'nhe', 'nhe': 'nhe',
    'trung bình': 'trung_binh', 'trung_binh': 'trung_binh',
    'nặng': 'nang', 'nang': 'nang',
    'rất nặng': 'rat_nang', 'rất nghiêm trọng': 'rat_nang', 'rat_nang': 'rat_nang',
  };
  return map[v.toLowerCase()] || 'trung_binh';
};

const MUC_DO_LIST = Object.entries(MUC_DO_CONFIG).map(([k, v]) => ({ key: k, ...v }));

const EMPTY_FORM = {
  tenbenh: '', nhom: '', mota: '',
  trieu_chung: '', nguyen_nhan: '', phong_ngua: '',
  dieu_tri: '', muc_do: 'trung_binh', hinhanh: '',
  hinhanh_list: [],
};

const IC = 'w-full px-3 py-2.5 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none transition-all';
const TA = IC + ' resize-none';

// ── Badge mức độ ─────────────────────────────────────
function MucDoBadge({ muc_do }) {
  const cfg = MUC_DO_CONFIG[muc_do] || MUC_DO_CONFIG.trung_binh;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Modal Thêm / Sửa Bệnh ────────────────────────────
function DiseaseModal({ mode, disease, onClose, onSaved }) {
  // Khi edit: map field backend → field form
  const initForm = mode === 'edit' ? {
    tenbenh:      disease.tenbenh     || '',
    nhom:         disease.nhom        || '',
    mota:         disease.mota        || '',
    trieu_chung:  disease.trieu_chung || '',
    nguyen_nhan:  disease.nguyen_nhan || '',
    phong_ngua:   disease.phong_ngua  || '',
    dieu_tri:     disease.dieu_tri    || '',
    muc_do:       disease.muc_do      || 'trung_binh',
    hinhanh:      disease.hinhanh     || '',
    hinhanh_list: Array.isArray(disease.hinhanh_list)
      ? disease.hinhanh_list
      : (disease.hinhanh ? [disease.hinhanh] : []),
  } : EMPTY_FORM;
  const [form, setForm] = useState(initForm);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Thêm link ảnh mới vào danh sách
  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (form.hinhanh_list.includes(url)) { setNewImageUrl(''); return; }
    setForm(p => ({ ...p, hinhanh_list: [...p.hinhanh_list, url], hinhanh: p.hinhanh || url }));
    setNewImageUrl('');
  };

  // Xóa link ảnh khỏi danh sách
  const removeImage = (idx) => {
    setForm(p => {
      const list = p.hinhanh_list.filter((_, i) => i !== idx);
      return { ...p, hinhanh_list: list, hinhanh: list[0] || '' };
    });
  };

  const handleSubmit = async () => {
    if (!form.tenbenh.trim()) { setError('Vui lòng nhập tên bệnh'); return; }
    setSaving(true); setError('');
    try {
      const url    = mode === 'edit' ? `${API}/admin/diseases/${disease.id}` : `${API}/admin/diseases`;
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res  = await authFetch(url, { method, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSaved();
    } catch (e) {
      setError(e.message || 'Lỗi lưu bệnh');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e4] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ffdad6] rounded-lg flex items-center justify-center">
              <Bug className="w-4 h-4 text-[#ba1a1a]" />
            </div>
            <h2 className="text-lg font-bold text-[#191c1d]">
              {mode === 'edit' ? 'Chỉnh sửa bệnh' : 'Thêm bệnh mới'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full transition-colors">
            <X className="w-5 h-5 text-[#707881]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a]">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* ─ Thông tin cơ bản ─ */}
          <div>
            <p className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Thông tin cơ bản
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tên bệnh *</label>
                <input className={IC} placeholder="VD: Bệnh đốm trắng (WSSV)" value={form.tenbenh}
                  onChange={e => set('tenbenh', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tác nhân</label>
                <input className={IC} placeholder="VD: Virus, Vi khuẩn, WSSV..." value={form.nhom}
                  onChange={e => set('nhom', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Mức độ nguy hiểm</label>
                <select className={IC} value={form.muc_do} onChange={e => set('muc_do', e.target.value)}>
                  {MUC_DO_LIST.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Mô tả chung</label>
                <textarea rows={2} className={TA} placeholder="Mô tả ngắn gọn về bệnh..."
                  value={form.mota} onChange={e => set('mota', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ─ Triệu chứng & Nguyên nhân ─ */}
          <div>
            <p className="text-xs font-bold text-[#f57f17] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> Triệu chứng & Nguyên nhân
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Triệu chứng nhận biết</label>
                <textarea rows={3} className={TA}
                  placeholder={"- Tôm nổi đầu, bơi lờ đờ\n- Vỏ có đốm trắng\n- Gan tụy nhợt nhạt"}
                  value={form.trieu_chung} onChange={e => set('trieu_chung', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Nguyên nhân</label>
                <textarea rows={3} className={TA}
                  placeholder={"- Virus WSSV\n- Lây qua nguồn nước\n- Tôm bố mẹ mang bệnh"}
                  value={form.nguyen_nhan} onChange={e => set('nguyen_nhan', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ─ Phòng ngừa & Điều trị ─ */}
          <div>
            <p className="text-xs font-bold text-[#2e7d32] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Phòng ngừa & Điều trị
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Biện pháp phòng ngừa</label>
                <textarea rows={3} className={TA}
                  placeholder={"- Khử trùng ao trước khi thả\n- Chọn giống sạch bệnh\n- Kiểm soát mật độ thả"}
                  value={form.phong_ngua} onChange={e => set('phong_ngua', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Cách điều trị</label>
                <textarea rows={3} className={TA}
                  placeholder={"- Cách ly tôm bệnh\n- Dùng kháng sinh theo hướng dẫn\n- Tăng oxy hòa tan"}
                  value={form.dieu_tri} onChange={e => set('dieu_tri', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ─ Hình ảnh ─ (ẩn) */}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e1e3e4] shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[#404850] border border-[#bfc7d1] rounded-lg hover:bg-[#f3f4f5] transition-colors">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-6 py-2 text-sm font-bold bg-[#ba1a1a] text-white rounded-lg hover:bg-[#93000a] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
              : <><Save className="w-4 h-4" />{mode === 'edit' ? 'Lưu thay đổi' : 'Thêm bệnh'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Xác nhận Xóa ───────────────────────────────
function DeleteModal({ disease, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-[#ba1a1a]" />
        </div>
        <h3 className="text-lg font-bold text-[#191c1d] mb-2">Xóa bệnh này?</h3>
        <p className="text-sm text-[#707881] mb-1">
          <span className="font-semibold text-[#191c1d]">"{disease.tenbenh}"</span>
        </p>
        <p className="text-xs text-[#707881] mb-6">
          Bệnh sẽ bị gỡ khỏi tất cả sản phẩm đang liên kết. Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-[#bfc7d1] rounded-xl text-sm font-semibold text-[#404850] hover:bg-[#f3f4f5] transition-colors">
            Hủy
          </button>
          <button
            disabled={deleting}
            onClick={async () => { setDeleting(true); await onConfirm(disease.id); setDeleting(false); }}
            className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-xl text-sm font-bold hover:bg-[#93000a] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trang chính ──────────────────────────────────────
export default function DiseaseManagePage() {
  const [diseases, setDiseases]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterMuc, setFilterMuc] = useState('all');
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(null); // null | { type:'add'|'edit'|'delete', data? }
  const [toast, setToast]         = useState(null);
  const [editLoading, setEditLoading] = useState(null);
  const PER_PAGE = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDiseases = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API}/admin/diseases`);
      const data = await res.json();
      // Chuẩn hoá: thêm field `id` từ `_id`, đồng nhất tên field
      const list = (data.diseases || []).map(d => ({
        ...d,
        id:       d._id?.toString?.() || d.id || d._id,
        tenbenh:  d.ten_benh  || d.tenbenh  || '',
        nhom:     d.nhom      || '',
        mota:     d.mota      || '',
        muc_do:   normalizeMucDo(d.muc_do),
      }));
      setDiseases(list);
    } catch { setDiseases([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDiseases(); }, [fetchDiseases]);

  // ── Filter + Phân trang ─────────────────────────────
  const filtered = diseases.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || (d.tenbenh || '').toLowerCase().includes(q)
      || (d.nhom   || '').toLowerCase().includes(q);
    const matchMuc = filterMuc === 'all' || d.muc_do === filterMuc;
    return matchSearch && matchMuc;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async (id) => {
    try {
      const res = await authFetch(`${API}/admin/diseases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showToast('Đã xóa bệnh thành công');
      setModal(null);
      fetchDiseases();
    } catch { showToast('Lỗi khi xóa bệnh', 'error'); }
  };

  const handleSaved = (msg = 'Lưu thành công') => {
    showToast(msg);
    setModal(null);
    fetchDiseases();
  };

  // Fetch chi tiết đầy đủ rồi mở modal chỉnh sửa
  const openEditModal = async (d) => {
    setEditLoading(d.id);
    try {
      const res  = await authFetch(`${API}/admin/diseases/${d.id}`);
      const data = await res.json();
      setModal({ type: 'edit', data: res.ok ? { ...data, id: d.id } : d });
    } catch {
      setModal({ type: 'edit', data: d });
    } finally {
      setEditLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
          ${toast.type === 'error' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#aeeecb] text-[#316e52]'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ffdad6] rounded-xl flex items-center justify-center">
            <Bug className="w-5 h-5 text-[#ba1a1a]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#191c1d]">Quản lý Bệnh Tôm</h1>
            <p className="text-sm text-[#707881]">
              Danh mục bệnh dùng để gợi ý thuốc sau chẩn đoán AI
            </p>
          </div>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ba1a1a] text-white text-sm font-bold rounded-xl
                     hover:bg-[#93000a] transition-all active:scale-95 shadow-md shadow-[#ba1a1a]/20">
          <Plus className="w-4 h-4" /> Thêm bệnh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {MUC_DO_LIST.map(m => {
          const count = diseases.filter(d => d.muc_do === m.key).length;
          return (
            <button key={m.key}
              onClick={() => { setFilterMuc(filterMuc === m.key ? 'all' : m.key); setPage(1); }}
              className={`p-4 rounded-xl border text-left transition-all ${filterMuc === m.key ? m.cls + ' shadow-md' : 'bg-white border-[#e1e3e4] hover:border-[#bfc7d1]'}`}>
              <p className="text-2xl font-black">{count}</p>
              <p className="text-xs font-semibold mt-0.5">{m.label}</p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881]" />
          <input
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#dde1e7] rounded-xl text-sm focus:ring-2 focus:ring-[#ba1a1a]/20 focus:border-[#ba1a1a] outline-none"
            placeholder="Tìm tên bệnh, mã bệnh..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-white border border-[#dde1e7] rounded-xl text-sm focus:ring-2 focus:ring-[#ba1a1a]/20 outline-none"
          value={filterMuc}
          onChange={e => { setFilterMuc(e.target.value); setPage(1); }}>
          <option value="all">Tất cả mức độ</option>
          {MUC_DO_LIST.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-[#707881]">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#707881]">
            <Bug className="w-12 h-12 text-[#bfc7d1]" />
            <p className="text-sm font-semibold">
              {search || filterMuc !== 'all' ? 'Không tìm thấy bệnh phù hợp' : 'Chưa có bệnh nào. Nhấn "Thêm bệnh" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fa] text-[#707881] text-xs uppercase tracking-wide border-b border-[#e1e3e4]">
                <th className="text-left px-5 py-3 font-semibold w-8">#</th>
                <th className="text-left px-5 py-3 font-semibold">Tên bệnh</th>
                <th className="text-left px-4 py-3 font-semibold">Tác nhân</th>
                <th className="text-left px-4 py-3 font-semibold">Mức độ</th>
                <th className="text-left px-4 py-3 font-semibold">Mô tả ngắn</th>
                <th className="text-right px-5 py-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f5]">
              {paginated.map((d, i) => (
                <tr key={d.id || d._id} className="hover:bg-[#fafafa] transition-colors group">
                  <td className="px-5 py-3.5 text-[#9aa5b4] text-xs">
                    {(page - 1) * PER_PAGE + i + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {d.hinhanh ? (
                        <img src={d.hinhanh} alt={d.tenbenh}
                          className="w-9 h-9 rounded-lg object-cover border border-[#e1e3e4] shrink-0"
                          onError={e => e.target.style.display = 'none'} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#ffdad6] flex items-center justify-center shrink-0">
                          <Bug className="w-4 h-4 text-[#ba1a1a]" />
                        </div>
                      )}
                      <span className="font-semibold text-[#191c1d]">{d.tenbenh}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 bg-[#f3f4f5] rounded text-xs font-mono text-[#404850]">
                      {d.nhom || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <MucDoBadge muc_do={d.muc_do} />
                  </td>
                  <td className="px-4 py-3.5 text-[#707881] max-w-xs">
                    <p className="truncate text-xs">{d.mota || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEditModal(d)}
                        disabled={editLoading === d.id}
                        className="p-2 text-[#0077b6] hover:bg-[#e3f2fd] rounded-lg transition-colors disabled:opacity-50"
                        title="Chỉnh sửa">
                        {editLoading === d.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Pencil className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', data: d })}
                        className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                        title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[#707881]">
            Hiển thị {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length} bệnh
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-[#dde1e7] hover:bg-[#f3f4f5] disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${n === page
                  ? 'bg-[#ba1a1a] text-white'
                  : 'border border-[#dde1e7] text-[#404850] hover:bg-[#f3f4f5]'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-[#dde1e7] hover:bg-[#f3f4f5] disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'add' && (
        <DiseaseModal mode="add" onClose={() => setModal(null)} onSaved={() => handleSaved('Thêm bệnh thành công!')} />
      )}
      {modal?.type === 'edit' && (
        <DiseaseModal mode="edit" disease={modal.data} onClose={() => setModal(null)} onSaved={() => handleSaved('Cập nhật bệnh thành công!')} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal disease={modal.data} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
