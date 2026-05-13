import { motion } from 'motion/react';
import { KeyRound, Mail, ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Gọi API gửi mã khôi phục mật khẩu
    setTimeout(() => {
      setLoading(false);
      navigate('/otp');
    }, 800);
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
            Đừng lo, hãy nhập email hoặc số điện thoại đã đăng ký. 
            Chúng tôi sẽ gửi mã xác nhận để khôi phục mật khẩu.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="forgot_contact" className="auth-label">
              Email hoặc số điện thoại
            </label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <Mail size={18} />
              </div>
              <input
                id="forgot_contact"
                type="text"
                required
                placeholder="Nhập email hoặc số điện thoại..."
                className="auth-input"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
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
            {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
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
