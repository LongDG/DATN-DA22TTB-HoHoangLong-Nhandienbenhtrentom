import { motion, AnimatePresence } from 'motion/react';
import {
  User, Phone, Lock, RefreshCcw, LogIn, AlertCircle,
  Loader2, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import GoogleAuthButton from '../components/GoogleAuthButton';

const API = 'http://localhost:5000/api';

export default function RegisterPage({ onGoogleLogin, onRegister }) {
  // ── Bước 1: Thông tin đăng ký ──
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

  // ── Bước 2: Nhập OTP ──
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(59);
  const [otpLoading, setOtpLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step !== 2) return;
    if (timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timeLeft, step]);

  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Bước 1: Gửi OTP ──
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
      const res = await fetch(`${API}/auth/register/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ten: formData.fullname,
          sodienthoai: formData.phone,
          email: formData.email,
          matkhau: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Chuyển sang bước 2
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(59);
      setStep(2);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 2: Xử lý nhập OTP ──
  const handleOtpChange = (index, value) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      pasted.split('').forEach((ch, i) => { newOtp[i] = ch; });
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  // ── Gửi lại OTP ──
  const handleResend = async () => {
    if (timeLeft > 0) return;
    setError('');
    try {
      const res = await fetch(`${API}/auth/register/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ten: formData.fullname,
          sodienthoai: formData.phone,
          email: formData.email,
          matkhau: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(59);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Lỗi gửi lại OTP. Thử lại sau.');
    }
  };

  // ── Bước 2: Xác nhận OTP → tạo tài khoản ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setOtpLoading(true);
    try {
      await onRegister({
        sodienthoai: formData.phone,
        otp: otp.join(''),
      });
    } catch (err) {
      setError(err.message || 'Mã OTP không đúng');
    } finally {
      setOtpLoading(false);
    }
  };

  const isOtpComplete = otp.every((d) => d !== '');
  const maskedPhone = formData.phone
    ? formData.phone.slice(0, 3) + '****' + formData.phone.slice(-3)
    : '';

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {/* ────────── BƯỚC 1: Form đăng ký ────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                {loading ? 'Đang gửi mã OTP...' : 'Tiếp tục'}
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
        )}

        {/* ────────── BƯỚC 2: Nhập OTP ────────── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Back button */}
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); }}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary mb-8 group transition-colors"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Quay lại
            </button>

            {/* Icon + Heading */}
            <div className="mb-8">
              <div className="w-14 h-14 bg-secondary-light rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-7 h-7 text-secondary" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                Xác thực số điện thoại
              </h1>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                Nhập mã 6 chữ số đã được gửi đến{' '}
                <span className="font-bold text-slate-700">{maskedPhone}</span> qua SMS.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium text-center">
                  {error}
                </div>
              )}

              {/* OTP Inputs */}
              <div className="flex justify-between gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    className={`
                      h-14 w-full rounded-xl border-2 bg-slate-50/80 text-center text-xl font-bold
                      text-slate-900 shadow-sm outline-none transition-all duration-200
                      focus:bg-white focus:border-primary focus:ring-3 focus:ring-primary/15
                      ${digit ? 'border-primary/40 bg-primary/5' : 'border-slate-200 hover:border-slate-300'}
                    `}
                  />
                ))}
              </div>

              {/* Verify button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!isOtpComplete || otpLoading}
                className="auth-btn-primary"
              >
                {otpLoading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ShieldCheck size={18} />
                }
                {otpLoading ? 'Đang xác thực...' : 'Xác nhận & Tạo tài khoản'}
              </motion.button>

              {/* Resend */}
              <div className="text-center">
                <span className="text-sm text-slate-500">Chưa nhận được mã? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timeLeft > 0}
                  className={`text-sm font-semibold transition-colors ${
                    timeLeft > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-primary hover:text-primary-dark hover:underline'
                  }`}
                >
                  Gửi lại {timeLeft > 0 && (
                    <span className="inline-flex items-center justify-center w-8 h-5 bg-slate-100 rounded text-xs font-bold text-slate-500 ml-1">
                      {timeLeft}s
                    </span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
