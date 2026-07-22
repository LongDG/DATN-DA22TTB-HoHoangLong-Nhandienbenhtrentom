import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShieldCheck, Send, MapPin, Plus, Clock,
  CheckCircle2, X, AlertCircle, RefreshCw, MessageCircle, Loader2, AlertTriangle,
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const GEO = 'https://provinces.open-api.vn/api/v2';
import { authFetch } from '../../utils/authFetch';

const STATUS_CFG = {
  cho_phan_hoi: { label: 'Chờ phản hồi', cls: 'bg-[#ffdad6] text-[#ba1a1a]' },
  dang_tu_van:  { label: 'Đang tư vấn',  cls: 'bg-[#cde5ff] text-[#0077b6]' },
  da_dong:      { label: 'Đã đóng',      cls: 'bg-[#aeeecb] text-[#2c694e]' },
};

const fmtTime = iso => iso ? new Date(iso).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '';
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('vi-VN') : '';

function NewModal({ onClose, onDone, user }) {
  const [form, setForm] = useState({ noidung:'', vitri_tinh:'', vitri_ao:'' });
  const [err, setErr] = useState(''); const [saving, setSaving] = useState(false);

  // Tải danh sách tỉnh/thành từ API (giống trang thanh toán)
  const [provinces, setProvinces] = useState([]);
  const [loadingProv, setLoadingProv] = useState(true);
  const [provError, setProvError] = useState(false);

  useEffect(() => {
    setLoadingProv(true);
    setProvError(false);
    fetch(`${GEO}/`)
      .then(r => r.json())
      .then(d => setProvinces(Array.isArray(d) ? d : []))
      .catch(() => setProvError(true))
      .finally(() => setLoadingProv(false));
  }, []);

  const IC = 'w-full px-4 py-3 border border-[#dde1e7] rounded-xl text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none bg-white';
  const submit = async () => {
    if (!form.noidung.trim()) return setErr('Vui lòng mô tả vấn đề');
    if (!form.vitri_tinh)     return setErr('Vui lòng chọn tỉnh/thành');
    setSaving(true); setErr('');
    try {
      const res = await authFetch(`${API}/consultations`, {
        method:'POST',
        body: JSON.stringify({
          ten_nguoidung: user?.ten || 'Người dùng',
          nguoidung_id:  user?.id || user?._id || null,
          noidung:       form.noidung.trim(),
          vitri_tinh:    form.vitri_tinh,
          vitri_ao:      form.vitri_ao.trim() || 'Chưa xác định',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onDone(data._id || data.id);
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e7edf3]">
          <h3 className="text-lg font-bold text-[#191c1d]">Yêu cầu tư vấn mới</h3>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full"><X className="w-5 h-5 text-[#707881]"/></button>
        </div>
        <div className="p-6 space-y-4">
          {err && <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-sm text-[#ba1a1a] font-semibold"><AlertCircle className="w-4 h-4 shrink-0"/>{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#707881] mb-1.5 uppercase">Tỉnh / Thành *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881] z-10 pointer-events-none"/>
                {loadingProv ? (
                  <div className={IC + ' pl-10 flex items-center gap-2 text-[#707881]'}>
                    <Loader2 className="w-4 h-4 animate-spin"/>
                    <span className="text-xs">Đang tải...</span>
                  </div>
                ) : provError ? (
                  <div className={IC + ' pl-10 text-red-500 text-xs flex items-center gap-2'}>
                    <AlertTriangle className="w-4 h-4"/>
                    <button className="underline" onClick={() => { setProvError(false); setLoadingProv(true); fetch(`${GEO}/`).then(r=>r.json()).then(d=>setProvinces(Array.isArray(d)?d:[])).catch(()=>setProvError(true)).finally(()=>setLoadingProv(false)); }}>Thử lại</button>
                  </div>
                ) : (
                  <select
                    className={IC + ' pl-10 appearance-none'}
                    value={provinces.find(p => p.name === form.vitri_tinh)?.code || ''}
                    onChange={e => {
                      const prov = provinces.find(p => p.code === Number(e.target.value));
                      setForm(f => ({ ...f, vitri_tinh: prov?.name || '' }));
                    }}
                  >
                    <option value="">-- Chọn tỉnh/thành --</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#707881] mb-1.5 uppercase">Vị trí ao</label>
              <input className={IC} placeholder="Ao số 3, Khu B..." value={form.vitri_ao} onChange={e=>setForm(p=>({...p,vitri_ao:e.target.value}))}/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#707881] mb-1.5 uppercase">Mô tả vấn đề *</label>
            <textarea rows={4} className={IC+' resize-none'} placeholder="Mô tả triệu chứng, màu nước ao, hành vi tôm..." value={form.noidung} onChange={e=>setForm(p=>({...p,noidung:e.target.value}))}/>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e7edf3]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#404850] border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5] transition-colors">Hủy</button>
          <button onClick={submit} disabled={saving} className="px-6 py-2 text-sm font-bold bg-[#0077b6] text-white rounded-xl hover:bg-[#005d90] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send className="w-4 h-4"/>}
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConsultUserPage() {
  const ctx = useOutletContext?.() ?? {};
  const user = ctx.user ?? null;

  const [tickets, setTickets]   = useState([]);
  const [active, setActive]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const chatRef = useRef(null);

  // Chỉ lấy phiếu của chính user này
  const fetchTickets = async (autoSelectId) => {
    setLoading(true);
    try {
      const uid = user?.id || user?._id;
      const url = uid
        ? `${API}/consultations?user_id=${uid}`
        : `${API}/consultations`;
      const res = await authFetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTickets(list);
      // Auto-select phiếu vừa tạo nếu có
      if (autoSelectId) {
        const found = list.find(t => t._id === autoSelectId || t.id === autoSelectId);
        if (found) { setActive(found); fetchDetail(found._id); }
      }
    } catch {}
    finally { setLoading(false); }
  };

  const fetchDetail = async (id) => {
    try {
      const res = await authFetch(`${API}/consultations/${id}`);
      const data = await res.json();
      setMessages(data.tin_nhan || []);
      // Cập nhật status trong ticket list
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: data.status || data.trang_thai } : t));
      setActive(prev => prev?._id === id ? { ...prev, status: data.status || data.trang_thai } : prev);
    } catch {}
  };

  // Chỉ fetch khi đã có user (tránh load nhầm phiếu của người khác)
  useEffect(() => {
    if (user !== null) fetchTickets();
  }, [user?.id]);


  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Polling 5s khi có phiếu đang chọn — dừng tự động khi tab ẩn
  useEffect(() => {
    if (!active) return;

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) return; // tránh tạo nhiều interval
      intervalId = setInterval(() => {
        if (!document.hidden) fetchDetail(active._id);
      }, 5000);
    };

    const stopPolling = () => {
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Tab active trở lại → fetch ngay lập tức rồi mới bắt đầu lại interval
        fetchDetail(active._id);
        startPolling();
      }
    };

    // Khởi chạy ngay nếu tab đang hiển thị
    if (!document.hidden) startPolling();

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [active?._id]);

  const selectTicket = (t) => { setActive(t); fetchDetail(t._id); };

  const handleSend = async () => {
    if (!input.trim() || !active) return;
    const wasClosed = active.status === 'da_dong';
    const text = input.trim(); setInput(''); setSending(true);
    setMessages(prev => [...prev, { vai_tro:'nguoidung', noi_dung:text, thoigian:new Date().toISOString() }]);
    try {
      const res = await authFetch(`${API}/consultations/${active._id}/reply-user`, {
        method:'POST',
        body: JSON.stringify({ noi_dung: text }),
      });
      const data = await res.json();
      // Nếu tư vấn đã được mở lại, cập nhật trạng thái local
      if (wasClosed && data.reopened) {
        setActive(prev => ({ ...prev, status: 'cho_phan_hoi' }));
        setTickets(prev => prev.map(t => t._id === active._id ? { ...t, status: 'cho_phan_hoi' } : t));
      }
      await fetchDetail(active._id);
    } catch {}
    finally { setSending(false); }
  };

  const userInitial = (user?.ten || 'U').charAt(0).toUpperCase();

  return (
    <div className="bg-[#f0f7ff] min-h-screen">
      {showNew && <NewModal onClose={()=>setShowNew(false)} onDone={(newId)=>{ setShowNew(false); fetchTickets(newId); }} user={user}/>}


      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-[#191c1d]">Tư vấn trực tuyến</h1>
            <p className="text-sm text-[#707881] mt-0.5">Chat trực tiếp với chuyên gia AquaHealth</p>
          </div>
          <button onClick={()=>setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0077b6] text-white font-bold rounded-xl hover:bg-[#005d90] transition-all active:scale-95 shadow-lg shadow-[#0077b6]/25 text-sm">
            <Plus className="w-4 h-4"/>Yêu cầu mới
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-5 h-[calc(100vh-220px)] min-h-[550px]">

          {/* Sidebar */}
          <aside className="w-full md:w-80 bg-white rounded-2xl shadow-sm border border-[#e7edf3] flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-[#e7edf3] flex items-center justify-between">
              <h2 className="text-base font-bold text-[#191c1d]">Yêu cầu của tôi</h2>
              <button onClick={fetchTickets} className="p-1.5 text-[#707881] hover:bg-[#f3f4f5] rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4"/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32 text-[#707881] text-sm">
                  <div className="w-4 h-4 border-2 border-[#0077b6] border-t-transparent rounded-full animate-spin mr-2"/>Đang tải...
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                  <MessageCircle className="w-10 h-10 text-[#bfc7d1] mb-2"/>
                  <p className="text-sm font-semibold text-[#707881]">Chưa có yêu cầu nào</p>
                  <button onClick={()=>setShowNew(true)} className="mt-3 text-xs text-[#0077b6] font-bold hover:underline">+ Tạo yêu cầu đầu tiên</button>
                </div>
              ) : tickets.map(t => {
                const s = STATUS_CFG[t.status] || STATUS_CFG.cho_phan_hoi;
                const isAct = active?._id === t._id;
                return (
                  <div key={t._id} onClick={()=>selectTicket(t)}
                    className={`p-4 cursor-pointer border-b border-[#e7edf3] border-l-4 transition-all ${isAct ? 'bg-[#e8f4fd] border-l-[#0077b6]' : 'hover:bg-[#f8fafc] border-l-transparent'} ${t.status==='da_dong'?'opacity-60':''}`}>
                    <div className="flex items-start gap-3">
                      {/* Icon trạng thái thay vì avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.status==='da_dong'?'bg-[#aeeecb]/40':'bg-[#0077b6]/10'}`}>
                        {t.status === 'da_dong' ? <CheckCircle2 className="w-5 h-5 text-[#2c694e]"/> : <Clock className="w-5 h-5 text-[#0077b6]"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-[#404850] flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0"/>{t.vitri_tinh || t.location}
                          </p>
                          <span className="text-[10px] text-[#707881] shrink-0 ml-1">{t.time}</span>
                        </div>
                        <p className="text-xs text-[#191c1d] font-semibold mt-0.5 truncate">{t.noidung || t.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${s.cls}`}>{s.label}</span>
                          {t.msgCount > 0 && <span className="text-[10px] text-[#707881]">{t.msgCount} tin nhắn</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Chat panel */}
          {!active ? (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#e7edf3] flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-[#0077b6]/10 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-[#0077b6]"/>
              </div>
              <p className="text-lg font-bold text-[#404850]">Chọn yêu cầu để xem hội thoại</p>
              <p className="text-sm text-[#707881] mt-1">Hoặc tạo yêu cầu tư vấn mới</p>
              <button onClick={()=>setShowNew(true)}
                className="mt-5 px-6 py-2.5 bg-[#0077b6] text-white font-bold rounded-xl hover:bg-[#005d90] transition-all text-sm">
                + Yêu cầu mới
              </button>
            </div>
          ) : (
            <section className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-[#e7edf3] overflow-hidden">
              {/* Chat header */}
              <header className="px-5 py-4 border-b border-[#e7edf3] flex justify-between items-center shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  {/* Admin/chuyên gia avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#0077b6] flex items-center justify-center text-white shrink-0">
                    <ShieldCheck className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#191c1d]">Chuyên gia AquaHealth</p>
                    <p className="text-xs flex items-center gap-1.5">
                      {active.status === 'dang_tu_van'
                        ? <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/><span className="text-[#2c694e] font-semibold">Đang tư vấn</span></>
                        : active.status === 'cho_phan_hoi'
                        ? <><span className="w-2 h-2 bg-yellow-400 rounded-full"/><span className="text-[#707881]">Chờ phản hồi</span></>
                        : <><span className="w-2 h-2 bg-[#2c694e] rounded-full"/><span className="text-[#2c694e]">Đã đóng</span></>
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_CFG[active.status]?.cls}`}>
                    {STATUS_CFG[active.status]?.label}
                  </span>
                  <button onClick={()=>fetchDetail(active._id)} className="p-2 hover:bg-[#f3f4f5] rounded-full text-[#707881]">
                    <RefreshCw className="w-4 h-4"/>
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8fafc]">
                {/* Ngày */}
                <div className="flex justify-center">
                  <span className="bg-[#e7e8e9] px-3 py-1 rounded-full text-[11px] font-bold text-[#707881]">
                    {fmtDate(active.ngaytao)}
                  </span>
                </div>

                {/* Tin nhắn (bao gồm cả tin đầu tiên là noidung) */}
                {messages.map((msg, i) => {
                  const isUser = msg.vai_tro === 'nguoidung';
                  return isUser ? (
                    <div key={i} className="flex flex-col items-end ml-auto max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#707881]">Bạn</span>
                        <div className="w-6 h-6 rounded-full bg-[#0077b6]/20 flex items-center justify-center text-[#0077b6] font-bold text-xs">{userInitial}</div>
                      </div>
                      <div className="bg-[#0077b6] text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-md">
                        <p className="text-sm leading-relaxed">{msg.noi_dung}</p>
                        <span className="text-[10px] text-white/60 mt-1 block text-right">{fmtTime(msg.thoigian)}</span>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-start gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-[#0077b6] flex items-center justify-center text-white shrink-0">
                        <ShieldCheck className="w-4 h-4"/>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#707881] mb-1 block">Chuyên gia AquaHealth</span>
                        <div className="bg-white border border-[#e7edf3] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                          <p className="text-sm leading-relaxed text-[#191c1d]">{msg.noi_dung}</p>
                          <span className="text-[10px] text-[#707881] mt-1 block">{fmtTime(msg.thoigian)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Chờ phản hồi */}
                {active.status === 'cho_phan_hoi' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0077b6] flex items-center justify-center text-white shrink-0">
                      <ShieldCheck className="w-4 h-4"/>
                    </div>
                    <div className="bg-white border border-[#e7edf3] px-4 py-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,150,300].map(d=><span key={d} className="w-2 h-2 bg-[#0077b6]/40 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                      </div>
                      <span className="text-xs text-[#707881]">Chuyên gia sẽ phản hồi sớm...</span>
                    </div>
                  </div>
                )}

                {active.status === 'da_dong' && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 bg-[#aeeecb]/40 border border-[#aeeecb] px-4 py-2 rounded-full text-xs font-bold text-[#2c694e]">
                      <CheckCircle2 className="w-4 h-4"/>Phiên tư vấn đã kết thúc
                    </div>
                  </div>
                )}
              </div>

              {/* Input — luôn hiển thị kể cả da_dong để user có thể nhắn lại */}
              <footer className="p-4 bg-white border-t border-[#e7edf3] shrink-0">
                {active.status === 'da_dong' && (
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#2c694e] bg-[#f0fdf4] border border-[#aeeecb] rounded-xl px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0"/>
                    Tư vấn đã đóng. Nhắn tin dưới đây để mở lại cuộc hội thoại.
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <div className="flex-1 bg-[#f3f4f5] rounded-2xl px-4 py-3 flex items-center border border-transparent focus-within:border-[#0077b6] focus-within:bg-white transition-all">
                    <textarea rows={1} value={input} onChange={e=>setInput(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} }}
                      placeholder={active.status === 'da_dong' ? 'Nhắn để mở lại cuộc tư vấn...' : 'Nhập tin nhắn... (Enter để gửi)'}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none max-h-28 outline-none"/>
                  </div>
                  <button onClick={handleSend} disabled={sending||!input.trim()}
                    className="h-12 w-12 shrink-0 flex items-center justify-center bg-[#ff8c00] text-white rounded-full shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-40">
                    {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send className="w-5 h-5 ml-0.5"/>}
                  </button>
                </div>
              </footer>
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
