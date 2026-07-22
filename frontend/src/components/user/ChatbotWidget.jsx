import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  AlertTriangle, CheckCircle, ChevronRight, ShoppingCart,
  HeadphonesIcon, RefreshCw, Stethoscope,
} from 'lucide-react';

const API = 'http://localhost:5000/api/chatbot';

const WELCOME_MSG = {
  role: 'model',
  type: 'welcome',
  content: 'Xin chào! Tôi là trợ lý AI của AquaVet 🦐\n\nBạn đang quan sát dấu hiệu bất thường gì trên tôm hoặc ao nuôi? Hãy mô tả để tôi giúp chẩn đoán.',
};

const SEVERITY_COLOR = {
  'Rất nghiêm trọng': { bg: 'bg-red-50',    border: 'border-red-200',  badge: 'bg-red-100 text-red-700',    icon: '🔴' },
  'Nghiêm trọng':     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: '🟠' },
  'Trung bình':       { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
};

function formatPrice(p) {
  return p?.toLocaleString('vi-VN') + 'đ';
}

/* ── Bubble chẩn đoán ── */
function DiagnosisBubble({ data, onBuyClick, onTransferClick }) {
  const sev  = SEVERITY_COLOR[data.benh?.mucdo] || SEVERITY_COLOR['Trung bình'];
  const icon = sev.icon;

  return (
    <div className={`rounded-2xl border p-4 ${sev.bg} ${sev.border} space-y-3`}>
      {/* Tên bệnh */}
      <div className="flex items-start gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-bold text-slate-800 text-sm">{data.benh?.tenbenh}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.badge}`}>
              {data.benh?.mucdo}
            </span>
            <span className="text-xs text-slate-500">Độ tin cậy: {data.benh?.do_tin_cay}%</span>
          </div>
        </div>
      </div>

      {/* Triệu chứng khớp */}
      {data.benh?.trieuchung_khop?.length > 0 && (
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-xs font-semibold text-slate-600 mb-1.5">✅ Triệu chứng phù hợp:</p>
          <ul className="space-y-0.5">
            {data.benh.trieuchung_khop.map((t, i) => (
              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">•</span>{t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Điều trị */}
      <div className="bg-white/70 rounded-xl p-3">
        <p className="text-xs font-semibold text-slate-700 mb-1">💊 Hướng điều trị:</p>
        <p className="text-xs text-slate-600 leading-relaxed">{data.benh?.dieu_tri}</p>
      </div>

      {/* Thuốc gợi ý */}
      {data.thuoc_goiy?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">🛒 Thuốc gợi ý:</p>
          <div className="space-y-2">
            {data.thuoc_goiy.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{t.tensanpham}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.cong_dung_chinh}</p>
                  <p className="text-xs font-semibold text-blue-700 mt-1">{formatPrice(t.gia)}</p>
                </div>
                <button
                  onClick={() => onBuyClick(t)}
                  className="shrink-0 flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Mua
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lời khuyên */}
      {data.loi_khuyen && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs text-blue-800 leading-relaxed">💡 {data.loi_khuyen}</p>
        </div>
      )}

      {/* Nút chuyển admin */}
      <button
        onClick={onTransferClick}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-xl py-2.5 hover:bg-slate-50 transition-colors"
      >
        <HeadphonesIcon className="w-3.5 h-3.5" />
        Vẫn cần tư vấn thêm từ chuyên gia
      </button>
    </div>
  );
}

/* ── Bubble hỏi thêm ── */
function AskMoreBubble({ data, onChoiceClick }) {
  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">🤔</span>
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1">{data.phan_tich_so_bo}</p>
          <p className="text-sm font-medium text-slate-800">{data.cau_hoi}</p>
        </div>
      </div>
      {data.lua_chon?.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5">
          {data.lua_chon.map((c, i) => (
            <button
              key={i}
              onClick={() => onChoiceClick(c)}
              className="text-left text-xs font-medium text-blue-700 bg-white border border-blue-100 rounded-xl px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Bubble chuyển admin ── */
function TransferBubble({ data, onConfirm }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">👨‍⚕️</span>
        <div>
          <p className="text-sm font-semibold text-slate-800">Cần chuyên gia hỗ trợ</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{data.ly_do}</p>
        </div>
      </div>
      <button
        onClick={() => onConfirm(data.tom_tat)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white text-sm font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
      >
        <HeadphonesIcon className="w-4 h-4" />
        Gửi cho chuyên gia tư vấn
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function ChatbotWidget({ user }) {
  const navigate = useNavigate();
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lịch sử chat gửi cho Gemini (chỉ gồm user + model text)
  const buildHistory = () => {
    return messages
      .filter(m => m.role === 'user' || (m.role === 'model' && m.content))
      .map(m => ({ role: m.role, content: m.content }));
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: userText }] }),
      });
      const data = await res.json();

      // Nếu backend trả lỗi nhưng có result (ví dụ: quota hết → transfer_admin)
      const result = data.result || {
        type: 'transfer_admin',
        ly_do: data.message || 'Hệ thống AI tạm thời không khả dụng.',
        tom_tat: userText,
      };

      const botMsg = {
        role: 'model',
        type: result.type,
        // greeting: dùng text bubble thay vì card đặc biệt
        content: result.type === 'greeting' ? result.message : '',
        data: result,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'model',
        type: 'error',
        content: 'Xin lỗi, có lỗi kết nối. Vui lòng thử lại.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAdmin = async (tomTat) => {
    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content || JSON.stringify(m.data || ''),
      }));

      await fetch(`${API}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nguoidung_id: user?.id || user?._id || null,
          hoten: user?.hoten || user?.ten || 'Người dùng chatbot',
          sodienthoai: user?.sodienthoai || '',
          tom_tat: tomTat,
          lich_su_chat: chatHistory,
        }),
      });

      setMessages(prev => [...prev, {
        role: 'model',
        type: 'transferred',
        content: '✅ Đã gửi yêu cầu tư vấn thành công!\nChuyên gia sẽ liên hệ với bạn sớm. Bạn có thể xem trạng thái tại trang Tư vấn trực tuyến.',
      }]);

      setTimeout(() => {
        setOpen(false);
        navigate('/consult-user');
      }, 2500);
    } catch {
      setMessages(prev => [...prev, {
        role: 'model', type: 'error',
        content: 'Gửi yêu cầu thất bại, vui lòng thử lại.',
      }]);
    }
  };

  const handleBuyClick = (thuoc) => {
    setOpen(false);
    // Ưu tiên dùng id thuốc → trang chi tiết, fallback search nếu không có id
    if (thuoc.id) {
      navigate(`/product/${thuoc.id}`);
    } else {
      navigate(`/store?search=${encodeURIComponent(thuoc.tensanpham)}`);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME_MSG]);
    setInput('');
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #005d90, #0077b6)' }}
        title="Trợ lý AI chẩn đoán bệnh tôm"
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <Stethoscope className="w-6 h-6 text-white" />
        }
        {/* Pulse dot */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
          style={{ width: 360, height: 460, background: '#fff' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ background: 'linear-gradient(135deg, #003f5e, #0077b6)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Trợ lý AI AquaVet</p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                  Powered by Gemini AI
                </p>
              </div>
            </div>
            <button
              onClick={resetChat}
              className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              title="Cuộc hội thoại mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[90%] ${msg.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                  {/* User bubble */}
                  {msg.role === 'user' && (
                    <div className="bg-blue-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 leading-relaxed">
                      {msg.content}
                    </div>
                  )}

                  {/* Bot: welcome / text / greeting / error / transferred */}
                  {msg.role === 'model' && (msg.type === 'welcome' || msg.type === 'greeting' || msg.type === 'error' || msg.type === 'transferred' || msg.content) && (
                    <div className={`text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 leading-relaxed whitespace-pre-line ${
                      msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100'
                      : msg.type === 'transferred' ? 'bg-green-50 text-green-800 border border-green-100'
                      : 'bg-white text-slate-700 border border-slate-100 shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  )}

                  {/* Bot: diagnosis */}
                  {msg.role === 'model' && msg.type === 'diagnosis' && msg.data && (
                    <DiagnosisBubble
                      data={msg.data}
                      onBuyClick={handleBuyClick}
                      onTransferClick={() => handleTransferAdmin(
                        `Bệnh nghi ngờ: ${msg.data.benh?.tenbenh}. Người dùng muốn tư vấn thêm.`
                      )}
                    />
                  )}

                  {/* Bot: ask_more */}
                  {msg.role === 'model' && msg.type === 'ask_more' && msg.data && (
                    <AskMoreBubble
                      data={msg.data}
                      onChoiceClick={(choice) => sendMessage(choice)}
                    />
                  )}

                  {/* Bot: transfer_admin */}
                  {msg.role === 'model' && msg.type === 'transfer_admin' && msg.data && (
                    <TransferBubble
                      data={msg.data}
                      onConfirm={handleTransferAdmin}
                    />
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-end gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-3 py-2 focus-within:border-blue-400 transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Mô tả triệu chứng tôm của bạn..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none resize-none leading-relaxed"
                style={{ maxHeight: 100 }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-1.5">
              AI có thể sai. Hãy tham khảo chuyên gia khi cần.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
