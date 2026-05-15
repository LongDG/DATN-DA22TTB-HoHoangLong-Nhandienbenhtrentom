import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Home, Phone, Package, Truck } from 'lucide-react';

const fmt = (n) => n ? n.toLocaleString('vi-VN') + 'đ' : '0đ';

export default function OrderSuccessPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const order = state?.order;

  if (!order) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#f8fafc] to-[#e8f5e9] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0077b6] to-[#005d90] px-8 py-10 text-center relative overflow-hidden">
          {/* decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-[#0077b6]" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">Đặt hàng thành công!</h1>
            <p className="text-[#cde5ff] text-sm">Cảm ơn bạn đã tin tưởng AquaHealth</p>
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

          {/* Steps */}
          <div className="space-y-2">
            {[
              { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Đơn hàng đã được ghi nhận', done: true },
              { icon: <Phone className="w-4 h-4" />,        label: 'Nhân viên sẽ xác nhận trong 1–2 giờ', done: false },
              { icon: <Truck className="w-4 h-4" />,        label: 'Giao hàng trong 2–5 ngày làm việc', done: false },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${s.done ? 'bg-[#aeeecb]/30' : 'bg-[#f3f4f5]'}`}>
                <div className={`p-1.5 rounded-lg ${s.done ? 'bg-[#2c694e] text-white' : 'bg-[#bfc7d1] text-white'}`}>
                  {s.icon}
                </div>
                <p className={`text-sm font-semibold ${s.done ? 'text-[#2c694e]' : 'text-[#707881]'}`}>{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#707881] bg-[#fff8e1] border border-[#ffd54f] rounded-xl p-3">
            📞 Hỗ trợ đơn hàng: <strong className="text-[#795548]">1800 1234</strong> (miễn phí, 7h–22h)
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => navigate('/store')}
              className="flex items-center justify-center gap-2 py-3 border-2 border-[#0077b6] text-[#0077b6] font-bold rounded-2xl hover:bg-[#e8f4fd] transition-all">
              <ShoppingBag className="w-4 h-4" />Mua tiếp
            </button>
            <button onClick={() => navigate('/home')}
              className="flex items-center justify-center gap-2 py-3 bg-[#0077b6] text-white font-bold rounded-2xl hover:bg-[#005d90] transition-all shadow-lg shadow-[#0077b6]/25">
              <Home className="w-4 h-4" />Trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
