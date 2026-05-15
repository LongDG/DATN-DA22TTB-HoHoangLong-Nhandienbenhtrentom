import { useState, useEffect, useCallback } from 'react';
import {
  Search, CircleAlert, ListFilter, Plus, Pencil,
  Trash2, ImageOff, ChevronLeft, ChevronRight,
  X, Package, Save, AlertTriangle,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const CATEGORIES = [
  { key: 'all',                 label: 'Tất cả danh mục' },
  { key: 'dac_tri',             label: 'Đặc trị' },
  { key: 'vi_sinh',             label: 'Vi sinh' },
  { key: 'vi_sinh_moi_truong',  label: 'Vi sinh MT' },
  { key: 'dinh_duong_de_khang', label: 'Dinh dưỡng' },
];

const STATUS_CONFIG = {
  con_hang: { label: 'Còn hàng', cls: 'bg-[#aeeecb]/60 text-[#316e52] border-[#2c694e]/10' },
  sap_het:  { label: 'Sắp hết',  cls: 'bg-[#ffdbc8] text-[#743500] border-[#904300]/10'    },
  het_hang: { label: 'Hết hàng', cls: 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/10'    },
};

const MUC_DICH = [
  { key: 'phongbenh', label: 'Phòng bệnh' },
  { key: 'dieutri',   label: 'Điều trị'   },
  { key: 'hotro',     label: 'Hỗ trợ'     },
];

const EMPTY_FORM = {
  tensanpham: '', thuonghieu: '', loaisanpham: 'dac_tri',
  soluong: '', gia: '', donvi: 'chai', mota: '',
  goc_thuoc: '',
  congdung: '',          // textarea — split by newline
  lieudung_dinh_ky: '',
  lieudung_xu_ly: '',
  hinhanh: '',           // URL ảnh đầu tiên
  trangthai: 'dang_ban',
  muc_dich_su_dung: [],
};

/* ── Modal Thêm / Sửa ── */
function ProductModal({ mode, product, categories, onClose, onSave }) {
  const [form, setForm] = useState(mode === 'edit' ? {
    tensanpham:        product.name        || '',
    thuonghieu:        product.brand       || '',
    loaisanpham:       product.categoryKey || 'dac_tri',
    soluong:           product.qty         ?? '',
    gia:               product.price       ?? '',
    donvi:             product.unit        || 'chai',
    mota:              product.mota        || '',
    goc_thuoc:         product.goc_thuoc   || '',
    congdung:          (product.congdung   || []).join('\n'),
    lieudung_dinh_ky:  product.lieudung?.dinh_ky   || '',
    lieudung_xu_ly:    product.lieudung?.xu_ly_benh || '',
    hinhanh:           product.image       || '',
    trangthai:         product.trangthai   || 'dang_ban',
    muc_dich_su_dung:  product.muc_dich    || [],
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleMucDich = (key) => setForm(prev => ({
    ...prev,
    muc_dich_su_dung: prev.muc_dich_su_dung.includes(key)
      ? prev.muc_dich_su_dung.filter(k => k !== key)
      : [...prev.muc_dich_su_dung, key],
  }));

  const handleSubmit = async () => {
    if (!form.tensanpham.trim()) { setError('Vui lòng nhập tên sản phẩm'); return; }
    if (!form.loaisanpham)       { setError('Vui lòng chọn danh mục');     return; }
    setSaving(true); setError('');
    try {
      // Build payload đúng schema DB
      const payload = {
        tensanpham:  form.tensanpham.trim(),
        thuonghieu:  form.thuonghieu.trim(),
        loaisanpham: form.loaisanpham,
        soluong:     parseInt(form.soluong)  || 0,
        gia:         parseFloat(form.gia)    || 0,
        donvi:       form.donvi,
        mota:        form.mota.trim(),
        goc_thuoc:   form.goc_thuoc.trim(),
        trangthai:   form.trangthai,
        muc_dich_su_dung: form.muc_dich_su_dung,
        congdung: form.congdung.split('\n').map(s => s.trim()).filter(Boolean),
        lieudung: {
          dinh_ky:    form.lieudung_dinh_ky.trim(),
          xu_ly_benh: form.lieudung_xu_ly.trim(),
        },
        hinhanh: form.hinhanh.trim() ? [form.hinhanh.trim()] : [],
      };
      const url    = mode === 'edit' ? `${API_BASE}/admin/inventory/${product.id}` : `${API_BASE}/admin/inventory`;
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSave();
    } catch (e) {
      setError(e.message || 'Lỗi lưu sản phẩm');
    } finally { setSaving(false); }
  };

  const IC = 'w-full px-3 py-2.5 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e4]">
          <h2 className="text-lg font-bold text-[#191c1d]">{mode === 'edit' ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full transition-colors"><X className="w-5 h-5 text-[#707881]" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a]">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* ─ Thông tin cơ bản ─ */}
          <div>
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-3">Thông tin cơ bản</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tên sản phẩm *</label>
                <input className={IC} placeholder="VD: Beta Glucan tỏi - Đề Kháng WSSV" value={form.tensanpham} onChange={e => set('tensanpham', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Thương hiệu</label>
                <input className={IC} placeholder="VD: AquaVet" value={form.thuonghieu} onChange={e => set('thuonghieu', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Nguồn gốc / Hoạt chất</label>
                <input className={IC} placeholder="VD: Povidone Iodine 90%" value={form.goc_thuoc} onChange={e => set('goc_thuoc', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Danh mục *</label>
                <select className={IC} value={form.loaisanpham} onChange={e => set('loaisanpham', e.target.value)}>
                  {categories.filter(c => c.key !== 'all').map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Trạng thái</label>
                <select className={IC} value={form.trangthai} onChange={e => set('trangthai', e.target.value)}>
                  <option value="dang_ban">Đang bán</option>
                  <option value="ngung_ban">Ngừng bán</option>
                  <option value="sap_ra_mat">Sắp ra mắt</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─ Tồn kho & Giá ─ */}
          <div>
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-3">Tồn kho & Giá</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Số lượng tồn</label>
                <input type="number" min="0" className={IC} placeholder="0" value={form.soluong} onChange={e => set('soluong', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Đơn vị</label>
                <select className={IC} value={form.donvi} onChange={e => set('donvi', e.target.value)}>
                  {['chai', 'gói', 'bao', 'hộp', 'lít', 'kg', 'túi', 'thùng'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Đơn giá (VND)</label>
                <input type="number" min="0" className={IC} placeholder="0" value={form.gia} onChange={e => set('gia', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ─ Mô tả & Công dụng ─ */}
          <div>
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-3">Mô tả & Công dụng</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Mô tả sản phẩm</label>
                <textarea rows={2} className={IC + ' resize-none'} placeholder="Mô tả ngắn gọn về sản phẩm..." value={form.mota} onChange={e => set('mota', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Công dụng <span className="normal-case text-[#707881]">(mỗi dòng 1 công dụng)</span></label>
                <textarea rows={3} className={IC + ' resize-none'} placeholder={"Tăng đề kháng chống WSSV\nPhục hồi sức khỏe sau bệnh\nThúc đẩy tiêu hóa"} value={form.congdung} onChange={e => set('congdung', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ─ Liều dùng ─ */}
          <div>
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-3">Liều dùng</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Dùng định kỳ</label>
                <input className={IC} placeholder="VD: 3g/kg thức ăn" value={form.lieudung_dinh_ky} onChange={e => set('lieudung_dinh_ky', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Khi xử lý bệnh</label>
                <input className={IC} placeholder="VD: 5-7g/kg thức ăn" value={form.lieudung_xu_ly} onChange={e => set('lieudung_xu_ly', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ─ Mục đích sử dụng ─ */}
          <div>
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-3">Mục đích sử dụng</p>
            <div className="flex gap-3">
              {MUC_DICH.map(m => (
                <button
                  key={m.key} type="button"
                  onClick={() => toggleMucDich(m.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${form.muc_dich_su_dung.includes(m.key) ? 'bg-[#0077b6] text-white border-[#0077b6]' : 'bg-[#f3f4f5] text-[#404850] border-[#bfc7d1] hover:border-[#0077b6]'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─ Hình ảnh ─ */}
          <div>
            <p className="text-xs font-bold text-[#0077b6] uppercase tracking-wider mb-3">Hình ảnh</p>
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">URL ảnh sản phẩm</label>
              <input className={IC} placeholder="https://... hoặc /assets/images/ten-san-pham.jpg" value={form.hinhanh} onChange={e => set('hinhanh', e.target.value)} />
              {form.hinhanh && (
                <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-[#bfc7d1] bg-[#f3f4f5]">
                  <img src={form.hinhanh} alt="preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e1e3e4]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#404850] border border-[#bfc7d1] rounded-lg hover:bg-[#f3f4f5] transition-colors">Hủy</button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 text-sm font-bold bg-[#0077b6] text-white rounded-lg hover:bg-[#005d90] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === 'edit' ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPrice(price) {
  return price ? price.toLocaleString('vi-VN') + 'đ' : '—';
}

function StatusBadge({ status, label }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.con_hang;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cfg.cls}`}>
      {label || cfg.label}
    </span>
  );
}

/* ── Modal Xác nhận Xóa ── */
function DeleteModal({ product, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm(product.id);
    setDeleting(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-[#ba1a1a]" />
        </div>
        <h3 className="text-lg font-bold text-[#191c1d] mb-1">Xác nhận xóa</h3>
        <p className="text-sm text-[#707881] mb-6">Bạn có chắc muốn xóa sản phẩm <strong className="text-[#191c1d]">"{product?.name}"</strong>? Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5] transition-colors">
            Hủy
          </button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 text-sm font-bold bg-[#ba1a1a] text-white rounded-xl hover:bg-[#93000a] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function InventoryPage() {
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [lowStock, setLowStock]   = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [category, setCategory]   = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [toast, setToast]         = useState('');
  // Danh mục động từ DB
  const [categories, setCategories] = useState(CATEGORIES);
  const LIMIT = 10;

  // Fetch danh mục từ /api/categories
  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories([{ key: 'all', label: 'Tất cả danh mục' }, ...data.filter(c => c.active !== false)]);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchInventory = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT, category });
    if (search) params.set('search', search);
    fetch(`${API_BASE}/admin/inventory?${params}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setLowStock(data.lowStock ?? 0);
      })
      .catch(err => console.error('Lỗi kho:', err))
      .finally(() => setLoading(false));
  }, [page, search, category]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/admin/inventory/${id}`, { method: 'DELETE' });
    setModal(null);
    showToast('✅ Đã xóa sản phẩm thành công!');
    fetchInventory();
  };

  const handleSave = () => {
    setModal(null);
    showToast(modal?.type === 'edit' ? '✅ Đã cập nhật sản phẩm!' : '✅ Đã thêm sản phẩm mới!');
    fetchInventory();
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-[#191c1d] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'add' && (
        <ProductModal mode="add" categories={categories} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === 'edit' && (
        <ProductModal mode="edit" product={modal.product} categories={categories} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal product={modal.product} onClose={() => setModal(null)} onConfirm={handleDelete} />
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 mt-2 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Quản lý kho hàng</h1>
          <p className="text-base text-[#404850]">Theo dõi và quản lý vật tư nuôi tôm định kỳ.</p>
        </div>
        {lowStock > 0 && (
          <div className="flex items-center gap-4 bg-[#ffdbc8] p-4 rounded-xl shadow-sm border border-[#904300]/20 shrink-0">
            <div className="bg-[#b65600] p-2 rounded-lg text-white">
              <CircleAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#321300] font-bold text-base">{lowStock} sản phẩm sắp hết / hết</p>
              <p className="text-[#743500] text-xs font-medium">Cần nhập thêm hàng ngay lập tức</p>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-[#e1e3e4]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" />
            <input
              className="pl-9 pr-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none text-sm w-64"
              placeholder="Tìm sản phẩm, thương hiệu..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707881] hover:text-[#191c1d]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none"
          >
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#404850] hover:bg-[#e7e8e9] rounded-lg transition-colors border border-[#bfc7d1]">
            <ListFilter className="w-4 h-4" /> Lọc nâng cao
          </button>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="bg-[#0077b6] hover:bg-[#005d90] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Thêm sản phẩm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#e1e3e4]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead className="bg-[#f3f4f5] border-b border-[#e1e3e4]">
              <tr>
                {['Hình ảnh', 'Tên sản phẩm / Thương hiệu', 'Danh mục', 'Tồn kho', 'Đơn giá', 'Đã bán', 'Trạng thái', 'Hành động'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-semibold text-[#404850] uppercase tracking-wider${i === 3 || i === 5 ? ' text-center' : i === 7 ? ' text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e8e9]">
              {loading && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-[#707881]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0077b6] border-t-transparent rounded-full animate-spin" />
                    Đang tải...
                  </div>
                </td></tr>
              )}
              {!loading && products.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-[#bfc7d1] mb-3" />
                  <p className="text-[#707881] text-sm font-medium">Không tìm thấy sản phẩm nào.</p>
                </td></tr>
              )}
              {!loading && products.map(p => (
                <tr key={p.id} className="hover:bg-[#f8f9fa]/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#edeeef] border border-[#e1e3e4] flex items-center justify-center">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <ImageOff className="w-7 h-7 text-[#bfc7d1]" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#191c1d]">{p.name}</p>
                    <p className="text-xs text-[#707881] mt-0.5">{p.brand}</p>
                    <p className="text-[10px] text-[#bfc7d1] mt-0.5 font-mono">#{p.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#404850] font-medium">{p.category}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold text-lg ${p.status === 'het_hang' ? 'text-[#ba1a1a]' : p.status === 'sap_het' ? 'text-[#904300]' : 'text-[#2c694e]'}`}>{p.qty}</span>
                    <span className="text-xs text-[#707881] ml-1">{p.unit}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#191c1d]">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4 text-center"><span className="text-sm font-semibold text-[#404850]">{p.sold}</span></td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} label={p.statusLabel} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ type: 'edit', product: p })}
                        className="p-2 text-[#404850] hover:bg-[#e7e8e9] rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-[18px] h-[18px]" />
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', product: p })}
                        className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-[#f3f4f5]/50 border-t border-[#e1e3e4] flex items-center justify-between">
          <span className="text-sm text-[#707881]">
            Hiển thị <span className="font-semibold text-[#191c1d]">{Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)}</span> của <span className="font-semibold text-[#191c1d]">{total}</span> sản phẩm
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white transition-colors disabled:opacity-40">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${page === n ? 'bg-[#0077b6] text-white' : 'border border-[#bfc7d1] hover:bg-white text-[#404850]'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white transition-colors disabled:opacity-40">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
