import { motion } from 'motion/react';
import { LockKeyhole, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const API = 'http://localhost:5000/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const phone = sessionStorage.getItem('otp_phone') || '';

  const [form, setForm] = useState({ matkhau: '', xacnhan: '' });
  const [show, setShow] = useState({ matkhau: false, xacnhan: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Guard: không có phone → về forgot-password
  useEffect(() => {
    if (!phone) navigate('/forgot-password', { replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.matkhau.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    if (form.matkhau !== form.xacnhan) return setError('Mật khẩu xác nhận không khớp');

    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sodienthoai: phone, matkhau_moi: form.matkhau }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Lỗi đặt lại mật khẩu');

      // Thành công
      sessionStorage.removeItem('otp_phone');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[420px] text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Đặt lại thành công!</h2>
          <p className="text-slate-500 text-[15px]">
            Mật khẩu của bạn đã được cập nhật.<br />Đang chuyển về trang đăng nhập...
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

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
          to="/otp"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary mb-8 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </Link>

        {/* Icon + Heading */}
        <div className="mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
            <LockKeyhole className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Đặt mật khẩu mới
          </h1>
          <p className="text-slate-500 text-[15px]">
            Tạo mật khẩu mạnh gồm ít nhất 6 ký tự.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Mật khẩu mới */}
          <div>
            <label htmlFor="new_pw" className="auth-label">Mật khẩu mới</label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <LockKeyhole size={18} />
              </div>
              <input
                id="new_pw"
                type={show.matkhau ? 'text' : 'password'}
                required
                placeholder="Tối thiểu 6 ký tự"
                className="auth-input pr-11"
                value={form.matkhau}
                onChange={(e) => setForm(p => ({ ...p, matkhau: e.target.value }))}
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShow(s => ({ ...s, matkhau: !s.matkhau }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show.matkhau ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label htmlFor="confirm_pw" className="auth-label">Xác nhận mật khẩu</label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <LockKeyhole size={18} />
              </div>
              <input
                id="confirm_pw"
                type={show.xacnhan ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu"
                className="auth-input pr-11"
                value={form.xacnhan}
                onChange={(e) => setForm(p => ({ ...p, xacnhan: e.target.value }))}
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShow(s => ({ ...s, xacnhan: !s.xacnhan }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show.xacnhan ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.xacnhan && form.matkhau !== form.xacnhan && (
              <p className="text-xs text-red-500 mt-1 ml-1">Mật khẩu không khớp</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <LockKeyhole size={18} />
            }
            {loading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
          </motion.button>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
