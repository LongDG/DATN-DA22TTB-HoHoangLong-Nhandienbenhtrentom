import { useState, useEffect } from 'react';
import {
  Download, Calendar, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Edit2, Lightbulb,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

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

function DetailPanel({ log, onClose }) {
  if (!log) return null;
  const isHealthy = log.disease === 'Khỏe mạnh';
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
      </div>

      <div className="p-5">
        <div className="space-y-3.5 mb-6">
          {[
            { label: 'Thời gian quét',   value: `${log.time} — ${log.date}` },
            { label: 'Thiết bị ghi nhận', value: log.device },
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
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-bold text-[#707881] uppercase tracking-wider">Xác minh thủ công (Admin)</p>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#2c694e] text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all">
              <CheckCircle size={16} />Chính xác
            </button>
            <button className="flex items-center justify-center gap-2 py-2 rounded-lg border border-[#707881] text-[#404850] font-semibold text-xs hover:bg-[#f3f4f5] transition-all active:scale-95">
              <Edit2 size={16} />Cập nhật lại
            </button>
          </div>
        </div>

        {log.recommendation && (
          <div className="mt-6 p-4 bg-[#fff5f2] rounded-lg border border-[#ffdbc8]">
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
  const [logs, setLogs]             = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/admin/stats`).then(r => r.json()),
      fetch(`${API_BASE}/admin/diagnostics`).then(r => r.json()),
    ])
      .then(([stats, data]) => {
        setTotalCount(stats.totalDiagnostics ?? data.length);
        setLogs(data);
        if (data.length > 0) setSelectedLog(data[0]);
      })
      .catch(err => console.error('Lỗi:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-4 mt-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#191c1d] leading-tight">
            Nhật ký chẩn đoán AI
            <span className="text-lg font-semibold text-[#707881] ml-3">({totalCount})</span>
          </h1>
          <p className="text-[#404850] text-base mt-1">
            Tổng cộng <span className="font-bold text-[#005d90]">{totalCount.toLocaleString('vi-VN')}</span> lượt chẩn đoán.
          </p>
        </div>
        <button className="bg-[#005d90] hover:bg-[#0077b6] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-semibold text-sm shadow-md active:scale-95">
          <Download size={18} />Xuất dữ liệu CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-[#bfc7d1]/30 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Khoảng thời gian</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" />
            <select className="w-full pl-10 pr-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1]/50 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:border-[#005d90] appearance-none">
              <option>Hôm nay</option>
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Tùy chỉnh...</option>
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Bệnh lý</label>
          <select className="w-full px-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1]/50 rounded-lg text-sm text-[#191c1d] focus:outline-none focus:border-[#005d90] appearance-none">
            <option value="">Tất cả</option>
            <option>Đốm trắng (WSSV)</option>
            <option>Gan tụy (AHPND)</option>
            <option>Khỏe mạnh</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Độ tin cậy (&gt; %)</label>
          <input type="range" min="0" max="100" defaultValue="70"
            className="w-full h-2 bg-[#cde5ff] rounded-lg appearance-none cursor-pointer accent-[#005d90]" />
        </div>
        <button className="h-[38px] px-6 bg-[#e1e3e4] hover:bg-[#d9dadb] text-[#404850] rounded-lg font-semibold text-sm transition-colors border border-[#bfc7d1]/50">
          Lọc dữ liệu
        </button>
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
                    {['ID', 'Ảnh Ao', 'Thời gian', 'Kết Quả Bệnh', 'Tỷ lệ chính xác', 'Trạng thái', 'Hành động'].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-[#707881] uppercase tracking-wider${i === 6 ? ' text-right' : ''}`}>{h}</th>
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
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#005d90] hover:underline font-semibold text-xs whitespace-nowrap">Xem chi tiết</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 bg-[#f3f4f5]/50 border-t border-[#bfc7d1]/30 flex justify-between items-center">
            <span className="text-xs text-[#707881]">Hiển thị {logs.length} trong {totalCount} bản ghi</span>
            <div className="flex gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc7d1]/50 text-[#707881] hover:bg-white transition-colors"><ChevronLeft size={16} /></button>
              <button className="w-8 h-8 flex items-center justify-center rounded bg-[#005d90] text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc7d1]/50 text-[#707881] bg-white hover:bg-[#f3f4f5] text-xs font-medium">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc7d1]/50 text-[#707881] bg-white hover:bg-[#f3f4f5] text-xs font-medium">3</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-[#bfc7d1]/50 text-[#707881] hover:bg-white transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="md:col-span-4">
          <DetailPanel log={selectedLog} />
        </div>
      </div>
    </>
  );
}
