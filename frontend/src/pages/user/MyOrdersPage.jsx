import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, Truck, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, MapPin, Phone, ArrowLeft, RefreshCw,
  Package,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

const API = 'http://localhost:5000/api';
const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') + 'đ' : '0đ';
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const STATUS = {
  cho_xac_nhan:   { label: 'Chờ xác nhận',  cls: 'bg-[#fff3e0] text-[#904300]',  icon: <Clock className="w-4 h-4" />,        dot: 'bg-[#904300]' },
  dang_giao_hang: { label: 'Đang giao hàng', cls: 'bg-[#e3f2fd] text-[#0077b6]',  icon: <Truck className="w-4 h-4" />,        dot: 'bg-[#0077b6]' },
  da_giao_hang:   { label: 'Đã giao hàng',   cls: 'bg-[#e8f5e9] text-[#2c694e]',  icon: <CheckCircle2 className="w-4 h-4" />, dot: 'bg-[#2c694e]' },
  da_huy:         { label: 'Đã hủy',          cls: 'bg-[#ffdad6] text-[#ba1a1a]',  icon: <XCircle className="w-4 h-4" />,      dot: 'bg-[#ba1a1a]' },
};

/** Helper đọc field theo cả 2 schema (mới & cũ) */
const getTotalPrice = (o) => o.tong_tien_thanh_toan ?? o.tong_tien ?? 0;
const getShipping   = (o) => o.phi_vanchuyen ?? o.phi_ship ?? 0;
const getSubtotal   = (o) => o.tong_tien_hang ?? (getTotalPrice(o) - getShipping(o));
const getDate       = (o) => o.ngaytao ?? o.ngay_tao;
const getHoTen      = (o) => o.thong_tin_nhan_hang?.ho_ten       ?? o.ho_ten       ?? '';
const getDiaChi     = (o) => o.thong_tin_nhan_hang?.dia_chi      ?? o.dia_chi      ?? '';
const getTinhThanh  = (o) => o.thong_tin_nhan_hang?.tinh_thanh   ?? o.tinh_thanh   ?? '';
const getSDT        = (o) => o.thong_tin_nhan_hang?.so_dien_thoai ?? o.so_dien_thoai ?? '';
const getPTTT       = (o) => o.phuong_thuc_thanh_toan ?? o.phuong_thuc_tt ?? '';
const getMaDon      = (o) => o.mavandon ?? ('DH' + o._id.slice(-6).toUpperCase());

