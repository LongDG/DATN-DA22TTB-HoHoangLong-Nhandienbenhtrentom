import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Microscope, ShoppingBasket, User as UserIcon, Banknote,
  TrendingUp, Calendar, Download, MoreVertical,
  MapPin, Reply, AlertTriangle, ShoppingCart,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import { authFetch } from '../../utils/authFetch';

const API_BASE = 'http://localhost:5000/api';

/** Định dạng tiền tệ VND */
function formatCurrency(amount) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1) + 'M';
  if (amount >= 1_000)     return (amount / 1_000).toFixed(1) + 'K';
  return amount.toLocaleString('vi-VN');
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDiagnostics: 0,
    totalOrders: 0,
    newOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [recentLogs, setRecentLogs]       = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [lowStock, setLowStock] = useState({ items: [], outOfStock: 0, criticalCount: 0, lowCount: 0, threshold: 15, thresholdCritical: 5 });

  useEffect(() => {
    authFetch(`${API_BASE}/admin/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(err => console.error('Lỗi thống kê:', err));

    authFetch(`${API_BASE}/admin/diagnostics`)
      .then(r => r.json())
      .then(data => setRecentLogs((data.logs ?? data ?? []).slice(0, 3)))
      .catch(err => console.error('Lỗi nhật ký:', err));

    // Chỉ lấy tư vấn đang CHỜ PHẢN HỒI cho tổng quan
    authFetch(`${API_BASE}/admin/consultations?status=cho_phan_hoi`)
      .then(r => r.json())
      .then(setConsultations)
      .catch(err => console.error('Lỗi tư vấn:', err));

    authFetch(`${API_BASE}/admin/low-stock?limit=8`)
      .then(r => r.json())
      .then(setLowStock)
      .catch(err => console.error('Lỗi tồn kho:', err));
  }, []);

  const KPI_CARDS = [
    { icon: Microscope,    label: 'Tổng Chẩn Đoán AI',  value: stats.totalDiagnostics.toLocaleString('vi-VN'), badge: 'Mới cập nhật', iconBg: 'bg-[#f3f7ff]',      iconColor: 'text-[#005d90]' },
    { icon: ShoppingBasket,label: 'Số Lượng Đơn Hàng', value: stats.totalOrders || stats.newOrders,           badge: 'Mới nhất',    iconBg: 'bg-[#aeeecb]/30',   iconColor: 'text-[#2c694e]' },
    { icon: UserIcon,      label: 'Tổng Người Dùng',    value: stats.totalUsers.toLocaleString('vi-VN'),       badge: 'Tài khoản',   iconBg: 'bg-[#ffdbc8]/50',   iconColor: 'text-[#b65600]' },
    { icon: Banknote,      label: 'Doanh Thu (VND)',     value: formatCurrency(stats.totalRevenue),             badge: 'Lợi nhuận',   iconBg: 'bg-[#cde5ff]/50',   iconColor: 'text-[#005d90]' },
  ];

  const exportDashboardCSV = () => {
    const today = new Date().toLocaleDateString('vi-VN');
    const rows = [
      ['Chỉ số', 'Giá trị', 'Ngày xuất'],
      ['Tổng chẩn đoán AI', stats.totalDiagnostics, today],
      ['Số lượng đơn hàng', stats.totalOrders || stats.newOrders || 0, today],
      ['Tổng người dùng', stats.totalUsers, today],
      ['Doanh thu (VND)', stats.totalRevenue || 0, today],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `bao-cao-tong-quan-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8 mt-2">
        <div>
          <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-2">Tổng quan hệ thống</h1>
          <p className="text-base text-[#404850]">Theo dõi sức khỏe tôm và hoạt động kinh doanh thời gian thực.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-[#bfc7d1] hover:border-[#707881] rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-[#f3f4f5] text-[#191c1d] transition-colors">
            <Calendar className="w-4 h-4" />
            Hôm nay: {new Date().toLocaleDateString('vi-VN')}
          </button>
          <button onClick={exportDashboardCSV} className="px-4 py-2 bg-[#0077b6] text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPI_CARDS.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">

          {/* Recent Diagnostics Table */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e7e8e9] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e7e8e9] flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#191c1d]">Hoạt động chẩn đoán AI mới nhất</h3>
              <a href="/admin/diagnostics" className="text-[#0077b6] font-semibold text-sm hover:underline">Xem tất cả</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f3f4f5] border-b border-[#e7e8e9]">
                  <tr>
                    {['Thời gian', 'Mẫu vật', 'Bệnh lý', 'Độ tin cậy', 'Trạng thái', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-sm font-semibold text-[#404850]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e8e9]">
                  {recentLogs.map(log => {
                    const isHealthy = log.disease === 'Khỏe mạnh';
                    const isGanTuy = log.disease.toLowerCase().includes('gan') || log.disease.includes('AHPND');
                    const badgeClass = isHealthy ? 'text-[#2c694e]' : 'text-[#ba1a1a]';
                    const barClass  = isHealthy ? 'bg-[#2c694e]' : isGanTuy ? 'bg-[#904300]' : 'bg-[#ba1a1a]';
                    const statusClass = log.status === 'Đang chờ' ? 'bg-[#ffdbc8]/50 text-[#b65600]' : 'bg-[#aeeecb]/50 text-[#316e52]';
                    return (
                      <tr key={log.id} className="hover:bg-[#f8f9fa] transition-colors">
                        <td className="px-6 py-4 text-sm text-[#191c1d]">{log.time}<br /><span className="text-xs text-[#707881]">{log.date}</span></td>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden border border-[#e7e8e9]">
                            <img alt="Shrimp scan" className="w-full h-full object-cover" src={log.image} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${badgeClass}`}>{log.disease}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-1.5 bg-[#edeeef] rounded-full overflow-hidden">
                              <div className={`h-full ${barClass}`} style={{ width: `${log.confidence}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[#404850]">{log.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight whitespace-nowrap ${statusClass}`}>{log.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#707881] hover:text-[#0077b6] transition-colors"><MoreVertical className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {recentLogs.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-[#707881]">Chưa có dữ liệu chẩn đoán.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Consultations - Dữ liệu thật từ MongoDB */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e7e8e9]">
            <div className="px-6 py-4 border-b border-[#e7e8e9] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-[#191c1d]">Yêu cầu tư vấn chờ phản hồi</h3>
                <p className="text-xs text-[#707881] mt-0.5">Chỉ hiển thị phiếu chưa được trả lời</p>
              </div>
              {consultations.length > 0 && (
                <span className="px-2.5 py-1 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full">
                  {consultations.length} MỚI
                </span>
              )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultations.length === 0 && (
                <p className="col-span-2 text-center text-sm text-[#707881] py-6">Không có yêu cầu tư vấn chờ phản hồi.</p>
              )}
              {consultations.map((c, i) => {
                // Gán màu avatar xoay vòng từ bảng màu
                const AVATAR_PALETTES = [
                  { bg: 'bg-[#cde5ff]', color: 'text-[#0077b6]' },
                  { bg: 'bg-[#b1f0ce]', color: 'text-[#2c694e]' },
                  { bg: 'bg-[#ffdbc8]', color: 'text-[#b65600]' },
                  { bg: 'bg-[#e8d5ff]', color: 'text-[#6b21a8]' },
                ];
                const palette = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
                return (
                  <div key={c.id} className="p-5 bg-[#f8f9fa] rounded-xl border border-[#bfc7d1] hover:border-[#0077b6] transition-all cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${palette.bg} ${palette.color} flex items-center justify-center font-bold text-sm`}>
                          {c.initials}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#191c1d]">{c.name}</h4>
                          <p className="text-xs text-[#404850] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />{c.location}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[#707881] font-medium whitespace-nowrap ml-2">{c.time}</span>
                    </div>
                    <p className="text-sm text-[#404850] line-clamp-2 mb-5 italic">
                      "{c.message}"
                    </p>
                    <button
                      onClick={() => navigate('/admin/consult')}
                      className="w-full py-2 bg-[#0077b6] text-white rounded-lg text-sm font-semibold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Reply className="w-4 h-4" />Phản hồi ngay
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Widgets */}
        <div className="col-span-12 lg:col-span-4 space-y-8">

          {/* Low Stock Alerts — dữ liệu thật từ MongoDB */}
          <div className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e7e8e9] overflow-hidden">
            <div className="px-6 py-4 bg-[#ffdad6]/40 border-b border-[#ffdad6]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                <h3 className="text-sm font-semibold text-[#ba1a1a]">Cảnh báo tồn kho</h3>
                {lowStock.items.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full">
                    {lowStock.items.length}
                  </span>
                )}
              </div>
              {/* Badge tóm tắt */}
              <div className="flex gap-1.5">
                {lowStock.outOfStock > 0 && (
                  <span className="text-[10px] font-bold text-white bg-[#404850] px-2 py-0.5 rounded-full">
                    {lowStock.outOfStock} hết
                  </span>
                )}
                {lowStock.criticalCount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-[#ba1a1a] px-2 py-0.5 rounded-full">
                    {lowStock.criticalCount} nguy cấp
                  </span>
                )}
                {lowStock.lowCount > 0 && (
                  <span className="text-[10px] font-bold text-[#743500] bg-[#ffdbc8] px-2 py-0.5 rounded-full">
                    {lowStock.lowCount} sắp hết
                  </span>
                )}
              </div>
            </div>

              {lowStock.items.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-[#aeeecb]/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6 text-[#2c694e]" />
                  </div>
                  <p className="text-sm font-semibold text-[#2c694e]">Tồn kho ổn định</p>
                  <p className="text-xs text-[#707881] mt-1">Tất cả sản phẩm đều > {lowStock.threshold} đơn vị</p>
                </div>
              ) : (
                lowStock.items.map(item => {
                  const isOut      = item.level === 'out';
                  const isCritical = item.level === 'critical';
                  const levelCfg = isOut
                    ? { bg: 'bg-[#f3f4f5]',   text: 'text-[#404850]', label: 'Hết hàng' }
                    : isCritical
                    ? { bg: 'bg-[#ffdad6]',   text: 'text-[#ba1a1a]', label: `Còn ${item.qty} ${item.unit}` }
                    : { bg: 'bg-[#ffdbc8]',   text: 'text-[#743500]', label: `Còn ${item.qty} ${item.unit}` };
                  return (
                    <div key={item.id} className="p-4 border-b border-[#e7e8e9] flex items-center gap-3 hover:bg-[#f8f9fa] transition-colors">
                      {/* Hình ảnh */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#edeeef] flex items-center justify-center shrink-0">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          : <ShoppingCart className="w-5 h-5 text-[#bfc7d1]" />
                        }
                      </div>
                      {/* Thông tin */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#191c1d] truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.brand    && <span className="text-[10px] text-[#707881]">{item.brand}</span>}
                          {item.category && <span className="text-[10px] text-[#707881]">• {item.category}</span>}
                        </div>
                      </div>
                      {/* Badge mức cảnh báo */}
                      <div className="shrink-0 text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${levelCfg.bg} ${levelCfg.text}`}>
                          {levelCfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
          </div>


        </div>
      </div>
    </>
  );
}
