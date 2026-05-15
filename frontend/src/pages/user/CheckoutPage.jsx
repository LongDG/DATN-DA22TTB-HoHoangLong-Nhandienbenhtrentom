import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, User, Phone, MapPin, CreditCard, Truck,
  Banknote, ChevronRight, Package, CheckCircle2, AlertTriangle,
  ArrowLeft, Minus, Plus, Trash2,
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const fmt = (n) => n ? n.toLocaleString('vi-VN') + 'đ' : '0đ';

const TINH = [
  'An Giang','Bạc Liêu','Bến Tre','Cà Mau','Cần Thơ','Đồng Tháp',
  'Hậu Giang','Kiên Giang','Long An','Sóc Trăng','Tiền Giang','Trà Vinh','Vĩnh Long',
  'Thành phố Hồ Chí Minh','Hà Nội','Đà Nẵng','Khác',
];

export default function CheckoutPage() {
  const { cart, updateQty, removeFromCart } = useOutletContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ho_ten: '', so_dien_thoai: '', tinh_thanh: '', dia_chi: '',
    phuong_thuc_tt: 'cod', ghi_chu: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping  = subtotal >= 500000 ? 0 : 30000;
  const total     = subtotal + shipping;

  const handleOrder = async () => {
    if (!form.ho_ten.trim())        return setError('Vui lòng nhập họ tên');
    if (!form.so_dien_thoai.trim()) return setError('Vui lòng nhập số điện thoại');
    if (!form.tinh_thanh)           return setError('Vui lòng chọn tỉnh/thành');
    if (!form.dia_chi.trim())       return setError('Vui lòng nhập địa chỉ');
    if (cart.length === 0)          return setError('Giỏ hàng trống');
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate('/order-success', { state: { order: data }, replace: true });
    } catch (e) {
      setError(e.message || 'Lỗi đặt hàng, thử lại sau');
    } finally { setSubmitting(false); }
  };

  if (cart.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
      <ShoppingCart className="w-20 h-20 text-[#bfc7d1]" />
      <p className="text-xl font-bold text-[#191c1d]">Giỏ hàng trống</p>
      <p className="text-[#707881]">Hãy thêm sản phẩm trước khi đặt hàng</p>
      <button onClick={() => navigate('/store')}
        className="mt-2 px-6 py-3 bg-[#0077b6] text-white font-bold rounded-xl hover:bg-[#005d90] transition-all">
        Đến cửa hàng
      </button>
    </div>
  );

  const IC = 'w-full px-4 py-3 bg-white border border-[#dde1e7] rounded-xl text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none transition-all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#f8fafc] to-[#f0f7ff]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl transition-colors text-[#707881] hover:text-[#191c1d]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#191c1d]">Đặt hàng</h1>
            <p className="text-[#707881] text-sm mt-0.5">Kiểm tra thông tin và xác nhận đơn hàng</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Cột trái: Form ── */}
          <div className="lg:col-span-7 space-y-5">

            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7edf3] p-6">
              <h2 className="text-base font-bold text-[#191c1d] flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-[#0077b6] rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Thông tin người nhận
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Họ và tên *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881]" />
                      <input className={IC + ' pl-10'} placeholder="Nguyễn Văn A"
                        value={form.ho_ten} onChange={e => set('ho_ten', e.target.value)} />
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Số điện thoại *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881]" />
                      <input className={IC + ' pl-10'} placeholder="0901 234 567" type="tel"
                        value={form.so_dien_thoai} onChange={e => set('so_dien_thoai', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Tỉnh / Thành phố *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881]" />
                    <select className={IC + ' pl-10 appearance-none'} value={form.tinh_thanh} onChange={e => set('tinh_thanh', e.target.value)}>
                      <option value="">-- Chọn tỉnh/thành --</option>
                      {TINH.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Địa chỉ cụ thể *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#707881]" />
                    <textarea rows={2} className={IC + ' pl-10 resize-none'}
                      placeholder="Số nhà, tên đường, xã/phường, huyện/quận..."
                      value={form.dia_chi} onChange={e => set('dia_chi', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">Ghi chú (tuỳ chọn)</label>
                  <textarea rows={2} className={IC + ' resize-none'}
                    placeholder="Ghi chú thêm: giao giờ hành chính, để trước cổng..."
                    value={form.ghi_chu} onChange={e => set('ghi_chu', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7edf3] p-6">
              <h2 className="text-base font-bold text-[#191c1d] flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-[#0077b6] rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'cod',          icon: <Banknote className="w-5 h-5" />,  label: 'Tiền mặt khi nhận', desc: 'Thanh toán khi nhận hàng (COD)' },
                  { key: 'chuyen_khoan', icon: <CreditCard className="w-5 h-5" />, label: 'Chuyển khoản',       desc: 'Chuyển khoản ngân hàng trước' },
                ].map(m => (
                  <button key={m.key} onClick={() => set('phuong_thuc_tt', m.key)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${form.phuong_thuc_tt === m.key ? 'border-[#0077b6] bg-[#e8f4fd]' : 'border-[#e7edf3] hover:border-[#bfc7d1]'}`}>
                    <div className={`p-2 rounded-lg mt-0.5 ${form.phuong_thuc_tt === m.key ? 'bg-[#0077b6] text-white' : 'bg-[#f3f4f5] text-[#707881]'}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#191c1d]">{m.label}</p>
                      <p className="text-xs text-[#707881] mt-0.5">{m.desc}</p>
                    </div>
                    {form.phuong_thuc_tt === m.key && (
                      <CheckCircle2 className="w-5 h-5 text-[#0077b6] ml-auto shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
              {form.phuong_thuc_tt === 'chuyen_khoan' && (
                <div className="mt-4 p-4 bg-[#fff8e1] border border-[#ffd54f] rounded-xl text-sm">
                  <p className="font-bold text-[#795548] mb-1">Thông tin chuyển khoản:</p>
                  <p className="text-[#5d4037]">Ngân hàng: <strong>Vietcombank</strong></p>
                  <p className="text-[#5d4037]">STK: <strong>1234 5678 9012</strong></p>
                  <p className="text-[#5d4037]">Tên: <strong>CONG TY AQUAHEALTH</strong></p>
                  <p className="text-xs text-[#795548] mt-2">Nội dung CK: Họ tên + SĐT</p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-sm text-[#ba1a1a] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
          </div>

          {/* ── Cột phải: Giỏ hàng + Tổng ── */}
          <div className="lg:col-span-5 space-y-5">
            {/* Danh sách sản phẩm */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7edf3] p-6">
              <h2 className="text-base font-bold text-[#191c1d] flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[#0077b6] rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                Giỏ hàng ({cart.length} sản phẩm)
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e7edf3]">
                    <div className="w-14 h-14 rounded-lg bg-white border border-[#e7edf3] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <Package className="w-6 h-6 text-[#bfc7d1]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#191c1d] truncate">{item.name}</p>
                      <p className="text-[#0077b6] font-bold text-sm">{fmt(item.price)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded-md border border-[#dde1e7] flex items-center justify-center hover:bg-white text-[#404850]">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}
                          className="w-6 h-6 rounded-md border border-[#dde1e7] flex items-center justify-center hover:bg-white text-[#404850]">
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="ml-auto text-xs font-bold text-[#404850]">{fmt(item.price * item.qty)}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng tiền + CTA */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7edf3] p-6 sticky top-24">
              <h2 className="text-base font-bold text-[#191c1d] mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#404850]">
                  <span>Tạm tính ({cart.reduce((s, i) => s + i.qty, 0)} sp)</span>
                  <span className="font-semibold">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#404850]">
                  <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Phí vận chuyển</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-[#2c694e]' : ''}`}>
                    {shipping === 0 ? 'Miễn phí' : fmt(shipping)}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-[10px] text-[#2c694e] bg-[#aeeecb]/30 px-2.5 py-1.5 rounded-lg font-medium">
                    🎉 Miễn phí vận chuyển cho đơn từ 500.000đ
                  </p>
                )}
                {shipping > 0 && (
                  <p className="text-[10px] text-[#707881] bg-[#f3f4f5] px-2.5 py-1.5 rounded-lg">
                    Mua thêm {fmt(500000 - subtotal)} để miễn phí ship
                  </p>
                )}
                <div className="pt-3 border-t border-[#e7edf3] flex justify-between items-center">
                  <span className="font-bold text-[#191c1d]">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-[#0077b6]">{fmt(total)}</span>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={submitting}
                className="mt-5 w-full py-4 bg-gradient-to-r from-[#0077b6] to-[#005d90] text-white font-black text-base rounded-2xl hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-[#0077b6]/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang xử lý...</>
                  : <><CheckCircle2 className="w-5 h-5" />Xác nhận đặt hàng <ChevronRight className="w-4 h-4" /></>
                }
              </button>
              <p className="text-center text-xs text-[#707881] mt-3">
                Bằng cách đặt hàng, bạn đồng ý với <span className="text-[#0077b6] cursor-pointer hover:underline">điều khoản dịch vụ</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