function OrderCard({ order, onCancel }) {
  const [open, setOpen]           = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const s = STATUS[order.trang_thai_don_hang] || STATUS.cho_xac_nhan;
  const canCancel = order.trang_thai_don_hang === 'cho_xac_nhan';

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      const res = await authFetch(`${API}/orders/${order._id}/cancel`, { method: 'PATCH' });
      if (res.ok) onCancel(order._id);
    } catch {}
    finally { setCancelling(false); }
  };

  const sanPham    = order.san_pham || [];
  const totalPrice = getTotalPrice(order);
  const shipping   = getShipping(order);
  const subtotal   = getSubtotal(order);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e7edf3] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-[#0077b6]/10 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-[#0077b6]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-[#191c1d] text-sm">{getMaDon(order)}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>
                {s.icon}{s.label}
              </span>
            </div>
            <p className="text-xs text-[#707881] mt-0.5">{fmtDate(getDate(order))}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-[#0077b6]">{fmt(totalPrice)}</p>
          <p className="text-[10px] text-[#707881]">{sanPham.length} sản phẩm</p>
        </div>
      </div>

      {/* Sản phẩm preview */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sanPham.slice(0, 4).map((sp, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#f8fafc] rounded-xl px-3 py-2 text-xs shrink-0 border border-[#e7edf3]">
              {sp.hinhanh
                ? <img src={sp.hinhanh} alt={sp.ten_san_pham} className="w-8 h-8 rounded-lg object-cover" />
                : <Package className="w-8 h-8 text-[#bfc7d1]" />
              }
              <div>
                <p className="font-semibold text-[#191c1d] max-w-[120px] truncate">{sp.ten_san_pham}</p>
                <p className="text-[#707881]">x{sp.so_luong} · {fmt(sp.don_gia)}</p>
              </div>
            </div>
          ))}
          {sanPham.length > 4 && (
            <div className="flex items-center justify-center bg-[#f3f4f5] rounded-xl px-4 py-2 text-xs text-[#707881] font-semibold shrink-0">
              +{sanPham.length - 4} khác
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-[#f3f4f5] flex items-center justify-between gap-3">
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#707881] hover:text-[#404850] transition-colors">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {open ? 'Ẩn chi tiết' : 'Xem chi tiết'}
        </button>
        <div className="flex gap-2">
          {canCancel && (
            <button onClick={handleCancel} disabled={cancelling}
              className="px-4 py-2 text-xs font-bold text-[#ba1a1a] border border-[#ffdad6] bg-[#ffdad6]/30 rounded-xl hover:bg-[#ffdad6] transition-colors disabled:opacity-50">
              {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
            </button>
          )}
          <Link to="/store"
            className="px-4 py-2 text-xs font-bold text-white bg-[#0077b6] rounded-xl hover:bg-[#005d90] transition-colors">
            Mua thêm
          </Link>
        </div>
      </div>

      {/* Detail expand */}
      {open && (
        <div className="px-5 py-4 border-t border-[#e7edf3] bg-[#f8fafc] space-y-4">
          {/* Địa chỉ giao hàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-[#707881] uppercase mb-1">Giao đến</p>
              <div className="flex items-start gap-2 text-sm text-[#404850]">
                <MapPin className="w-4 h-4 text-[#0077b6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{getHoTen(order)}</p>
                  <p>{getDiaChi(order)}{getTinhThanh(order) ? `, ${getTinhThanh(order)}` : ''}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#707881] uppercase mb-1">Liên hệ</p>
              <div className="flex items-center gap-2 text-sm text-[#404850]">
                <Phone className="w-4 h-4 text-[#0077b6] shrink-0" />
                <span>{getSDT(order)}</span>
              </div>
              <p className="text-xs text-[#707881] mt-1.5">
                Thanh toán: <span className="font-semibold">{getPTTT(order)}</span>
              </p>
            </div>
          </div>

          {/* Danh sách sản phẩm đầy đủ */}
          <div>
            <p className="text-xs font-bold text-[#707881] uppercase mb-2">Chi tiết sản phẩm</p>
            <div className="space-y-2">
              {sanPham.map((sp, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-[#e7edf3]">
                  <div className="flex items-center gap-3">
                    {sp.hinhanh
                      ? <img src={sp.hinhanh} alt={sp.ten_san_pham} className="w-10 h-10 rounded-lg object-cover border border-[#e7edf3]" />
                      : <div className="w-10 h-10 rounded-lg bg-[#f3f4f5] flex items-center justify-center"><Package className="w-5 h-5 text-[#bfc7d1]" /></div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-[#191c1d]">{sp.ten_san_pham}</p>
                      <p className="text-xs text-[#707881]">Đơn giá: {fmt(sp.don_gia)} × {sp.so_luong}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#0077b6] shrink-0">{fmt(sp.thanh_tien ?? sp.don_gia * sp.so_luong)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="bg-white rounded-xl border border-[#e7edf3] p-4 space-y-2">
            <div className="flex justify-between text-sm text-[#404850]">
              <span>Tạm tính</span>
              <span className="font-semibold">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#404850]">
              <span>Phí vận chuyển</span>
              <span className="font-semibold">{shipping === 0 ? 'Miễn phí' : fmt(shipping)}</span>
            </div>
            {(order.giam_gia > 0) && (
              <div className="flex justify-between text-sm text-[#2c694e]">
                <span>Giảm giá</span>
                <span className="font-semibold">-{fmt(order.giam_gia)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#e7edf3] flex justify-between font-black text-base">
              <span className="text-[#191c1d]">Tổng cộng</span>
              <span className="text-[#0077b6]">{fmt(totalPrice)}</span>
            </div>
          </div>

          {/* Lịch sử trạng thái */}
          {order.lich_su_trang_thai?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#707881] uppercase mb-2">Lịch sử đơn hàng</p>
              <div className="space-y-1.5">
                {[...order.lich_su_trang_thai].reverse().map((ls, i) => {
                  const st = STATUS[ls.trang_thai] || {};
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot || 'bg-slate-400'}`} />
                      <span className="font-semibold text-[#404850] capitalize">{st.label || ls.trang_thai}</span>
                      <span className="text-[#707881] ml-auto">{fmtDate(ls.thoi_gian)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.ghi_chu && (
            <p className="text-xs text-[#707881] italic bg-[#fff8e1] border border-[#ffd54f] rounded-xl px-4 py-2">
              📝 Ghi chú: {order.ghi_chu}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  const navigate  = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`${API}/orders`);
      if (!res.ok) { setOrders([]); return; }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = (id) => {
    setOrders(prev => prev.map(o =>
      o._id === id ? { ...o, trang_thai_don_hang: 'da_huy' } : o
    ));
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.trang_thai_don_hang === filter);

  const FILTERS = [
    { key: 'all',            label: 'Tất cả',       count: orders.length },
    { key: 'cho_xac_nhan',   label: 'Chờ xác nhận', count: orders.filter(o => o.trang_thai_don_hang === 'cho_xac_nhan').length },
    { key: 'dang_giao_hang', label: 'Đang giao',     count: orders.filter(o => o.trang_thai_don_hang === 'dang_giao_hang').length },
    { key: 'da_giao_hang',   label: 'Đã giao',       count: orders.filter(o => o.trang_thai_don_hang === 'da_giao_hang').length },
    { key: 'da_huy',         label: 'Đã hủy',        count: orders.filter(o => o.trang_thai_don_hang === 'da_huy').length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#f8fafc] to-[#f0f7ff]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl text-[#707881] hover:text-[#191c1d] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#191c1d]">Đơn hàng của tôi</h1>
            <p className="text-sm text-[#707881] mt-0.5">Theo dõi và quản lý đơn hàng đã đặt</p>
          </div>
          <button onClick={fetchOrders} className="p-2 hover:bg-white rounded-xl text-[#707881] transition-colors" title="Làm mới">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all ${
                filter === f.key
                  ? 'bg-[#0077b6] text-white shadow-lg shadow-[#0077b6]/25'
                  : 'bg-white text-[#707881] border border-[#e7edf3] hover:border-[#0077b6] hover:text-[#0077b6]'
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-[#f3f4f5]'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-[#e7edf3]">
            <ShoppingBag className="w-16 h-16 text-[#bfc7d1] mb-4" />
            <p className="text-lg font-bold text-[#404850]">
              {filter === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn "${FILTERS.find(f => f.key === filter)?.label}"`}
            </p>
            <p className="text-sm text-[#707881] mt-1 mb-5">Hãy khám phá các sản phẩm của chúng tôi</p>
            <Link to="/store" className="px-6 py-2.5 bg-[#0077b6] text-white font-bold rounded-xl hover:bg-[#005d90] transition-all text-sm">
              Đến cửa hàng
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <OrderCard key={order._id} order={order} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
