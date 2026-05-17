import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Calendar, ListFilter, Eye, Printer, ClipboardList,
  Clock, Truck, CheckCircle2, TrendingUp, Package, ShoppingCart,
  X, MapPin, Phone, FileText, AlertTriangle,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
import { authFetch } from '../../utils/authFetch';

const STATUS_OPTIONS = [
  { key: 'all',           label: 'Tất cả trạng thái' },
  { key: 'cho_xac_nhan',   label: 'Chờ xử lý' },
  { key: 'dang_giao_hang', label: 'Đang giao' },
  { key: 'da_giao_hang',   label: 'Đã giao' },
  { key: 'da_huy',         label: 'Đã hủy' },
];

const STATUS_STYLE = {
  warning: { dot: 'bg-[#904300]', badge: 'bg-orange-100 text-[#904300]' },
  info:    { dot: 'bg-[#0077b6]', badge: 'bg-sky-100 text-[#0077b6]' },
  success: { dot: 'bg-[#2c694e]', badge: 'bg-green-100 text-[#2c694e]' },
  error:   { dot: 'bg-[#ba1a1a]', badge: 'bg-red-100 text-[#ba1a1a]' },
};

const STATUS_MAP = {
  cho_xac_nhan:   { label: 'Chờ xử lý', color: 'warning' },
  dang_giao_hang: { label: 'Đang giao',  color: 'info' },
  da_giao_hang:   { label: 'Đã giao',    color: 'success' },
  da_huy:         { label: 'Đã hủy',     color: 'error' },
};

const AVATAR_COLORS = [
  'bg-[#cde5ff] text-[#0077b6]', 'bg-[#aeeecb] text-[#2c694e]',
  'bg-[#ffdbc8] text-[#904300]', 'bg-[#ffdad6] text-[#ba1a1a]',
  'bg-[#e8d5ff] text-[#6b21a8]',
];

function formatVND(n) { return n ? n.toLocaleString('vi-VN') + 'đ' : '—'; }

