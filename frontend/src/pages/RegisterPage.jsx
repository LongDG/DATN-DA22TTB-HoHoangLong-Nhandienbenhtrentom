import { motion } from 'motion/react';
import { User, Phone, Lock, RefreshCcw, LogIn, AlertCircle, Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function RegisterPage({ onGoogleLogin, onRegister }) {
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        ten: formData.fullname,
        sodienthoai: formData.phone,
        email: formData.email,
        matkhau: formData.password,
      });
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
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
        <div className="mb-7">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Tạo tài khoản
          </h1>
          <p className="text-slate-500 text-[15px]">
            Đăng ký miễn phí để bắt đầu bảo vệ ao tôm của bạn
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="auth-label" htmlFor="reg_fullname">
              Họ và tên <span className="text-danger">*</span>
            </label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <User size={18} />
              </div>
              <input
                id="reg_fullname"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                className="auth-input"
                value={formData.fullname}
                onChange={handleChange('fullname')}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="auth-label" htmlFor="reg_phone">
              Số điện thoại <span className="text-danger">*</span>
            </label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <Phone size={18} />
              </div>
              <input
                id="reg_phone"
                type="tel"
                required
                placeholder="0901 234 567"
                className="auth-input"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="auth-label" htmlFor="reg_email">
              Email <span className="text-slate-400 font-normal text-xs">(không bắt buộc)</span>
            </label>
            <div className="relative group">
              <div className="auth-icon auth-icon-focus">
                <Mail size={18} />
              </div>
              <input
                id="reg_email"
                type="email"
                placeholder="email@example.com"
                className="auth-input"
                value={formData.email}
                onChange={handleChange('email')}
              />
            </div>
          </div>

          {/* Password row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="auth-label" htmlFor="reg_password">
                Mật khẩu <span className="text-danger">*</span>
              </label>
              <div className="relative group">
                <div className="auth-icon auth-icon-focus">
                  <Lock size={18} />
                </div>
                <input
                  id="reg_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  className="auth-input pr-10"
                  value={formData.password}
                  onChange={handleChange('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="auth-label" htmlFor="reg_confirm_password">
                Xác nhận <span className="text-danger">*</span>
              </label>
              <div className="relative group">
                <div className="auth-icon auth-icon-focus">
                  <RefreshCcw size={18} />
                </div>
                <input
                  id="reg_confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu"
                  className="auth-input pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-100 text-slate-400 font-medium text-xs uppercase tracking-wider">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Google */}
        <GoogleAuthButton onClick={onGoogleLogin} label="Đăng ký bằng Google" />

        {/* Link to Login */}
        <p className="text-center mt-8 text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập ngay
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
