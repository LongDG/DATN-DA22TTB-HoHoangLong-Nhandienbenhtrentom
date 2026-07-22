import { useState, useEffect } from 'react';
import {
  Download, Calendar, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Edit2, Lightbulb,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
import { authFetch } from '../../utils/authFetch';

/** Trả về class Tailwind badge dựa trên tên bệnh */
function getDiseaseBadge(disease) {
  if (disease === 'Khỏe mạnh') return 'bg-[#aeeecb] text-[#316e52]';
  if (disease.toLowerCase().includes('gan') || disease.includes('AHPND') || disease.includes('EMS'))
    return 'bg-[#ffdbc8] text-[#743500]';
  return 'bg-[#ffdad6] text-[#93000a]';
}

function getConfidenceColor(disease) {
  if (disease === 'Khỏe mạnh') return { bar: 'bg-[#2c694e]', text: 'text-[#2c694e]' };
  if (disease.toLowerCase().includes('gan') || disease.includes('AHPND') || disease.includes('EMS'))
    return { bar: 'bg-[#904300]', text: 'text-[#904300]' };
  return { bar: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]' };
}

function StatusCell({ status }) {
  const map = {
    'Đang chờ':   { icon: <Clock size={16} />,       cls: 'text-[#904300]' },
    'Đã xác minh':{ icon: <CheckCircle size={16} />, cls: 'text-[#2c694e]' },
    'Sai lệch':   { icon: <XCircle size={16} />,     cls: 'text-[#ba1a1a]' },
  };
  const s = map[status] || map['Đang chờ'];
  return (
    <div className={`flex items-center gap-1.5 whitespace-nowrap ${s.cls}`}>
      {s.icon}
      <span className="text-xs font-semibold">{status}</span>
    </div>
  );
}

function DetailPanel({ log, onVerified }) {
  const [saving, setSaving]         = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [correctedDisease, setCorrectedDisease] = useState('');
  const [note, setNote]             = useState('');
  const [toast, setToast]           = useState(null); // { type: 'success'|'error', msg }

  // Reset khi chọn log khác
  useEffect(() => {
    setShowUpdateForm(false);
    setCorrectedDisease('');
    setNote('');
    setToast(null);
  }, [log?.id]);

  if (!log) return (
    <div className="bg-white rounded-xl border border-[#bfc7d1]/30 p-10 text-center text-[#707881]">
      <Lightbulb className="w-10 h-10 mx-auto mb-3 text-[#bfc7d1]" />
      <p className="text-sm font-semibold">Chọn một bản ghi để xem chi tiết</p>
    </div>
  );

  const isHealthy  = log.disease === 'Khỏe mạnh';
  const isVerified = log.status === 'Đã xác minh';
  const isWrong    = log.status === 'Sai lệch';
  const isDone     = isVerified || isWrong;

  const callVerify = async (action) => {
    setSaving(true); setToast(null);
    try {
      const body = { action, note };
      if (action === 'update') {
        if (!correctedDisease.trim()) { setToast({ type: 'error', msg: 'Vui lòng nhập tên bệnh đúng' }); setSaving(false); return; }
        body.corrected_disease = correctedDisease.trim();
      }
      const res = await authFetch(`${API_BASE}/admin/diagnostics/${log.id}/verify`, {
        method: 'PUT', body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToast({ type: 'success', msg: data.message });
      setShowUpdateForm(false);
      // Thông báo parent cập nhật status trong bảng
      onVerified?.(log.id, data.new_status, action === 'update' ? correctedDisease : log.disease);
    } catch (e) {
      setToast({ type: 'error', msg: e.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#bfc7d1]/30 overflow-hidden sticky top-24">
      <div className="p-4 border-b border-[#bfc7d1]/30 bg-[#f3f4f5]/50 flex justify-between items-center">
        <h3 className="font-bold text-[#191c1d] text-base">Chi tiết Chẩn đoán</h3>
        <span className="text-xs font-semibold text-[#005d90] bg-[#cde5ff] px-2 py-0.5 rounded">ID: #{log.id}</span>
      </div>

      <div className="relative aspect-video bg-black overflow-hidden">
        <img src={log.heatmap} alt="Heatmap" className="w-full h-full object-cover opacity-80" />
        {!isHealthy && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-2 border-[#005d90]/50 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-16 h-16 border border-[#005d90]/30 rounded-full" />
              </div>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ba1a1a] rounded-full animate-pulse" />
              Phát hiện bệnh — AI tin cậy: {log.confidence}%
            </div>
          </>
        )}
        {/* Badge trạng thái xác minh */}
        {isDone && (
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md ${isVerified ? 'bg-[#aeeecb] text-[#2c694e]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
            {isVerified ? <><CheckCircle size={13} />Đã xác minh</> : <><XCircle size={13} />Sai lệch — đã sửa</>}
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Thông tin cơ bản */}
        <div className="space-y-3 mb-5">
          {[
            { label: 'Thời gian quét',    value: `${log.time} — ${log.date}` },
            { label: 'Thiết bị',          value: log.device },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center pb-3 border-b border-[#bfc7d1]/20">
              <span className="text-sm text-[#404850]">{row.label}</span>
              <span className="text-sm font-semibold text-[#191c1d]">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pb-3 border-b border-[#bfc7d1]/20">
            <span className="text-sm text-[#404850]">Kết quả AI</span>
            <span className={`text-sm font-bold ${isHealthy ? 'text-[#2c694e]' : 'text-[#ba1a1a]'}`}>
              {isHealthy ? 'Âm tính: Khỏe mạnh' : `Dương tính: ${log.disease}`}
            </span>
          </div>
          {/* Hiển thị bệnh đã sửa nếu có */}
          {isWrong && log.correctedDisease && (
            <div className="flex justify-between items-center pb-3 border-b border-[#bfc7d1]/20">
              <span className="text-sm text-[#404850]">Chẩn đoán đã sửa</span>
              <span className="text-sm font-bold text-[#0077b6]">{log.correctedDisease}</span>
            </div>
          )}
        </div>

        {/* Toast thông báo */}
        {toast && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold ${toast.type === 'success' ? 'bg-[#aeeecb]/50 text-[#2c694e] border border-[#aeeecb]' : 'bg-[#ffdad6]/50 text-[#ba1a1a] border border-[#ffdad6]'}`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Khu vực xác minh */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-[#707881] uppercase tracking-wider">Xác minh thủ công (Admin)</p>

          {isDone ? (
            /* Đã xác minh rồi — chỉ hiện trạng thái */
            <div className={`p-4 rounded-xl border text-center ${isVerified ? 'bg-[#aeeecb]/20 border-[#aeeecb]' : 'bg-[#ffdad6]/20 border-[#ffdad6]'}`}>
              <div className={`flex items-center justify-center gap-2 font-bold text-sm mb-1 ${isVerified ? 'text-[#2c694e]' : 'text-[#ba1a1a]'}`}>
                {isVerified ? <><CheckCircle size={18} />Kết quả đã được xác nhận chính xác</> : <><XCircle size={18} />Đã ghi nhận sai lệch</>}
              </div>
              {log.note && <p className="text-xs text-[#707881] mt-1">Ghi chú: {log.note}</p>}
            </div>
          ) : showUpdateForm ? (
            /* Form cập nhật chẩn đoán mới */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#404850] mb-1">Chẩn đoán đúng là</label>
                <input
                  className="w-full px-3 py-2 border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none"
                  placeholder="VD: Đốm trắng (WSSV), Gan tụy..."
                  value={correctedDisease}
                  onChange={e => setCorrectedDisease(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#404850] mb-1">Ghi chú (tuỳ chọn)</label>
                <textarea
                  className="w-full px-3 py-2 border border-[#bfc7d1] rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none"
                  rows={2} placeholder="Mô tả lý do sai lệch..."
                  value={note} onChange={e => setNote(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => callVerify('update')}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#ba1a1a] text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Edit2 size={14} />}
                  Xác nhận sửa
                </button>
                <button
                  onClick={() => { setShowUpdateForm(false); setNote(''); }}
                  className="py-2 rounded-lg border border-[#707881] text-[#404850] font-semibold text-xs hover:bg-[#f3f4f5] transition-all"
                >
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            /* Chưa xác minh — hiện 2 nút */
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-[#404850] mb-1">Ghi chú (tuỳ chọn)</label>
                <input
                  className="w-full px-3 py-2 border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none"
                  placeholder="Ghi chú của admin..."
                  value={note} onChange={e => setNote(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => callVerify('correct')}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#2c694e] text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={14} />}
                  Chính xác
                </button>
                <button
                  onClick={() => setShowUpdateForm(true)}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#707881] text-[#404850] font-semibold text-xs hover:bg-[#f3f4f5] transition-all active:scale-95 disabled:opacity-50"
                >
                  <Edit2 size={14} />Cập nhật lại
                </button>
              </div>
            </div>
          )}
        </div>

        {log.recommendation && (
          <div className="mt-5 p-4 bg-[#fff5f2] rounded-lg border border-[#ffdbc8]">
            <div className="flex gap-3">
              <Lightbulb size={20} className="text-[#b65600] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#743500]">Phân tích chi tiết từ AI</p>
                <p className="text-xs text-[#743500] mt-1.5 leading-relaxed">{log.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiagnosticLog() {
  const [logs, setLogs]               = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [totalCount, setTotalCount]   = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);

  // ── Filter states ──
  const [filterDateRange,  setFilterDateRange]  = useState('all');
  const [filterDisease,    setFilterDisease]    = useState('');
  const [filterConfidence, setFilterConfidence] = useState(0);
  const [filterStatus,     setFilterStatus]     = useState('');
  // Applied (chỉ apply khi bấm nút)
  const [applied, setApplied] = useState({
    date_range: 'all', disease: '', min_confidence: 0, status: '',
  });

  // Khi admin xác minh → cập nhật status trong bảng ngay lập tức
  const handleVerified = (logId, newStatus, correctedDisease) => {
    setLogs(prev => prev.map(l =>
      l.id === logId
        ? { ...l, status: newStatus, correctedDisease: correctedDisease || l.disease }
        : l
    ));
    setSelectedLog(prev =>
      prev?.id === logId
        ? { ...prev, status: newStatus, correctedDisease: correctedDisease || prev.disease }
        : prev
    );
  };

  const fetchLogs = (params, pg = 1) => {
    setLoading(true);
    const q = new URLSearchParams({
      date_range:     params.date_range     || 'all',
      disease:        params.disease        || '',
      min_confidence: params.min_confidence || 0,
      status:         params.status         || '',
      page:           pg,
      limit:          10,
    });
    authFetch(`${API_BASE}/admin/diagnostics?${q}`)
      .then(r => r.json())
      .then(data => {
        // API mới trả { logs, total, totalPages }
        const list = data.logs ?? (Array.isArray(data) ? data : []);
        const tot  = data.total ?? list.length;
        setLogs(list);
        setTotalCount(tot);
        setTotalPages(data.totalPages ?? 1);
        if (list.length > 0 && pg === 1) setSelectedLog(list[0]);
      })
      .catch(err => console.error('Lỗi:', err))
      .finally(() => setLoading(false));
  };

  // Load ban đầu
  useEffect(() => { fetchLogs(applied, 1); }, []);

  const handleFilter = () => {
    const params = {
      date_range:     filterDateRange,
      disease:        filterDisease,
      min_confidence: filterConfidence,
      status:         filterStatus,
    };
    setApplied(params);
    setPage(1);
    fetchLogs(params, 1);
  };

  const handleReset = () => {
    setFilterDateRange('all');
    setFilterDisease('');
    setFilterConfidence(0);
    setFilterStatus('');
    const params = { date_range: 'all', disease: '', min_confidence: 0, status: '' };
    setApplied(params);
    setPage(1);
    fetchLogs(params, 1);
  };

  const handlePageChange = (pg) => {
    setPage(pg);
    fetchLogs(applied, pg);
  };

  // CSV Export
  const exportCSV = () => {
    if (!logs.length) return;
    const headers = ['ID','Người dùng','Ngày chẩn đoán','Bệnh phát hiện','Độ tin cậy (%)','Trạng thái xác minh'];
    const rows = logs.map(l => [
      l.id, l.user, l.date, l.disease,
      Math.round((l.confidence || 0) * 100),
      l.status || '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `nhat-ky-chan-doan-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Kiểm tra có filter đang active không
  const hasFilter = applied.date_range !== 'all' || applied.disease !== ''
    || applied.min_confidence > 0 || applied.status !== '';

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-4 mt-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#191c1d] leading-tight">
            Nhật ký chẩn đoán AI
          </h1>
          <p className="text-[#404850] text-base mt-1">
            Tổng cộng <span className="font-bold text-[#005d90]">{totalCount.toLocaleString('vi-VN')}</span> lượt chẩn đoán.
            {hasFilter && <span className="ml-2 px-2 py-0.5 bg-[#cde5ff] text-[#005d90] text-xs font-bold rounded-full">Đang lọc</span>}
          </p>
        </div>
        <button onClick={exportCSV}
          className="bg-[#005d90] hover:bg-[#0077b6] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm shadow-md active:scale-95 disabled:opacity-40"
          disabled={!logs.length}>
          <Download size={18} />Xuất dữ liệu CSV
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#bfc7d1]/30 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Thời gian */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Khoảng thời gian</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" />
              <select
                value={filterDateRange}
                onChange={e => setFilterDateRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1]/50 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:border-[#005d90] appearance-none"
              >
                <option value="all">Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
              </select>
            </div>
          </div>

          {/* Bệnh lý */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Bệnh lý</label>
            <select
              value={filterDisease}
              onChange={e => setFilterDisease(e.target.value)}
              className="w-full px-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1]/50 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:border-[#005d90] appearance-none"
            >
              <option value="">Tất cả</option>
              <option value="dom_trang">Đốm trắng (WSSV)</option>
              <option value="gan_tuy">Gan tụy (AHPND)</option>
              <option value="khoe_manh">Khỏe mạnh</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1]/50 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:border-[#005d90] appearance-none"
            >
              <option value="">Tất cả</option>
              <option value="Đang chờ">Đang chờ</option>
              <option value="Đã xác minh">Đã xác minh</option>
              <option value="Sai lệch">Sai lệch</option>
            </select>
          </div>

          {/* Độ tin cậy slider */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">
              Độ tin cậy &gt; <span className="text-[#005d90] font-black">{filterConfidence}%</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#707881]">0</span>
              <input
                type="range" min="0" max="99" step="5"
                value={filterConfidence}
                onChange={e => setFilterConfidence(parseInt(e.target.value))}
                className="flex-1 h-2 bg-[#cde5ff] rounded-lg appearance-none cursor-pointer accent-[#005d90]"
              />
              <span className="text-xs text-[#707881]">99</span>
            </div>
          </div>

          {/* Nút lọc + reset */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleFilter}
              className="h-[38px] px-5 bg-[#005d90] hover:bg-[#0077b6] text-white rounded-lg font-semibold text-sm transition-colors shadow-sm active:scale-95"
            >
              Lọc dữ liệu
            </button>
            {hasFilter && (
              <button
                onClick={handleReset}
                className="h-[38px] px-4 bg-[#e1e3e4] hover:bg-[#d9dadb] text-[#404850] rounded-lg font-semibold text-sm transition-colors border border-[#bfc7d1]/50"
              >
                Xoá lọc
              </button>
            )}
          </div>
        </div>

        {/* Active filter badges */}
        {hasFilter && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#e7e8e9]">
            <span className="text-xs text-[#707881] font-semibold">Đang lọc:</span>
            {applied.date_range !== 'all' && (
              <span className="px-2.5 py-0.5 bg-[#cde5ff] text-[#005d90] text-xs font-bold rounded-full">
                {applied.date_range === 'today' ? 'Hôm nay' : applied.date_range === '7days' ? '7 ngày' : '30 ngày'}
              </span>
            )}
            {applied.disease && (
              <span className="px-2.5 py-0.5 bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold rounded-full">
                {applied.disease === 'dom_trang' ? 'Đốm trắng' : applied.disease === 'gan_tuy' ? 'Gan tụy' : 'Khỏe mạnh'}
              </span>
            )}
            {applied.min_confidence > 0 && (
              <span className="px-2.5 py-0.5 bg-[#aeeecb] text-[#2c694e] text-xs font-bold rounded-full">
                Tin cậy &gt; {applied.min_confidence}%
              </span>
            )}
            {applied.status && (
              <span className="px-2.5 py-0.5 bg-[#ffdbc8] text-[#904300] text-xs font-bold rounded-full">{applied.status}</span>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Table */}
        <div className="md:col-span-8 bg-white rounded-xl shadow-sm border border-[#bfc7d1]/30 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="h-40 flex items-center justify-center text-[#707881]">Đang tải dữ liệu...</div>
            ) : logs.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-[#707881]">Chưa có dữ liệu chẩn đoán nào.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#f3f4f5]/80 border-b border-[#bfc7d1]/30">
                  <tr>
                    {['ID', 'Ảnh Ao', 'Thời gian', 'Kết Quả Bệnh', 'Tỷ lệ chính xác', 'Trạng thái'].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-semibold text-[#707881] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bfc7d1]/20">
                  {logs.map(log => {
                    const isSelected = selectedLog?.id === log.id;
                    const { bar, text } = getConfidenceColor(log.disease);
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`transition-colors cursor-pointer ${isSelected ? 'bg-sky-50/50' : 'hover:bg-[#f3f4f5]/50'}`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-[#191c1d]">#{log.id}</td>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg bg-[#edeeef] overflow-hidden border border-[#bfc7d1]/30">
                            <img src={log.image} alt="Sample" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#404850] whitespace-nowrap">{log.time} — {log.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getDiseaseBadge(log.disease)}`}>{log.disease}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-[#e7e8e9] rounded-full h-1.5 max-w-[80px]">
                            <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${log.confidence}%` }} />
                          </div>
                          <div className={`text-[11px] font-bold mt-1 ${text}`}>{log.confidence}%</div>
                        </td>
                        <td className="px-6 py-4"><StatusCell status={log.status} /></td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 bg-[#f3f4f5]/50 border-t border-[#bfc7d1]/30 flex justify-between items-center">
            <span className="text-xs text-[#707881]">
              Trang {page}/{totalPages} — {logs.length} / {totalCount} bản ghi
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc7d1]/50 text-[#707881] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = totalPages <= 5 ? i + 1
                  : page <= 3 ? i + 1
                  : page >= totalPages - 2 ? totalPages - 4 + i
                  : page - 2 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => handlePageChange(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                      pg === page
                        ? 'bg-[#005d90] text-white font-bold'
                        : 'border border-[#bfc7d1]/50 text-[#707881] bg-white hover:bg-[#f3f4f5]'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc7d1]/50 text-[#707881] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="md:col-span-4">
          <DetailPanel log={selectedLog} onVerified={handleVerified} />
        </div>
      </div>
    </>
  );
}
