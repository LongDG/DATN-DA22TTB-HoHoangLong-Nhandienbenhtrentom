import { useState } from 'react';
import { Phone, X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

/**
 * Modal hiện ra sau khi đăng nhập Google lần đầu
 * Yêu cầu user nhập số điện thoại để lưu vào tài khoản
 *
 * Props:
 *  - onSuccess(user, token): callback khi lưu SĐT thành công
 *  - onSkip(): callback khi user bấm bỏ qua
 */
export default function PhoneSetupModal({ onSuccess, onSkip }) {
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const clean = phone.replace(/\s/g, '');
    if (!clean) return setError('Vui lòng nhập số điện thoại');
    if (!/^0[0-9]{9}$/.test(clean)) return setError('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/update-phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sodienthoai: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Lưu token mới (chứa SĐT đã cập nhật)
      localStorage.setItem('token', data.token);

      setSuccess(true);
      setTimeout(() => onSuccess(data.user, data.token), 1200);
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật, thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden
                      animate-[fadeSlideUp_0.3s_ease-out]">

        {/* Top gradient bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#0077b6] via-[#00b4d8] to-[#0077b6]" />

        {/* Nút bỏ qua */}
        <button
          onClick={onSkip}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#9aa5b4]
                     hover:bg-[#f0f4f8] hover:text-[#404850] transition-all"
          title="Bỏ qua, thêm sau">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Icon + Tiêu đề */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0077b6] to-[#00b4d8]
                            flex items-center justify-center shadow-lg shadow-[#0077b6]/30 mb-4">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-[#191c1d] text-center">
              Thêm số điện thoại
            </h2>
            <p className="text-sm text-[#707881] text-center mt-1.5 leading-relaxed">
              Tài khoản Google của bạn chưa có số điện thoại.
              <br />
              Thêm ngay để nhận thông báo đơn hàng và hỗ trợ tốt hơn.
            </p>
          </div>

          {/* Trạng thái thành công */}
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-[#e6f4ea] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#2e7d32]" />
              </div>
              <p className="text-[#2e7d32] font-bold text-base">Cập nhật thành công!</p>
              <p className="text-xs text-[#707881]">Đang chuyển hướng...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Input SĐT */}
              <div>
                <label className="block text-xs font-semibold text-[#707881] mb-2 uppercase tracking-wide">
                  Số điện thoại
                </label>
                <div className="relative">
                  {/* Country prefix */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5
                                  text-sm font-semibold text-[#404850] border-r border-[#dde1e7] pr-2.5">
                    🇻🇳 +84
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setError('');
                      // Chỉ cho nhập số và khoảng trắng
                      setPhone(e.target.value.replace(/[^0-9\s]/g, ''));
                    }}
                    maxLength={12}
                    placeholder="0901 234 567"
                    className="w-full pl-20 pr-4 py-3.5 bg-[#f8fafc] border border-[#dde1e7] rounded-xl
                               text-sm font-medium text-[#191c1d] placeholder-[#bfc7d1]
                               focus:ring-2 focus:ring-[#0077b6]/25 focus:border-[#0077b6]
                               outline-none transition-all"
                    autoFocus
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[#ba1a1a] font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <p className="text-xs text-[#9aa5b4] leading-relaxed">
                📱 Số điện thoại dùng để nhận SMS thông báo đơn hàng và hỗ trợ tư vấn.
                Chúng tôi cam kết không chia sẻ thông tin của bạn.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onSkip}
                  className="flex-1 py-3 rounded-xl border border-[#dde1e7] text-[#707881]
                             font-semibold text-sm hover:bg-[#f8fafc] transition-all">
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 flex-[2] py-3 rounded-xl
                             bg-gradient-to-r from-[#0077b6] to-[#005d90]
                             text-white font-bold text-sm
                             hover:opacity-90 active:scale-95 transition-all
                             shadow-md shadow-[#0077b6]/30
                             flex items-center justify-center gap-2
                             disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</>
                    : <><CheckCircle2 className="w-4 h-4" />Lưu số điện thoại</>
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
