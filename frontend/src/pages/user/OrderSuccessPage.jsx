import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ShoppingBag, Home, Phone, Package, Truck,
  CreditCard, Clock, RefreshCw, Loader2,
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const fmt = (n) => n ? n.toLocaleString('vi-VN') + 'đ' : '0đ';

// ── Cấu hình SePay QR ──────────────────────────────────────────────────────
// Thay bằng thông tin tài khoản ngân hàng của bạn trên SePay
const SEPAY_BANK = 'Sacombank';          // Tên ngân hàng (MB, Vietcombank, VPBank, ...)
const SEPAY_ACC_NO = '070136438679';   // Số tài khoản ngân hàng
const SEPAY_ACC_NAME = 'HO HOANG LONG'; // Tên chủ tài khoản

/**
 * Tạo URL QR VietQR cho chuyển khoản
 * Format: https://qr.sepay.vn/img?bank=BANK&acc=ACC&template=compact&amount=AMOUNT&des=CONTENT
 */
function buildSepayQR(amount, orderCode) {
  const params = new URLSearchParams({
    bank: SEPAY_BANK,
    acc: SEPAY_ACC_NO,
    template: 'compact',
    amount: String(amount),
    des: orderCode, // Nội dung CK = mã đơn hàng → webhook auto-match
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

// ── QR Payment Section ──────────────────────────────────────────────────────
function QRPaymentSection({ orderCode, totalAmount }) {
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);

  // Polling kiểm tra thanh toán mỗi 5 giây
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/sepay/check/${orderCode}`);
        const data = await res.json();
        if (data.paid) {
          setPaid(true);
          clearInterval(interval);
        }
      } catch { }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderCode]);

  const manualCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API}/sepay/check/${orderCode}`);
      const data = await res.json();
      if (data.paid) setPaid(true);
    } catch { }
    finally { setChecking(false); }
  };

  if (paid) {
    return (
      <div className="bg-[#aeeecb]/30 border-2 border-[#2c694e]/30 rounded-2xl p-6 text-center">
        <div className="w-14 h-14 bg-[#2c694e] rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-black text-[#2c694e]">Thanh toán thành công!</h3>
        <p className="text-sm text-[#2c694e]/80 mt-1">Đơn hàng đã được xác nhận thanh toán tự động.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#0077b6]/20 p-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fff8e1] border border-[#ffd54f] rounded-full text-sm font-bold text-[#795548]">
          <Clock className="w-4 h-4" /> Đang chờ thanh toán
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <img
            src={buildSepayQR(totalAmount, orderCode)}
            alt="QR Code thanh toán"
            className="w-56 h-56 object-contain"
          />
        </div>
      </div>

      {/* Thông tin CK */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-[#707881]">Ngân hàng</span>
          <span className="font-bold text-[#191c1d]">{SEPAY_BANK}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-[#707881]">Số tài khoản</span>
          <span className="font-bold text-[#191c1d] font-mono">{SEPAY_ACC_NO}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-[#707881]">Chủ tài khoản</span>
          <span className="font-bold text-[#191c1d]">{SEPAY_ACC_NAME}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-[#707881]">Số tiền</span>
          <span className="font-extrabold text-[#0077b6] text-lg">{fmt(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-[#707881]">Nội dung CK</span>
          <span className="font-bold text-[#ba1a1a] font-mono tracking-wider">{orderCode}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#fff8e1] border border-[#ffd54f] rounded-xl">
        <p className="text-xs text-[#795548] text-center">
          ⚠️ Vui lòng chuyển khoản <strong>đúng số tiền</strong> và <strong>đúng nội dung</strong> để hệ thống tự động xác nhận.
        </p>
      </div>

      {/* Check button */}
      <button onClick={manualCheck} disabled={checking}
        className="mt-4 w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-[#0077b6] bg-[#e8f4fd] rounded-xl hover:bg-[#cde5ff] transition-colors disabled:opacity-50">
        {checking
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...</>
          : <><RefreshCw className="w-4 h-4" /> Kiểm tra thanh toán</>
        }
      </button>

      <p className="text-center text-[10px] text-[#707881] mt-3">
        Hệ thống tự động kiểm tra mỗi 5 giây. Thường xác nhận trong 1–2 phút sau khi chuyển khoản.
      </p>
    </div>
  );
}


// ── Main Page ───────────────────────────────────────────────────────────────
export default function OrderSuccessPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;
  const showQR = state?.showQR || false;

  if (!order) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#f8fafc] to-[#e8f5e9] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Hero */}
        <div className={`px-8 py-10 text-center relative overflow-hidden ${showQR ? 'bg-gradient-to-br from-[#904300] to-[#743500]' : 'bg-gradient-to-br from-[#0077b6] to-[#005d90]'
          }`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              {showQR
                ? <CreditCard className="w-10 h-10 text-[#904300]" />
                : <CheckCircle2 className="w-10 h-10 text-[#0077b6]" />
              }
            </div>
            <h1 className="text-2xl font-black text-white mb-1">
              {showQR ? 'Thanh toán đơn hàng' : 'Đặt hàng thành công!'}
            </h1>
            <p className="text-white/70 text-sm">
              {showQR ? 'Quét mã QR bên dưới để thanh toán' : 'Cảm ơn bạn đã tin tưởng AquaHealth'}
            </p>
          </div>
        </div>

        {/* Order info */}
        <div className="p-6 space-y-4">
          {/* Mã đơn */}
          <div className="bg-[#f0f7ff] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0077b6]/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[#0077b6]" />
              </div>
              <div>
                <p className="text-xs text-[#707881] font-medium">Mã đơn hàng</p>
                <p className="text-lg font-black text-[#0077b6] tracking-wider">{order.ma_don_hang}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#707881]">Tổng tiền</p>
              <p className="text-lg font-black text-[#191c1d]">{fmt(order.tong_tien)}</p>
            </div>
          </div>

          {/* QR Payment hoặc Steps */}
          {showQR ? (
            <QRPaymentSection orderCode={order.ma_don_hang} totalAmount={order.tong_tien} />
          ) : (
            <div className="space-y-2">
              {[
                { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Đơn hàng đã được ghi nhận', done: true },
                { icon: <Phone className="w-4 h-4" />, label: 'Nhân viên sẽ xác nhận trong 1–2 giờ', done: false },
                { icon: <Truck className="w-4 h-4" />, label: 'Giao hàng trong 2–5 ngày làm việc', done: false },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${s.done ? 'bg-[#aeeecb]/30' : 'bg-[#f3f4f5]'}`}>
                  <div className={`p-1.5 rounded-lg ${s.done ? 'bg-[#2c694e] text-white' : 'bg-[#bfc7d1] text-white'}`}>
                    {s.icon}
                  </div>
                  <p className={`text-sm font-semibold ${s.done ? 'text-[#2c694e]' : 'text-[#707881]'}`}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-[#707881] bg-[#fff8e1] border border-[#ffd54f] rounded-xl p-3">
            📞 Hỗ trợ đơn hàng: <strong className="text-[#795548]">1800 1234</strong> (miễn phí, 7h–22h)
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => navigate('/store')}
              className="flex items-center justify-center gap-2 py-3 border-2 border-[#0077b6] text-[#0077b6] font-bold rounded-2xl hover:bg-[#e8f4fd] transition-all">
              <ShoppingBag className="w-4 h-4" />Mua tiếp
            </button>
            <button onClick={() => navigate('/my-orders')}
              className="flex items-center justify-center gap-2 py-3 bg-[#0077b6] text-white font-bold rounded-2xl hover:bg-[#005d90] transition-all shadow-lg shadow-[#0077b6]/25">
              <Package className="w-4 h-4" />Xem đơn hàng
            </button>
          </div>
          <button onClick={() => navigate('/home')}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-[#707881] hover:text-[#404850] transition-colors">
            <Home className="w-4 h-4" />Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
