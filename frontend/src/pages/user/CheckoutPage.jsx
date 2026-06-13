import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, User, Phone, MapPin, CreditCard, Truck,
  Banknote, ChevronRight, Package, CheckCircle2, AlertTriangle,
  ArrowLeft, Minus, Plus, Trash2, Loader2,
} from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

const API = 'http://localhost:5000/api';
const GEO = 'https://provinces.open-api.vn/api/v2';
const fmt = (n) => n ? n.toLocaleString('vi-VN') + 'đ' : '0đ';

export default function CheckoutPage() {
  const { cart, updateQty, removeFromCart, user } = useOutletContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ho_ten: user?.ten || '',
    so_dien_thoai: user?.sodienthoai || '',
    tinh_thanh: '',
    phuong_xa: '',
    dia_chi: '',
    phuong_thuc_tt: 'cod',
    ghi_chu: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Địa chỉ API v2 (34 tỉnh, 2 cấp: Tỉnh → Xã) ──
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards]         = useState([]);
  const [loadingProv, setLoadingProv] = useState(true);
  const [loadingWard, setLoadingWard] = useState(false);
  const [provError, setProvError] = useState(false);

  useEffect(() => {
    setLoadingProv(true);
    setProvError(false);
    fetch(`${GEO}/`)
      .then(r => r.json())
      .then(d => setProvinces(Array.isArray(d) ? d : []))
      .catch(() => setProvError(true))
      .finally(() => setLoadingProv(false));
  }, []);

  const handleProvince = async (e) => {
    const code = Number(e.target.value);
    const prov = provinces.find(p => p.code === code);
    setForm(f => ({ ...f, tinh_thanh: prov?.name || '', phuong_xa: '' }));
    setWards([]);
    if (!code) return;
    setLoadingWard(true);
    try {
      const r = await fetch(`${GEO}/p/${code}?depth=2`);
      const d = await r.json();
      setWards(d.wards || d.communes || []);
    } catch { }
    finally { setLoadingWard(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const handleOrder = async () => {
    if (!form.ho_ten.trim())        return setError('Vui lòng nhập họ tên');
    if (!form.so_dien_thoai.trim()) return setError('Vui lòng nhập số điện thoại');
    if (!form.tinh_thanh)           return setError('Vui lòng chọn tỉnh/thành');
    if (cart.length === 0)          return setError('Giỏ hàng trống');

    const diaChiDayDu = [form.dia_chi, form.phuong_xa, form.tinh_thanh]
      .filter(Boolean).join(', ');

    setSubmitting(true); setError('');
    try {
      const res = await authFetch(`${API}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          dia_chi: diaChiDayDu,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, image: i.image })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      if (form.phuong_thuc_tt === 'chuyen_khoan') {
        navigate('/order-success', { state: { order: data, showQR: true }, replace: true });
      } else {
        navigate('/order-success', { state: { order: data }, replace: true });
      }
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
  const selClass = (disabled) =>
    IC + ' pl-10 appearance-none' + (disabled ? ' opacity-50 cursor-not-allowed bg-[#f8fafc]' : '');

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
                {/* Họ tên + SĐT */}
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

                {/* Tỉnh / Thành phố */}
                <div>
                  <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">
                    Tỉnh / Thành phố *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881] z-10" />
                    {loadingProv ? (
                      <div className={IC + ' pl-10 flex items-center gap-2 text-[#707881]'}>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải danh sách tỉnh/thành...</span>
                      </div>
                    ) : provError ? (
                      <div className={IC + ' pl-10 text-red-500 text-xs flex items-center gap-2'}>
                        <AlertTriangle className="w-4 h-4" />
                        Không tải được. <button className="underline" onClick={() => window.location.reload()}>Thử lại</button>
                      </div>
                    ) : (
                      <select className={selClass(false)}
                        value={provinces.find(p => p.name === form.tinh_thanh)?.code || ''}
                        onChange={handleProvince}>
                        <option value="">-- Chọn tỉnh/thành --</option>
                        {provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Phường / Xã */}
                <div>
                  <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">
                    Phường / Xã <span className="text-[#bfc7d1] normal-case font-normal">(tuỳ chọn)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707881] z-10" />
                    {loadingWard ? (
                      <div className={IC + ' pl-10 flex items-center gap-2 text-[#707881]'}>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải xã/phường...</span>
                      </div>
                    ) : (
                      <select
                        className={selClass(!form.tinh_thanh || wards.length === 0)}
                        disabled={!form.tinh_thanh || wards.length === 0}
                        value={wards.find(w => w.name === form.phuong_xa)?.code || ''}
                        onChange={e => {
                          const w = wards.find(w => w.code === Number(e.target.value));
                          set('phuong_xa', w?.name || '');
                        }}>
                        <option value="">
                          {!form.tinh_thanh
                            ? '-- Chọn tỉnh/thành trước --'
                            : wards.length === 0
                              ? '-- Không có dữ liệu xã/phường --'
                              : '-- Chọn xã/phường --'}
                        </option>
                        {wards.map(w => (
                          <option key={w.code} value={w.code}>{w.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Địa chỉ chi tiết */}
                <div>
                  <label className="block text-xs font-semibold text-[#707881] mb-1.5 uppercase tracking-wide">
                    Địa chỉ chi tiết <span className="text-[#bfc7d1] normal-case font-normal">(số nhà, đường...)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-[#707881]" />
                    <textarea rows={2} className={IC + ' pl-10 resize-none'}
                      placeholder="VD: Số 14, đường Lê Lợi (không bắt buộc)"
                      value={form.dia_chi} onChange={e => set('dia_chi', e.target.value)} />
                  </div>
                </div>

                {/* Ghi chú */}
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
                <div className="mt-4 p-4 bg-[#e8f4fd] border border-[#0077b6]/20 rounded-xl text-sm">
                  <p className="font-bold text-[#0077b6] mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Thanh toán qua chuyển khoản (SePay)
                  </p>
                  <p className="text-[#404850] text-xs mt-1">
                    Sau khi đặt hàng, bạn sẽ nhận được <strong>mã QR</strong> để quét thanh toán.
                    Hệ thống tự động xác nhận khi nhận được tiền.
                  </p>
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
                <div className="flex justify-between text-[#2c694e] text-xs font-medium">
                  <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" />Phí vận chuyển</span>
                  <span className="font-bold">Miễn phí 🎉</span>
                </div>
                <div className="pt-3 border-t border-[#e7edf3] flex justify-between items-center">
                  <span className="font-bold text-[#191c1d]">Tổng thanh toán</span>
                  <span className="text-2xl font-black text-[#0077b6]">{fmt(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={submitting}
                className="mt-5 w-full py-4 bg-gradient-to-r from-[#0077b6] to-[#005d90] text-white font-black text-base rounded-2xl hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-[#0077b6]/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
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
