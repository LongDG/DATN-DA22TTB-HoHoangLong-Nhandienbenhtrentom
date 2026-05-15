import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2, Package, CheckCircle2 } from 'lucide-react';

function formatVND(n) {
  return n ? n.toLocaleString('vi-VN') + 'đ' : '—';
}

export function CartDrawer({ cart, onClose, onRemove, onQty }) {
  const navigate = useNavigate();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#191c1d] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#0077b6]" />
            Giỏ hàng
            {cart.length > 0 && (
              <span className="ml-1 bg-[#0077b6] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <ShoppingCart className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-slate-400 font-semibold">Giỏ hàng trống</p>
              <p className="text-slate-300 text-sm mt-1">Thêm sản phẩm từ cửa hàng</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                {/* Image */}
                <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    : <Package className="w-7 h-7 text-slate-300" />
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#191c1d] truncate">{item.name}</p>
                  <p className="text-[#0077b6] font-bold text-sm mt-0.5">{formatVND(item.price)}</p>
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => onQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="ml-auto text-sm font-bold text-slate-600">{formatVND(item.price * item.qty)}</span>
                  </div>
                </div>
                {/* Remove */}
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-100 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Tạm tính</span>
              <span className="text-xl font-bold text-[#191c1d]">{formatVND(total)}</span>
            </div>
            <button
              onClick={() => { onClose(); navigate('/checkout'); }}
              className="w-full py-3.5 bg-[#0077b6] text-white font-bold rounded-2xl hover:bg-[#005d90] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#0077b6]/25">
              <CheckCircle2 className="w-5 h-5" /> Đặt hàng ngay
            </button>
            <button onClick={onClose} className="w-full py-2.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors">
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
