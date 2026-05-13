import { motion } from 'motion/react';
import { Phone, Lock, LogIn, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleAuthButton from '../components/GoogleAuthButton';


export default function LoginPage({ onGoogleLogin, onLogin }) {
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(formData.phone, formData.password);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
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
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Đăng nhập
          </h1>
          <p className="text-slate-500 text-[15px]">
            Chào mừng bạn trở lại! Vui lòng nhập thông tin đăng nhập.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-2.5 p-3.5 bg-danger-light border border-red-200 rounded-xl text-red-700 text-sm font-medium"
          >
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone */}
          <div>
            <label className="auth-label" htmlFor="login_phone">
              Số điện thoại
            </label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <Phone size={18} />
              </div>
              <input
                id="login_phone"
                type="tel"
                required
                placeholder="Nhập số điện thoại"
                className="auth-input"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700" htmlFor="login_password">
                Mật khẩu
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:text-primary-dark font-semibold hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <Lock size={18} />
              </div>
              <input
                id="login_password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Nhập mật khẩu"
                className="auth-input pr-11"
                value={formData.password}
                onChange={handleChange('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="auth-btn-primary mt-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-100 lg:bg-slate-100 text-slate-400 font-medium text-xs uppercase tracking-wider">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Google */}
        <GoogleAuthButton onClick={onGoogleLogin} label="Đăng nhập bằng Google" />

        {/* Link to Register */}
        <p className="text-center mt-8 text-sm text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">
            Đăng ký miễn phí
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