function StatusBadge({ color, label }) {
  const s = STATUS_STYLE[color] || STATUS_STYLE.info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

/* ── Modal Chi Tiết Đơn Hàng ── */
function OrderDetailModal({ orderId, onClose, onStatusChange }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    authFetch(`${API_BASE}/admin/orders/${orderId}`)
      .then(r => r.json())
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/orders/${orderId}/status`, {
        method: 'PATCH', body: JSON.stringify({ trang_thai: newStatus }),
      });
      if (res.ok) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        setToast('✅ Cập nhật trạng thái thành công!');
        setTimeout(() => setToast(''), 2500);
        onStatusChange();
      }
    } catch (e) { console.error(e); }
    finally { setUpdating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e4]">
          <h2 className="text-lg font-bold text-[#191c1d]">Chi tiết đơn hàng</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full"><X className="w-5 h-5 text-[#707881]" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !order ? (
            <p className="text-center text-[#707881]">Không tìm thấy đơn hàng.</p>
          ) : (
            <div className="space-y-5">
              {toast && <div className="p-3 bg-[#aeeecb] text-[#2c694e] rounded-xl text-sm font-semibold">{toast}</div>}

              {/* Header Info */}
              <div className="flex flex-wrap justify-between gap-4 p-4 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
                <div>
                  <p className="text-xs text-[#707881] font-semibold uppercase">Mã đơn hàng</p>
                  <p className="font-bold text-[#0077b6] font-mono text-lg">#{order.code}</p>
                </div>
                <div>
                  <p className="text-xs text-[#707881] font-semibold uppercase">Ngày đặt</p>
                  <p className="font-semibold text-[#191c1d]">{order.date}</p>
                </div>
                <div>
                  <p className="text-xs text-[#707881] font-semibold uppercase">Tổng tiền</p>
                  <p className="font-bold text-[#191c1d] text-lg">{formatVND(order.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#707881] font-semibold uppercase mb-1">Trạng thái</p>
                  <StatusBadge color={STATUS_MAP[order.status]?.color || 'info'} label={STATUS_MAP[order.status]?.label || order.status} />
                </div>
              </div>

              {/* Customer */}
              <div className="p-4 border border-[#e1e3e4] rounded-xl">
                <h3 className="text-sm font-bold text-[#191c1d] mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#0077b6]" />Thông tin khách hàng</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-[#404850]">
                    <span className="font-semibold text-[#191c1d]">{order.name}</span>
                  </div>
                  {order.phone && <div className="flex items-center gap-2 text-[#404850]"><Phone className="w-4 h-4 text-[#707881]" />{order.phone}</div>}
                  {order.address && <div className="flex items-center gap-2 text-[#404850] col-span-2"><MapPin className="w-4 h-4 text-[#707881] shrink-0" />{order.address}</div>}
                  {order.note && <div className="col-span-2 text-[#707881] italic">Ghi chú: {order.note}</div>}
                </div>
              </div>

              {/* Items */}
              <div className="border border-[#e1e3e4] rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-[#f3f4f5] border-b border-[#e1e3e4]">
                  <h3 className="text-sm font-bold text-[#191c1d]">Sản phẩm ({order.items?.length || 0})</h3>
                </div>
                {(order.items || []).length === 0 ? (
                  <p className="p-4 text-sm text-[#707881] text-center">Không có chi tiết sản phẩm.</p>
                ) : (
                  <div className="divide-y divide-[#e7e8e9]">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 px-4 py-3">
                        <div className="w-12 h-12 bg-[#f3f4f5] rounded-lg flex items-center justify-center shrink-0">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : <Package className="w-5 h-5 text-[#bfc7d1]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#191c1d] truncate">{item.name}</p>
                          <p className="text-xs text-[#707881]">x{item.qty} × {formatVND(item.price)}</p>
                        </div>
                        <p className="text-sm font-bold text-[#191c1d]">{formatVND(item.qty * item.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Update Status */}
              {order.status !== 'da_huy' && (
                <div className="p-4 border border-[#cde5ff] bg-[#f0f8ff] rounded-xl">
                  <p className="text-xs font-bold text-[#0077b6] uppercase mb-3">Cập nhật trạng thái đơn hàng</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.filter(s => s.key !== 'all' && s.key !== order.status).map(s => (
                      <button
                        key={s.key}
                        onClick={() => handleStatusChange(s.key)}
                        disabled={updating}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all active:scale-95 disabled:opacity-50 ${
                          s.key === 'da_huy'
                            ? 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]'
                            : s.key === 'da_giao_hang'
                            ? 'border-[#2c694e] text-[#2c694e] hover:bg-[#aeeecb]/30'
                            : 'border-[#0077b6] text-[#0077b6] hover:bg-[#cde5ff]/30'
                        }`}
                      >
                        {updating ? '...' : `→ ${s.label}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, iconBg, iconColor, borderColor, label, value, badge, badgeColor }) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}><Icon className={`w-6 h-6 ${iconColor}`} /></div>
        {badge && <span className={`text-xs font-bold flex items-center gap-1 ${badgeColor}`}>{badge}</span>}
      </div>
      <p className="text-[11px] text-[#707881] uppercase font-bold tracking-wider">{label}</p>
      <h3 className="text-2xl font-semibold text-[#191c1d] mt-1">{value}</h3>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [orderStats, setOrderStats] = useState({ totalAll: 0, totalPending: 0, totalDelivering: 0, totalDone: 0 });
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const LIMIT = 10;

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT, status });
    authFetch(`${API_BASE}/admin/orders?${params}`)
      .then(r => r.json())
      .then(data => {
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setOrderStats(data.stats ?? {});
      })
      .catch(err => console.error('Lỗi đơn hàng:', err))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const SUMMARY_CARDS = [
    { icon: ClipboardList, iconBg: 'bg-sky-50',    iconColor: 'text-[#0077b6]', borderColor: 'border-[#0077b6]', label: 'Tất cả đơn',  value: orderStats.totalAll,       badge: <><TrendingUp className="w-3.5 h-3.5" /> Tổng cộng</>, badgeColor: 'text-[#2c694e]' },
    { icon: Clock,         iconBg: 'bg-orange-50', iconColor: 'text-[#904300]', borderColor: 'border-[#904300]', label: 'Chờ xử lý',   value: orderStats.totalPending,   badge: 'Cần xử lý', badgeColor: 'text-[#ba1a1a]' },
    { icon: Truck,         iconBg: 'bg-blue-50',   iconColor: 'text-[#005d90]', borderColor: 'border-[#005d90]', label: 'Đang giao',   value: orderStats.totalDelivering, badge: 'Hôm nay', badgeColor: 'text-[#404850]' },
    { icon: CheckCircle2,  iconBg: 'bg-green-50',  iconColor: 'text-[#2c694e]', borderColor: 'border-[#2c694e]', label: 'Hoàn thành',  value: orderStats.totalDone,       badge: '✓ Giao thành công', badgeColor: 'text-[#2c694e]' },
  ];

  return (
    <>
      {selectedId && (
        <OrderDetailModal
          orderId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChange={fetchOrders}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 mt-2 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Quản lý đơn hàng</h1>
          <p className="text-base text-[#404850]">Theo dõi và quản lý các giao dịch cung ứng thiết bị nuôi tôm.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button className="flex items-center gap-2 bg-white border border-[#bfc7d1] px-4 py-2 rounded-xl text-sm font-semibold text-[#404850] hover:bg-[#f3f4f5] transition-colors">
            <Download className="w-5 h-5" />Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {SUMMARY_CARDS.map(c => <SummaryCard key={c.label} {...c} />)}
      </div>

      <div className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden border border-[#e1e3e4]">
        <div className="p-5 border-b border-[#e1e3e4] flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707881] w-4 h-4" />
              <input className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#bfc7d1] focus:border-[#0077b6] focus:ring-1 focus:ring-[#0077b6]/30 outline-none text-sm" placeholder="Mã đơn, tên khách hàng..." />
            </div>
            <div className="relative sm:w-52">
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-full pl-4 pr-9 py-2.5 rounded-lg border border-[#bfc7d1] focus:border-[#0077b6] focus:ring-1 focus:ring-[#0077b6]/30 outline-none text-sm appearance-none bg-white">
                {STATUS_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707881] w-4 h-4 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg px-4 py-2.5 text-sm text-[#404850]">
              <Calendar className="w-4 h-4" /><span>Tháng này</span>
            </div>
            <button className="p-2.5 bg-white border border-[#bfc7d1] rounded-lg hover:bg-[#f3f4f5] transition-colors">
              <ListFilter className="w-5 h-5 text-[#707881]" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead className="bg-[#f3f4f5] border-b border-[#e1e3e4]">
              <tr>
                {['Mã đơn hàng', 'Khách hàng', 'Ngày đặt', 'Sản phẩm', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Hành động'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[12px] text-[#707881] uppercase tracking-wider font-bold${i === 4 ? ' text-right' : i === 7 ? ' text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e8e9]">
              {loading && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-[#707881]">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0077b6] border-t-transparent rounded-full animate-spin" />Đang tải...
                  </div>
                </td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto text-[#bfc7d1] mb-3" />
                  <p className="text-[#707881] text-sm font-medium">Không có đơn hàng nào.</p>
                </td></tr>
              )}
              {!loading && orders.map((o, i) => {
                const avatarCls = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const isCancelled = o.status === 'da_huy';
                return (
                  <tr key={o.id} className="hover:bg-[#f8f9fa]/60 transition-colors group">
                    <td className="px-6 py-5"><span className="font-bold text-[#0077b6] font-mono text-sm">#{o.code}</span></td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarCls}`}>{o.initials}</div>
                        <div>
                          <p className="text-sm font-semibold text-[#191c1d]">{o.name}</p>
                          <p className="text-xs text-[#707881]">{o.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-[#404850]">{o.date}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-[#f3f4f5] flex items-center justify-center"><Package className="w-4 h-4 text-[#707881]" /></div>
                        <span className="text-sm text-[#404850]">{o.totalItems > 0 ? `${o.totalItems} sản phẩm` : '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-right text-[#191c1d]">{formatVND(o.total)}</td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-bold ${o.paymentStatus === 'da_thanh_toan' ? 'text-[#2c694e]' : 'text-[#904300]'}`}>{o.payment}</span>
                      {o.paymentStatus === 'da_thanh_toan' && <span className="ml-1.5 text-[10px] bg-[#aeeecb] text-[#2c694e] px-1.5 py-0.5 rounded-full font-semibold">✓</span>}
                    </td>
                    <td className="px-6 py-5"><StatusBadge color={o.statusColor} label={o.statusLabel} /></td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedId(o.id)}
                          className="p-2 hover:bg-sky-50 text-[#0077b6] rounded-lg transition-colors"
                          title="Xem chi tiết & cập nhật"
                        >
                          <Eye className="w-[18px] h-[18px]" />
                        </button>
                        <button className={`p-2 rounded-lg transition-colors ${isCancelled ? 'opacity-30 cursor-not-allowed text-[#707881]' : 'hover:bg-[#f3f4f5] text-[#707881]'}`} title="In hóa đơn" disabled={isCancelled}>
                          <Printer className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-[#f3f4f5]/50 border-t border-[#e1e3e4] flex items-center justify-between">
          <p className="text-xs text-[#707881]">
            Hiển thị <span className="font-semibold text-[#191c1d]">{Math.min((page - 1) * LIMIT + 1, total || 1)}–{Math.min(page * LIMIT, total)}</span> trên tổng số <span className="font-semibold text-[#191c1d]">{total}</span> đơn hàng
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[#bfc7d1] bg-white text-[#707881] hover:bg-[#f3f4f5] disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${page === n ? 'bg-[#005d90] text-white' : 'bg-white border border-[#bfc7d1] text-[#404850] hover:bg-[#f3f4f5]'}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[#bfc7d1] bg-white text-[#707881] hover:bg-[#f3f4f5] disabled:opacity-30 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
