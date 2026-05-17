import { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, Pencil, Trash2, Save, X, AlertTriangle,
  GripVertical, CheckCircle2, XCircle, Package,
  Droplet, Beaker, Heart, Leaf, ShieldCheck, Star,
} from 'lucide-react';

const API = 'http://localhost:5000/api';
import { authFetch } from '../../utils/authFetch';

/* Màu preset */
const COLOR_PRESETS = [
  { label: 'Xanh dương',  value: 'bg-[#0077b6] text-white'  },
  { label: 'Xanh đậm',   value: 'bg-[#005d90] text-white'  },
  { label: 'Đỏ',         value: 'bg-red-600 text-white'     },
  { label: 'Xanh lá',    value: 'bg-green-700 text-white'   },
  { label: 'Cam',         value: 'bg-amber-600 text-white'   },
  { label: 'Xanh teal',  value: 'bg-teal-600 text-white'    },
  { label: 'Tím',         value: 'bg-purple-600 text-white'  },
  { label: 'Hồng',        value: 'bg-pink-600 text-white'    },
  { label: 'Xám',         value: 'bg-slate-500 text-white'   },
  { label: 'Nâu',         value: 'bg-[#904300] text-white'  },
  { label: 'Xanh mint',  value: 'bg-[#2c694e] text-white'  },
];

/* Icon preset */
const ICON_PRESETS = [
  { label: 'Package',     value: 'Package'    },
  { label: 'Droplet',     value: 'Droplet'    },
  { label: 'Beaker',      value: 'Beaker'     },
  { label: 'Heart',       value: 'Heart'      },
  { label: 'Leaf',        value: 'Leaf'       },
  { label: 'Shield',      value: 'ShieldCheck'},
  { label: 'Star',        value: 'Star'       },
  { label: 'Tag',         value: 'Tag'        },
];

const ICON_MAP = { Package, Droplet, Beaker, Heart, Leaf, ShieldCheck, Star, Tag };

function renderIcon(name, cls = 'w-4 h-4') {
  const Icon = ICON_MAP[name] || Package;
  return <Icon className={cls} />;
}

const INPUT = 'w-full px-3 py-2.5 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none';

const EMPTY = { key: '', label: '', color: 'bg-[#0077b6] text-white', icon: 'Package', order: 99 };

