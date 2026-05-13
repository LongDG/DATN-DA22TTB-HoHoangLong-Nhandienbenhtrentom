import { useState, useEffect, useCallback } from 'react';
import {
  Search, CircleAlert, ListFilter, Plus, Pencil,
  Trash2, ImageOff, ChevronLeft, ChevronRight, ShoppingCart,
  X, Package,
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

function QtyCell({ qty, unit, status }) {
  const color = status === 'het_hang' ? 'text-[#ba1a1a]'
              : status === 'sap_het'  ? 'text-[#904300]'
              : 'text-[#2c694e]';
  return (
    <span>
      <span className={`font-bold text-lg ${color}`}>{qty}</span>
      <span className="text-xs text-[#707881] ml-1">{unit}</span>
    </span>
  );
}

export default function InventoryPage() {
  const [products, setProducts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [lowStock, setLowStock]   = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('all');
  const LIMIT = 10;

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

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 mt-2 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Quản lý kho hàng</h1>
          <p className="text-base text-[#404850]">Theo dõi và quản lý vật tư nuôi tôm định kỳ.</p>
        </div>

        {/* Low-stock Alert Widget */}
        {lowStock > 0 && (
          <div className="flex items-center gap-4 bg-[#ffdbc8] p-4 rounded-xl shadow-sm border border-[#904300]/20 shrink-0">
            <div className="bg-[#b65600] p-2 rounded-lg text-white">
              <CircleAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#321300] font-bold text-base">{lowStock} sản phẩm sắp hết / hết</p>
              <p className="text-[#743500] text-xs font-medium">Cần nhập thêm hàng ngay lập tức</p>
            </div>
            <button className="ml-4 text-[#904300] font-bold hover:underline text-sm whitespace-nowrap">
              Xem chi tiết
            </button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-[#e1e3e4]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
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

          {/* Category filter */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none"
          >
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#404850] hover:bg-[#e7e8e9] rounded-lg transition-colors border border-[#bfc7d1]">
            <ListFilter className="w-4 h-4" />
            Lọc nâng cao
          </button>
        </div>

        <button className="bg-[#0077b6] hover:bg-[#005d90] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
          <Plus className="w-5 h-5" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#e1e3e4] flex-1">
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
                  {/* Image */}
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#edeeef] border border-[#e1e3e4] flex items-center justify-center">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <ImageOff className="w-7 h-7 text-[#bfc7d1]" />
                      }
                    </div>
                  </td>

                  {/* Name + Brand */}
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#191c1d]">{p.name}</p>
                    <p className="text-xs text-[#707881] mt-0.5">{p.brand}</p>
                    <p className="text-[10px] text-[#bfc7d1] mt-0.5 font-mono">#{p.sku}</p>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 text-sm text-[#404850] font-medium">{p.category}</td>

                  {/* Stock */}
                  <td className="px-6 py-4 text-center">
                    <QtyCell qty={p.qty} unit={p.unit} status={p.status} />
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 font-semibold text-[#191c1d]">{formatPrice(p.price)}</td>

                  {/* Sold */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-[#404850]">{p.sold}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} label={p.statusLabel} />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-[#005d90] hover:bg-[#cde5ff] rounded-lg transition-colors" title="Nhập hàng">
                        <ShoppingCart className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                      </button>
                      <button className="p-2 text-[#404850] hover:bg-[#e7e8e9] rounded-lg transition-colors" title="Chỉnh sửa">
                        <Pencil className="w-[18px] h-[18px]" />
                      </button>
                      <button className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors" title="Xóa">
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
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors ${
                  page === n
                    ? 'bg-[#0077b6] text-white'
                    : 'border border-[#bfc7d1] hover:bg-white text-[#404850]'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
