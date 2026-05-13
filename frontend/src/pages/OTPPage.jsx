import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(59);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
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
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  const handleResend = () => {
    if (timeLeft === 0) {
      setTimeLeft(59);
      // Logic to resend OTP would go here
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("OTP submitted:", otp.join(''));
  }

  const isComplete = otp.every(d => d !== '');

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
          to="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary mb-8 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </Link>

        {/* Icon + Heading */}
        <div className="mb-8">
          <div className="w-14 h-14 bg-secondary-light rounded-2xl flex items-center justify-center mb-5">
            <ShieldCheck className="w-7 h-7 text-secondary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Xác thực OTP
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            Nhập mã 6 chữ số đã được gửi đến số điện thoại của bạn.
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
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
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
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
            disabled={!isComplete}
            className="auth-btn-primary"
          >
            <ShieldCheck size={18} />
            Xác nhận mã
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
    </AuthLayout>
  );
}
