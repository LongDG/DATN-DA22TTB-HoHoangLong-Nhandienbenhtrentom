import { motion } from 'motion/react';
import { KeyRound, Phone, ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const API = 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) return setError('Vui lòng nhập số điện thoại');

    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sodienthoai: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Lỗi gửi OTP');

      // Lưu SĐT để các trang sau dùng
      sessionStorage.setItem('otp_phone', phone.trim());
      navigate('/otp');
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary mb-8 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại đăng nhập
        </Link>

        {/* Icon + Heading */}
        <div className="mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Quên mật khẩu?
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            Nhập số điện thoại đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 số qua SMS để xác nhận.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="forgot_phone" className="auth-label">
              Số điện thoại
            </label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <Phone size={18} />
              </div>
              <input
                id="forgot_phone"
                type="tel"
                required
                placeholder="VD: 0383277120"
                className="auth-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {loading ? 'Đang gửi OTP...' : 'Gửi mã OTP'}
          </motion.button>
        </form>

        {/* Help text */}
        <p className="text-center mt-8 text-sm text-slate-500">
          Nhớ lại mật khẩu?{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập ngay
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
