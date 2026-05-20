import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, TrendingUp, TrendingDown, Minus, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';

const API = 'http://localhost:5000/api';

const DEFAULT_ROW = { co: '', tom_su: '', tom_the: '', xu_huong: 0, thay_doi: '' };

export default function ShrimpPricePage() {
  const [rows, setRows]     = useState([]);
  const [vung, setVung]     = useState('ĐBSCL');
  const [capNhat, setCapNhat] = useState(null);
  const [capBoi, setCapBoi] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState({ show: false, ok: true, msg: '' });

  const showToast = (ok, msg) => {
    setToast({ show: true, ok, msg });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/shrimp-prices`);
      const data = await res.json();
      setRows((data.gia || []).map(r => ({ ...r })));
      setVung(data.vung || 'ĐBSCL');
      setCapNhat(data.capnhat_luc);
      setCapBoi(data.capnhat_boi || '');
    } catch {
      showToast(false, 'Không thể tải dữ liệu giá tôm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const handleChange = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, { ...DEFAULT_ROW }]);

  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    // Validate
    for (const row of rows) {
      if (!row.co.trim()) return showToast(false, 'Vui lòng nhập cỡ tôm cho tất cả các dòng');
    }
    setSaving(true);
    try {
      const cleaned = rows.map(r => ({
        co:       r.co.trim(),
        tom_su:   Number(r.tom_su)   || 0,
        tom_the:  Number(r.tom_the)  || 0,
        xu_huong: Number(r.xu_huong) || 0,
        thay_doi: Math.abs(Number(r.thay_doi) || 0),
      }));
      const res = await authFetch(`${API}/shrimp-prices`, {
        method: 'PUT',
        body: JSON.stringify({ gia: cleaned, vung }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(false, data.message || 'Lỗi lưu');
      showToast(true, 'Cập nhật giá tôm thành công!');
      fetchPrices();
    } catch {
      showToast(false, 'Lỗi kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const IC = 'w-full px-3 py-2 border border-[#dde1e7] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none bg-white';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#191c1d]">Giá Tôm Thị Trường</h1>
          <p className="text-sm text-[#707881] mt-0.5">Cập nhật giá tôm hiển thị trên trang chủ người dùng</p>
        </div>
        <button
          onClick={fetchPrices}
          className="p-2 text-[#707881] hover:bg-[#f3f4f5] rounded-xl transition-colors"
          title="Tải lại"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`mb-5 flex items-center gap-3 p-4 rounded-xl text-sm font-semibold ${
          toast.ok ? 'bg-[#aeeecb] text-[#2c694e]' : 'bg-[#ffdad6] text-[#ba1a1a]'
        }`}>
          {toast.ok ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Meta */}
      <div className="bg-white rounded-2xl border border-[#e1e3e4] p-5 mb-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#707881] mb-1.5 uppercase">Khu vực / Vùng</label>
            <input
              className={IC}
              value={vung}
              onChange={e => setVung(e.target.value)}
              placeholder="VD: ĐBSCL, Cà Mau..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#707881] mb-1.5 uppercase">Cập nhật lần cuối</label>
            <div className="px-3 py-2 border border-[#e1e3e4] rounded-lg text-sm text-[#707881] bg-[#f8f9fa]">
              {capNhat
                ? `${new Date(capNhat).toLocaleString('vi-VN')} bởi ${capBoi}`
                : 'Chưa có dữ liệu'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-[#e1e3e4] bg-[#f8f9fa] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#191c1d]">Danh sách giá ({rows.length} dòng)</h2>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b6] text-white text-xs font-bold rounded-lg hover:bg-[#005d90] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm dòng
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#707881] text-sm">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#0077b6]" />
            Đang tải...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="text-[11px] text-[#707881] uppercase font-bold border-b border-[#e1e3e4]">
                <tr>
                  <th className="px-4 py-3 w-32">Cỡ tôm</th>
                  <th className="px-4 py-3">Giá Tôm Sú (đ/kg)</th>
                  <th className="px-4 py-3">Giá Tôm Thẻ (đ/kg)</th>
                  <th className="px-4 py-3 w-36">Xu hướng</th>
                  <th className="px-4 py-3 w-36">Thay đổi (đ)</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f5]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#707881] text-sm">
                      Chưa có dòng nào. Nhấn "Thêm dòng" để bắt đầu.
                    </td>
                  </tr>
                ) : rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f8f9fa]/60 transition-colors">
                    {/* Cỡ tôm */}
                    <td className="px-4 py-3">
                      <input
                        className={IC}
                        placeholder="20 con/kg"
                        value={row.co}
                        onChange={e => handleChange(idx, 'co', e.target.value)}
                      />
                    </td>
                    {/* Tôm sú */}
                    <td className="px-4 py-3">
                      <input
                        className={IC}
                        type="number"
                        min={0}
                        placeholder="285000"
                        value={row.tom_su}
                        onChange={e => handleChange(idx, 'tom_su', e.target.value)}
                      />
                    </td>
                    {/* Tôm thẻ */}
                    <td className="px-4 py-3">
                      <input
                        className={IC}
                        type="number"
                        min={0}
                        placeholder="165000"
                        value={row.tom_the}
                        onChange={e => handleChange(idx, 'tom_the', e.target.value)}
                      />
                    </td>
                    {/* Xu hướng */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {[
                          { val: 1,  icon: <TrendingUp  className="w-4 h-4" />, cls: 'text-green-600 border-green-300 hover:bg-green-50' },
                          { val: 0,  icon: <Minus        className="w-4 h-4" />, cls: 'text-slate-400 border-slate-300 hover:bg-slate-50'  },
                          { val: -1, icon: <TrendingDown className="w-4 h-4" />, cls: 'text-red-500   border-red-300   hover:bg-red-50'   },
                        ].map(btn => (
                          <button
                            key={btn.val}
                            type="button"
                            onClick={() => handleChange(idx, 'xu_huong', btn.val)}
                            className={`flex-1 py-2 border rounded-lg transition-colors ${btn.cls} ${
                              Number(row.xu_huong) === btn.val ? 'ring-2 ring-offset-1' : ''
                            }`}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                    {/* Thay đổi */}
                    <td className="px-4 py-3">
                      <input
                        className={IC}
                        type="number"
                        min={0}
                        placeholder="2500"
                        value={row.thay_doi}
                        onChange={e => handleChange(idx, 'thay_doi', e.target.value)}
                      />
                    </td>
                    {/* Xóa */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeRow(idx)}
                        className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-[#0077b6] text-white font-bold rounded-xl hover:bg-[#005d90] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-[#0077b6]/20"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save className="w-4 h-4" />
          }
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}
