import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  LayoutGrid, Droplet, Stethoscope, Package, Star,
  ShoppingCart, X, CheckCircle2,
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const ICON_MAP_STORE = {
  Droplet: () => <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2 C12 2 4 10 4 15 a8 8 0 0 0 16 0 C20 10 12 2 12 2z"/></svg>,
  Beaker:  () => <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 3V14L4 19h16l-5-5V3H9zM11 3h2v1h-2z"/></svg>,
  Package: () => <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L20 8v.1L12 12 4 8.1V8L12 4.2zM4 10l8 4 8-4v7l-8 4-8-4V10z"/></svg>,
  default: () => <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/></svg>,
};

function CatIcon({ name }) {
  const Icon = ICON_MAP_STORE[name] || ICON_MAP_STORE.default;
  return <Icon />;
}

const DISEASE_FILTERS = [
  { key: 'dom_trang', label: 'Đốm trắng' },
  { key: 'gan_tuy', label: 'Gan tụy' },
  { key: 'phan_trang', label: 'Phân trắng' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'popular', label: 'Phổ biến nhất' },
];

const FALLBACK_IMGS = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
  'https://images.unsplash.com/photo-1550831107-1553da8c8464?w=400&q=80',
];

/* ── Product Card ── */
function ProductCard({ product, onAdd }) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const img = product.image || FALLBACK_IMGS[parseInt(product.id?.slice(-1) || '0') % 4];
  const isOut = product.status === 'het_hang';

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOut) return;
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100 group flex flex-col cursor-pointer hover:-translate-y-1"
    >
      <div className="relative h-52 overflow-hidden bg-slate-50 shrink-0">
        <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold text-white uppercase tracking-wide shadow-sm ${product.tagColor || 'bg-[#0077b6]'}`}>
          {product.categoryLabel}
        </div>
        {isOut && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-red-100 text-red-600 font-bold text-xs px-3 py-1 rounded-full border border-red-200">Hết hàng</span>
          </div>
        )}
        {product.sold > 0 && !isOut && (
          <div className="absolute top-3 right-3 bg-white/90 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-600" /> Đã bán {product.sold}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{product.brand}</p>
        <h3 className="text-base font-bold text-[#191c1d] mb-1 group-hover:text-[#0077b6] transition-colors leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-sm text-slate-500 mb-4 flex-grow line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-xl font-bold text-[#0077b6]">{product.priceLabel}</span>
            <p className="text-xs text-slate-400">/ {product.unit}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={isOut}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all active:scale-95 ${added ? 'bg-green-100 text-green-700' :
                isOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                  'bg-[#0077b6]/10 text-[#0077b6] hover:bg-[#0077b6] hover:text-white'
              }`}
          >
            {added
              ? <><CheckCircle2 className="w-4 h-4" />Đã thêm</>
              : <><ShoppingCart className="w-4 h-4" />Thêm</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function StorePage() {
  // Lấy addToCart từ UserLayout qua outlet context
  const { addToCart } = useOutletContext();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // Danh mục động từ DB
  const [categories, setCategories] = useState([{ key: 'all', label: 'Tất cả', icon: 'Package', color: '' }]);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(data => {
        const active = (Array.isArray(data) ? data : []).filter(c => c.active !== false);
        setCategories([{ key: 'all', label: 'Tất cả', icon: 'Package', color: '' }, ...active]);
      })
      .catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ category, sort, page, limit: 9 });
    if (search) params.set('search', search);
    fetch(`${API}/products?${params}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, sort, page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-16">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#191c1d] mb-1">Cửa hàng thuốc</h1>
        <p className="text-slate-500">Giải pháp chăm sóc và điều trị bệnh cho tôm sú chuyên nghiệp</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-64 flex-shrink-0 space-y-5">
          {/* Categories */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm text-[#0077b6] mb-4 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Phân loại
            </h3>
            <ul className="space-y-1">
              {categories.map(c => (
                <li key={c.key}>
                  <button
                    onClick={() => { setCategory(c.key); setPage(1); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                      category === c.key ? 'bg-[#0077b6] text-white shadow-md shadow-[#0077b6]/20' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CatIcon name={c.icon} />
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="font-bold text-sm text-[#0077b6] mt-6 mb-4 flex items-center gap-2">
              <Droplet className="w-4 h-4" /> Tình trạng ao
            </h3>
            <ul className="space-y-2.5">
              {DISEASE_FILTERS.map(d => (
                <li key={d.key} className="flex items-center gap-3 group cursor-pointer px-1">
                  <div className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-[#0077b6] transition-colors shrink-0" />
                  <span className="text-sm text-slate-600 group-hover:text-[#0077b6]">{d.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Banner */}
          <div className="bg-[#0077b6] rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="font-semibold text-sm opacity-90 mb-1">Tư vấn miễn phí</p>
              <h4 className="text-lg font-bold mb-4 leading-tight">Chat với bác sĩ thú y ngay!</h4>
              <button className="bg-white text-[#0077b6] px-4 py-2 rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95">
                Kết nối ngay
              </button>
            </div>
            <Stethoscope className="absolute -bottom-4 -right-4 w-28 h-28 opacity-10 rotate-12" />
          </div>
        </aside>

        {/* ── Product Grid ── */}
        <div className="flex-1 min-w-0">
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none text-sm"
                placeholder="Tìm kiếm tên thuốc, thương hiệu..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative sm:w-52">
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
                className="w-full pl-4 pr-9 py-3 bg-white border border-slate-200 rounded-xl appearance-none outline-none text-sm font-medium text-slate-600 focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6]"
              >
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>Sắp xếp: {s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-5">
            Hiển thị <span className="font-semibold text-[#191c1d]">{products.length}</span> trong <span className="font-semibold text-[#191c1d]">{total}</span> sản phẩm
          </p>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
          ) : products.length === 0 ? (
            <div className="py-24 text-center">
              <Package className="w-16 h-16 mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-semibold text-slate-500">Không tìm thấy sản phẩm</h3>
              <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`w-10 h-10 rounded-xl font-semibold text-sm transition-colors ${page === n ? 'bg-[#0077b6] text-white shadow-md' : 'border border-slate-200 text-slate-600 hover:bg-white'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