/* ── Form Modal ── */
function CategoryModal({ category, onClose, onSave }) {
  const isEdit = !!category;
  const [form, setForm]   = useState(isEdit ? { ...category, label: category.label, order: category.order } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.key?.trim())   { setError('Vui lòng nhập Key danh mục'); return; }
    if (!form.label?.trim()) { setError('Vui lòng nhập Tên danh mục'); return; }
    setSaving(true); setError('');
    try {
      const url    = isEdit ? `${API}/categories/${category.id}` : `${API}/categories`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, { method, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSave(isEdit ? '✅ Đã cập nhật danh mục!' : '✅ Đã thêm danh mục mới!');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e4]">
          <h2 className="text-lg font-bold text-[#191c1d]">{isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full"><X className="w-5 h-5 text-[#707881]" /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a]">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Preview Badge */}
          <div className="flex items-center justify-center py-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${form.color}`}>
              {renderIcon(form.icon)} {form.label || 'Tên danh mục'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Key (mã định danh) *</label>
              <input
                className={INPUT}
                value={form.key}
                onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="vd: dac_tri"
                disabled={isEdit}
              />
              {isEdit && <p className="text-xs text-[#707881] mt-1">Key không thể thay đổi</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Thứ tự hiển thị</label>
              <input className={INPUT} type="number" min={1} value={form.order} onChange={e => set('order', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Tên danh mục *</label>
            <input className={INPUT} value={form.label} onChange={e => set('label', e.target.value)} placeholder="VD: Đặc trị bệnh" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-2 uppercase">Màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  onClick={() => set('color', c.value)}
                  title={c.label}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${c.value.split(' ')[0]} ${form.color === c.value ? 'border-[#191c1d] scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-2 uppercase">Biểu tượng</label>
            <div className="flex flex-wrap gap-2">
              {ICON_PRESETS.map(ic => (
                <button
                  key={ic.value}
                  onClick={() => set('icon', ic.value)}
                  title={ic.label}
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${form.icon === ic.value ? 'border-[#0077b6] bg-[#0077b6]/10 text-[#0077b6]' : 'border-[#e1e3e4] text-[#707881] hover:bg-[#f3f4f5]'}`}
                >
                  {renderIcon(ic.value)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e1e3e4]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5]">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-bold bg-[#0077b6] text-white rounded-xl hover:bg-[#005d90] disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Lưu thay đổi' : 'Thêm danh mục'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ── */
function DeleteModal({ category, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-[#ba1a1a]" />
        </div>
        <h3 className="text-lg font-bold mb-2">Xóa danh mục?</h3>
        <p className="text-sm text-[#707881] mb-2">Danh mục <strong>"{category?.label}"</strong> sẽ bị xóa vĩnh viễn.</p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">⚠️ Chỉ xóa được nếu không còn sản phẩm nào thuộc danh mục này.</p>
        {err && <p className="text-sm text-[#ba1a1a] mb-3 font-semibold">{err}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5]">Hủy</button>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true); setErr('');
              const result = await onConfirm(category.id);
              if (result?.error) { setErr(result.error); setLoading(false); }
            }}
            className="flex-1 py-2.5 text-sm font-bold bg-[#ba1a1a] text-white rounded-xl hover:bg-[#93000a] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />} Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toggle Active ── */
async function toggleActive(id, active) {
  // Không có field active riêng — dùng PUT với toàn bộ data
  await authFetch(`${API}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ active: !active }),
  });
}

/* ── Main Page ── */
export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // {type:'create'|'edit'|'delete', item}
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchCategories = useCallback(() => {
    setLoading(true);
    authFetch(`${API}/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleDelete = async (id) => {
    const res = await authFetch(`${API}/categories/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return { error: data.message };
    setModal(null);
    showToast('✅ Đã xóa danh mục!');
    fetchCategories();
  };

  const handleToggle = async (cat) => {
    await authFetch(`${API}/categories/${cat.id}`, {
      method: 'PUT',
      body: JSON.stringify({ label: cat.label, color: cat.color, icon: cat.icon, order: cat.order, active: !cat.active }),
    });
    showToast(cat.active ? '⏸ Đã ẩn danh mục' : '✅ Đã hiển thị danh mục');
    fetchCategories();
  };

  return (
    <>
      {toast && <div className="fixed top-6 right-6 z-[100] bg-[#191c1d] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold">{toast}</div>}
      {modal?.type === 'create' && <CategoryModal onClose={() => setModal(null)} onSave={(msg) => { setModal(null); showToast(msg); fetchCategories(); }} />}
      {modal?.type === 'edit'   && <CategoryModal category={modal.item} onClose={() => setModal(null)} onSave={(msg) => { setModal(null); showToast(msg); fetchCategories(); }} />}
      {modal?.type === 'delete' && <DeleteModal category={modal.item} onClose={() => setModal(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Danh mục sản phẩm</h1>
          <p className="text-[#404850]">Quản lý các danh mục thuốc thú y trong cửa hàng.</p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-[#0077b6] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#005d90] transition-all active:scale-95 shadow-lg shadow-[#0077b6]/25 shrink-0"
        >
          <Plus className="w-5 h-5" /> Thêm danh mục
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#cde5ff]"><Tag className="w-5 h-5 text-[#0077b6]" /></div>
          <div><p className="text-xs font-semibold text-[#707881] uppercase">Tổng danh mục</p><p className="text-2xl font-bold text-[#191c1d]">{categories.length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#aeeecb]"><CheckCircle2 className="w-5 h-5 text-[#2c694e]" /></div>
          <div><p className="text-xs font-semibold text-[#707881] uppercase">Đang hiển thị</p><p className="text-2xl font-bold text-[#191c1d]">{categories.filter(c => c.active).length}</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#e1e3e4] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#e7e8e9]"><XCircle className="w-5 h-5 text-[#707881]" /></div>
          <div><p className="text-xs font-semibold text-[#707881] uppercase">Đang ẩn</p><p className="text-2xl font-bold text-[#191c1d]">{categories.filter(c => !c.active).length}</p></div>
        </div>
      </div>

      {/* Category Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-xl border border-[#e1e3e4] animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-[#e1e3e4]">
          <Tag className="w-14 h-14 mx-auto text-[#bfc7d1] mb-4" />
          <h3 className="text-lg font-semibold text-[#707881]">Chưa có danh mục nào</h3>
          <p className="text-sm text-[#707881] mt-1">Bấm "Thêm danh mục" để tạo danh mục đầu tiên</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(cat => (
            <div key={cat.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-all ${cat.active ? 'border-[#e1e3e4]' : 'border-[#e1e3e4] opacity-60'}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.color}`}>
                    {renderIcon(cat.icon, 'w-6 h-6')}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191c1d]">{cat.label}</h3>
                    <code className="text-xs bg-[#f3f4f5] text-[#707881] px-2 py-0.5 rounded-lg">{cat.key}</code>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ type: 'edit', item: cat })} className="p-2 hover:bg-[#e7e8e9] rounded-lg" title="Sửa"><Pencil className="w-4 h-4 text-[#404850]" /></button>
                  <button onClick={() => setModal({ type: 'delete', item: cat })} className="p-2 hover:bg-[#ffdad6] rounded-lg" title="Xóa"><Trash2 className="w-4 h-4 text-[#ba1a1a]" /></button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f5]">
                <div className="flex items-center gap-1.5 text-xs text-[#707881]">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span>Thứ tự: <strong>{cat.order}</strong></span>
                </div>
                <button
                  onClick={() => handleToggle(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${cat.active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-[#e7e8e9] text-[#707881] hover:bg-green-100 hover:text-green-700'}`}
                >
                  {cat.active ? <><CheckCircle2 className="w-3.5 h-3.5" /> Hiển thị</> : <><XCircle className="w-3.5 h-3.5" /> Đã ẩn</>}
                </button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => setModal({ type: 'create' })}
            className="bg-[#f8f9fa] rounded-2xl border-2 border-dashed border-[#bfc7d1] p-5 flex flex-col items-center justify-center gap-3 text-[#707881] hover:border-[#0077b6] hover:text-[#0077b6] hover:bg-[#f0f7ff] transition-all min-h-[152px]"
          >
            <div className="w-12 h-12 rounded-xl bg-[#e7e8e9] flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">Thêm danh mục mới</p>
          </button>
        </div>
      )}

      {/* Usage Note */}
      <div className="mt-8 bg-[#cde5ff]/30 border border-[#0077b6]/20 rounded-xl p-5">
        <h4 className="text-sm font-bold text-[#0077b6] mb-2">💡 Lưu ý khi quản lý danh mục</h4>
        <ul className="text-sm text-[#404850] space-y-1 list-disc list-inside">
          <li><strong>Key</strong> là mã định danh duy nhất, không thể thay đổi sau khi tạo và phải viết thường, không dấu, dùng dấu gạch dưới.</li>
          <li>Không thể xóa danh mục nếu còn sản phẩm đang sử dụng — cần chuyển sản phẩm sang danh mục khác trước.</li>
          <li>Ẩn danh mục sẽ không hiển thị trên cửa hàng nhưng không ảnh hưởng sản phẩm đang bán.</li>
        </ul>
      </div>
    </>
  );
}
