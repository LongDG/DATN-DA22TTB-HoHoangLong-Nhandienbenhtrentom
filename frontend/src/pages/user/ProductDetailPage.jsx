import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, CheckCircle2, Star, Package,
  Shield, Truck, RefreshCw, ChevronRight, ChevronLeft,
  Beaker, Leaf, Clock, AlertCircle, Plus, Minus,
} from 'lucide-react';

const API = 'http://localhost:5000/api';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80';

const PURPOSE_LABEL = {
  phongbenh: { label: 'Phòng bệnh',   cls: 'bg-blue-100 text-blue-700' },
  dieutri:   { label: 'Điều trị',     cls: 'bg-red-100 text-red-700'   },
  hotro:     { label: 'Hỗ trợ',       cls: 'bg-green-100 text-green-700' },
  dinhduong: { label: 'Dinh dưỡng',   cls: 'bg-amber-100 text-amber-700' },
};

const STATUS_CONFIG = {
  con_hang:  { label: 'Còn hàng',       cls: 'bg-green-100 text-green-700 border-green-200' },
  sap_het:   { label: 'Sắp hết hàng', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  het_hang:  { label: 'Hết hàng',      cls: 'bg-red-100 text-red-600 border-red-200' },
  ngung_ban: { label: 'Ngừng kinh doanh', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

/* ── Image Gallery ── */
function ImageGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const imgs = images?.length ? images : [FALLBACK_IMG];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group">
        <img
          src={imgs[active]}
          alt={name}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = FALLBACK_IMG; }}
        />
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setActive(a => (a - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
            ><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
            <button
              onClick={() => setActive(a => (a + 1) % imgs.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors"
            ><ChevronRight className="w-5 h-5 text-slate-600" /></button>
          </>
        )}
      </div>
      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${active === i ? 'border-[#0077b6] shadow-md' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
            >
              <img src={img} alt="" className="w-full h-full object-contain p-1 bg-slate-50" onError={e => { e.target.src = FALLBACK_IMG; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Info Section ── */
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#0077b6]/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#0077b6]" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-[#191c1d] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useOutletContext();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [qty, setQty]         = useState(1);
  const [added, setAdded]     = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/products/${id}`)
      .then(r => { if (!r.ok) throw new Error('Không tìm thấy sản phẩm'); return r.json(); })
      .then(setProduct)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || product.status === 'het_hang' || product.isNgungBan) return;
    const resolvedImage = product.image || FALLBACK_IMG;
    for (let i = 0; i < qty; i++) addToCart({ ...product, image: resolvedImage });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0077b6] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
      <AlertCircle className="w-16 h-16 text-slate-300" />
      <h2 className="text-xl font-bold text-slate-600">Không tìm thấy sản phẩm</h2>
      <p className="text-slate-400">{error}</p>
      <button onClick={() => navigate('/store')} className="px-6 py-2.5 bg-[#0077b6] text-white font-semibold rounded-xl hover:bg-[#005d90] transition-colors">
        Quay lại cửa hàng
      </button>
    </div>
  );

  const statusCfg = STATUS_CONFIG[product.isNgungBan ? 'ngung_ban' : product.status] || STATUS_CONFIG.het_hang;
  const isOut = product.status === 'het_hang' || product.isNgungBan;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <button onClick={() => navigate('/home')} className="hover:text-[#0077b6] transition-colors">Trang chủ</button>
        <ChevronRight className="w-4 h-4" />
        <button onClick={() => navigate('/store')} className="hover:text-[#0077b6] transition-colors">Cửa hàng</button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#191c1d] font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0077b6] mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Left: Gallery */}
        <div>
          <ImageGallery images={product.images} name={product.name} />
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${product.tagColor || 'bg-[#0077b6]'}`}>
              {product.categoryLabel}
            </span>
            {(product.purpose || []).map(p => {
              const cfg = PURPOSE_LABEL[p];
              return cfg ? (
                <span key={p} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                  {cfg.label}
                </span>
              ) : null;
            })}
          </div>

          {/* Name */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{product.brand}</p>
            <h1 className="text-3xl font-extrabold text-[#191c1d] leading-tight">{product.name}</h1>
          </div>

          {/* Rating & sold */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}
              <span className="text-sm text-slate-500 ml-1">(4.0)</span>
            </div>
            {product.sold > 0 && (
              <span className="text-sm text-slate-400">Đã bán <span className="font-semibold text-slate-600">{product.sold}</span></span>
            )}
          </div>

          {/* Price */}
          <div className="py-4 border-y border-slate-100">
            <p className="text-4xl font-extrabold text-[#0077b6]">{product.priceLabel}</p>
            <p className="text-sm text-slate-400 mt-1">/ {product.unit}</p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${statusCfg.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusCfg.label}
            </span>
            {product.qty > 0 && !product.isNgungBan && (
              <span className="text-sm text-slate-400">Còn <span className="font-semibold text-slate-600">{product.qty}</span> {product.unit}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-slate-600 leading-relaxed">{product.description}</p>

          {/* Qty + Add to Cart */}
          {!isOut && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-base font-bold text-[#191c1d]">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.qty, q + 1))} className="w-11 h-11 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-12 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-[#0077b6] text-white hover:bg-[#005d90] shadow-lg shadow-[#0077b6]/25'
                }`}
              >
                {added ? <><CheckCircle2 className="w-5 h-5" />Đã thêm vào giỏ!</> : <><ShoppingCart className="w-5 h-5" />Thêm vào giỏ hàng</>}
              </button>
            </div>
          )}

          {isOut && (
            <div className={`rounded-xl p-4 border flex flex-col gap-2 ${
              product.isNgungBan
                ? 'bg-slate-50 border-slate-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 shrink-0 ${
                  product.isNgungBan ? 'text-slate-400' : 'text-amber-500'
                }`} />
                <p className={`font-bold text-sm ${
                  product.isNgungBan ? 'text-slate-600' : 'text-amber-700'
                }`}>
                  {product.isNgungBan
                    ? 'Sản phẩm đã ngừng kinh doanh'
                    : 'Sản phẩm tạm hết hàng'
                  }
                </p>
              </div>
              <p className="text-xs text-slate-400 ml-7">
                {product.isNgungBan
                  ? 'Sản phẩm này không còn được cung cấp. Vui lòng xem các sản phẩm khác.'
                  : 'Sản phẩm đang được nhập hàng, vui lòng quay lại sau.'
                }
              </p>
              <button
                onClick={() => navigate('/store')}
                className="ml-7 w-fit text-xs font-semibold text-[#0077b6] hover:underline"
              >
                Xem sản phẩm khác →
              </button>
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Shield, label: 'Hàng chính hãng' },
              { icon: Truck,  label: 'Giao hàng toàn quốc' },
              { icon: RefreshCw, label: 'Đổi trả 7 ngày' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <Icon className="w-5 h-5 text-[#0077b6]" />
                <p className="text-[11px] font-semibold text-slate-500 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Công dụng */}
        {product.uses?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-[#191c1d] mb-4 flex items-center gap-2">
              <Beaker className="w-5 h-5 text-[#0077b6]" /> Công dụng
            </h3>
            <ul className="space-y-2.5">
              {product.uses.map((u, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  {u}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Liều dùng */}
        {product.dosage && Object.keys(product.dosage).length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-[#191c1d] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#904300]" /> Liều dùng
            </h3>
            <div className="space-y-3">
              {product.dosage.dinh_ky && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wide mb-1">Định kỳ phòng bệnh</p>
                  <p className="text-sm font-semibold text-blue-700">{product.dosage.dinh_ky}</p>
                </div>
              )}
              {product.dosage.xu_ly_benh && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-[11px] font-bold text-red-400 uppercase tracking-wide mb-1">Khi xử lý bệnh</p>
                  <p className="text-sm font-semibold text-red-700">{product.dosage.xu_ly_benh}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thông tin thêm */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-[#191c1d] mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" /> Thông tin sản phẩm
          </h3>
          <div className="space-y-1">
            <InfoRow icon={Package} label="Thương hiệu"     value={product.brand} />
            <InfoRow icon={Leaf}    label="Gốc thuốc"       value={product.origin} />
            <InfoRow icon={Beaker}  label="Phân loại"       value={product.categoryLabel} />
            <InfoRow icon={Package} label="Đơn vị tính"     value={product.unit} />
          </div>
        </div>
      </div>
    </div>
  );
}
