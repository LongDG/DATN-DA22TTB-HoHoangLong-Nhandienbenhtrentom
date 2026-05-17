import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Clock, CheckCircle2, Star, TrendingUp,
  CheckCircle, Send, Paperclip, Image as ImageIcon, FileText,
  Video, Info, Lightbulb, User, MapPin, RefreshCw,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// Tự động gắn Bearer token từ localStorage
const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('token') || '';
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
};

const STATUS_CONFIG = {
  cho_phan_hoi: { label: 'Chờ phản hồi', cls: 'bg-[#ffdad6] text-[#ba1a1a]' },
  dang_tu_van:  { label: 'Đang tư vấn',  cls: 'bg-[#e7e8e9] text-[#404850]'  },
  da_dong:      { label: 'Đã đóng',      cls: 'bg-[#aeeecb] text-[#2c694e]'  },
};

const AVATAR_COLORS = [
  'bg-[#cde5ff] text-[#0077b6]',
  'bg-[#aeeecb] text-[#2c694e]',
  'bg-[#ffdbc8] text-[#904300]',
  'bg-[#e8d5ff] text-[#6b21a8]',
];

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Stats Cards ─────────────────────────────── */
function StatsRow({ stats }) {
  const cards = [
    { icon: MessageCircle, iconBg: 'bg-[#cde5ff]', iconColor: 'text-[#0077b6]', label: 'Tổng yêu cầu',        value: stats.total,       sub: <span className="flex items-center gap-1 text-[#2c694e] text-sm"><TrendingUp className="w-4 h-4" /> Tất cả</span> },
    { icon: Clock,         iconBg: 'bg-[#ffdad6]', iconColor: 'text-[#ba1a1a]', label: 'Đang chờ xử lý',      value: stats.pending,     sub: <span className="px-2 py-0.5 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full animate-pulse uppercase">Cần ưu tiên</span> },
    { icon: CheckCircle2,  iconBg: 'bg-[#aeeecb]', iconColor: 'text-[#2c694e]', label: 'Đã hoàn thành',       value: stats.done,        sub: <span className="flex items-center gap-1 text-[#2c694e] text-sm"><CheckCircle className="w-4 h-4" /> {stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0}% Tỷ lệ giải quyết</span> },
    { icon: Star,          iconBg: 'bg-[#ffdbc8]', iconColor: 'text-[#904300]', label: 'Đánh giá trung bình',  value: stats.avgRating !== '—' ? `${stats.avgRating}/5` : '—', sub: <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(parseFloat(stats.avgRating) || 0) ? 'fill-[#904300] text-[#904300]' : 'text-[#bfc7d1]'}`} />)}</div> },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map(c => (
        <div key={c.label} className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e1e3e4]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#707881] mb-1">{c.label}</p>
              <h3 className="text-2xl font-semibold text-[#191c1d]">{c.value ?? 0}</h3>
            </div>
            <span className={`p-2 rounded-lg ${c.iconBg}`}><c.icon className={`w-6 h-6 ${c.iconColor}`} /></span>
          </div>
          <div className="mt-2">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Consultation List Item ──────────────────── */
function ConsultationItem({ c, isActive, onClick, idx }) {
  const avt = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const sCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.cho_phan_hoi;
  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer transition-colors border-b border-[#e7e8e9]/60 ${isActive ? 'bg-sky-50 border-l-4 border-l-[#0077b6]' : 'hover:bg-[#f8f9fa] border-l-4 border-l-transparent'} ${c.status === 'da_dong' ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avt}`}>
          {c.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-semibold text-[#191c1d] truncate">{c.name}</h4>
            <span className="text-[10px] text-[#707881] shrink-0 ml-2">{c.time}</span>
          </div>
          <p className="text-xs text-[#2c694e] bg-[#aeeecb]/30 px-1.5 py-0.5 rounded w-fit my-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />{c.location}
          </p>
          <p className="text-xs text-[#404850] truncate">{c.lastMsg}</p>
          <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${sCfg.cls}`}>{sCfg.label}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Area ───────────────────────────────── */
function ChatArea({ consultation, onReply, onClose }) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consultation?.tin_nhan]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await onReply(consultation.id, input.trim());
    setInput('');
    setSending(false);
  };

  const handleClose = async () => {
    if (!window.confirm('Đóng tư vấn này?')) return;
    await onClose(consultation.id);
  };

  if (!consultation) {
    return (
      <div className="col-span-12 lg:col-span-8 flex items-center justify-center bg-white rounded-xl border border-[#bfc7d1] shadow-sm min-h-[500px]">
        <div className="text-center text-[#707881]">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chọn một cuộc tư vấn để bắt đầu</p>
        </div>
      </div>
    );
  }

  const isClosed = consultation.status === 'da_dong';

  return (
    <div className="col-span-12 lg:col-span-8 flex flex-col bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#bfc7d1] overflow-hidden">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-[#e1e3e4] flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${AVATAR_COLORS[0]}`}>
            {consultation.name?.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#191c1d]">{consultation.name}</h3>
            <p className="text-xs text-[#2c694e] font-medium">{consultation.location}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button className="p-2 text-[#707881] hover:bg-[#f3f4f5] rounded-full transition-colors"><Video className="w-5 h-5" /></button>
          <button className="p-2 text-[#707881] hover:bg-[#f3f4f5] rounded-full transition-colors"><Info className="w-5 h-5" /></button>
          {!isClosed && (
            <button onClick={handleClose} className="ml-2 px-4 py-2 bg-[#0077b6] text-white rounded-lg text-sm font-semibold hover:bg-[#005d90] transition-colors">
              Hoàn thành tư vấn
            </button>
          )}
          {isClosed && <span className="ml-2 px-3 py-1 bg-[#aeeecb] text-[#2c694e] rounded-lg text-xs font-bold">Đã đóng</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#f8f9fa] min-h-[380px] max-h-[420px]">
        <div className="flex justify-center">
          <span className="px-4 py-1 bg-[#e1e3e4]/60 rounded-full text-[10px] font-bold text-[#707881] uppercase tracking-wider">
            {new Date(consultation.tin_nhan?.[0]?.thoigian || Date.now()).toLocaleDateString('vi-VN')}
          </span>
        </div>

        {consultation.tin_nhan?.map((msg, i) => {
          const isAdmin = msg.vai_tro === 'chuyen_gia';
          return isAdmin ? (
            // Admin/chuyên gia — bên PHẢI (xanh)
            <div key={i} className="flex flex-col items-end ml-auto max-w-[80%]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold text-[#707881]">Chuyên gia</span>
                <div className="w-6 h-6 rounded-full bg-[#0077b6] flex items-center justify-center text-white text-[10px] font-bold">AA</div>
              </div>
              <div className="bg-[#0077b6] text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-md">
                <p className="text-sm leading-relaxed">{msg.noi_dung}</p>
                <span className="text-[10px] text-white/60 mt-1 block text-right">{formatTime(msg.thoigian)}</span>
              </div>
            </div>
          ) : (
            // User/nông dân — bên TRÁI (trắng)
            <div key={i} className="flex items-start gap-3 max-w-[80%]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${AVATAR_COLORS[0]}`}>
                {consultation.initials || <User className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[#707881] mb-1 block">{consultation.name || 'Người dùng'}</span>
                <div className="bg-white border border-[#e1e3e4] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-sm leading-relaxed text-[#191c1d]">{msg.noi_dung}</p>
                  <span className="text-[10px] text-[#707881] mt-1 block">{formatTime(msg.thoigian)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {consultation.tin_nhan?.length === 0 && (
          <p className="text-center text-sm text-[#707881]">Chưa có tin nhắn. Bắt đầu tư vấn ngay!</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed ? (
        <div className="p-4 bg-white border-t border-[#e1e3e4]">
          <div className="bg-[#f3f4f5] rounded-2xl border border-[#bfc7d1] p-2 focus-within:ring-2 focus-within:ring-[#0077b6]/30 focus-within:border-[#0077b6] transition-all">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              rows={2}
              className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none placeholder-[#707881] px-3 pt-2 outline-none"
              placeholder="Nhập phản hồi chuyên gia... (Enter để gửi)"
            />
            <div className="flex justify-between items-center px-2 pb-1">
              <div className="flex gap-1">
                {[Paperclip, ImageIcon, FileText].map((Icon, i) => (
                  <button key={i} className="p-2 text-[#707881] hover:bg-[#e7e8e9] rounded-lg transition-colors"><Icon className="w-4 h-4" /></button>
                ))}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="px-5 py-2 bg-[#005d90] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#004b74] transition-all disabled:opacity-40"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#f3f4f5] border-t border-[#e1e3e4] text-center">
          <div className="flex items-center justify-center gap-2 text-[#2c694e]">
            <Lightbulb className="w-4 h-4" />
            <p className="text-sm font-medium">Cuộc tư vấn này đã được đóng.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────── */
export default function ConsultationPage() {
  const [stats, setStats]           = useState({ total: 0, pending: 0, active: 0, done: 0, avgRating: '—' });
  const [list, setList]             = useState([]);
  const [activeId, setActiveId]     = useState(null);
  const [detail, setDetail]         = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch list + stats on mount
  const fetchList = useCallback(async () => {
    const [sRes, lRes] = await Promise.all([
      authFetch(`${API_BASE}/admin/consultations/stats`).then(r => r.json()),
      authFetch(`${API_BASE}/admin/consultations`).then(r => r.json()),
    ]);
    setStats(sRes);
    setList(Array.isArray(lRes) ? lRes : []);
    // Auto-select first
    if (!activeId && Array.isArray(lRes) && lRes.length > 0) {
      setActiveId(lRes[0].id);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Fetch detail when activeId changes
  useEffect(() => {
    if (!activeId) return;
    setLoadingDetail(true);
    authFetch(`${API_BASE}/admin/consultations/${activeId}`)
      .then(r => r.json())
      .then(data => {
        const listItem = list.find(l => l.id === activeId);
        setDetail({ ...data, initials: listItem?.initials });
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [activeId]);

  const handleReply = async (id, text) => {
    const res = await authFetch(`${API_BASE}/admin/consultations/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ noi_dung: text }),
    });
    const data = await res.json();
    if (data.ok) {
      setDetail(prev => ({
        ...prev,
        status: 'dang_tu_van',
        tin_nhan: [...(prev.tin_nhan || []), data.tin_nhan],
      }));
      setList(prev => prev.map(c => c.id === id ? { ...c, status: 'dang_tu_van', lastMsg: text } : c));
      setStats(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), active: prev.active + 1 }));
    }
  };

  const handleClose = async (id) => {
    await authFetch(`${API_BASE}/admin/consultations/${id}/close`, { method: 'PATCH' });
    setDetail(prev => ({ ...prev, status: 'da_dong' }));
    setList(prev => prev.map(c => c.id === id ? { ...c, status: 'da_dong' } : c));
    setStats(prev => ({ ...prev, active: Math.max(0, prev.active - 1), done: prev.done + 1 }));
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-2">
        <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Quản lý tư vấn</h1>
        <p className="text-base text-[#404850]">Theo dõi và phản hồi các yêu cầu tư vấn kỹ thuật từ người nuôi tôm.</p>
      </div>

      {/* Stats */}
      <StatsRow stats={stats} />

      {/* Main Split Layout */}
      <div className="grid grid-cols-12 gap-6" style={{ minHeight: '600px' }}>
        {/* Consultation List */}
        <div className="col-span-12 lg:col-span-4 flex flex-col bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#bfc7d1] overflow-hidden">
          <div className="p-4 border-b border-[#e1e3e4] bg-[#f3f4f5] flex justify-between items-center">
            <span className="text-sm font-semibold text-[#191c1d]">Danh sách hội thoại</span>
            <span className="bg-[#ba1a1a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {stats.pending} chờ
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#e7e8e9]/40">
            {list.length === 0 && (
              <div className="p-8 text-center text-[#707881] text-sm">Không có yêu cầu tư vấn nào.</div>
            )}
            {list.map((c, i) => (
              <ConsultationItem
                key={c.id} c={c} idx={i}
                isActive={c.id === activeId}
                onClick={() => setActiveId(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {loadingDetail ? (
          <div className="col-span-12 lg:col-span-8 flex items-center justify-center bg-white rounded-xl border border-[#bfc7d1]">
            <div className="w-8 h-8 border-3 border-[#0077b6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ChatArea consultation={detail} onReply={handleReply} onClose={handleClose} />
        )}
      </div>
    </>
  );
}
