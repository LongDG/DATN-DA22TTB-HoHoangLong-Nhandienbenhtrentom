import { useState, useEffect, useCallback } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Users, Shield,
  UserCheck, UserX, Pencil, Trash2, X, Save, AlertTriangle,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ROLE_OPTIONS = [
  { key: 'all',   label: 'Tất cả vai trò' },
  { key: 'user',  label: 'Người dùng' },
  { key: 'admin', label: 'Quản trị viên' },
];

const ROLE_STYLE = {
  admin: 'bg-[#cde5ff] text-[#005d90] border-[#0077b6]/20',
  user:  'bg-[#e7e8e9] text-[#404850] border-[#bfc7d1]/20',
};

const STATUS_STYLE = {
  active:   { label: 'Hoạt động', cls: 'bg-[#aeeecb]/60 text-[#316e52]' },
  inactive: { label: 'Bị khóa',   cls: 'bg-[#ffdad6] text-[#93000a]' },
};

/* ── Edit User Modal ── */
function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ ten: user.ten, email: user.email, vaitro: user.vaitro, trangthai: user.trangthai || 'active' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const INPUT = 'w-full px-3 py-2.5 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none';

  const handleSave = async () => {
    if (!form.ten?.trim()) { setError('Vui lòng nhập tên người dùng'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      onSave('✅ Đã cập nhật người dùng!');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e1e3e4]">
          <h2 className="text-lg font-bold text-[#191c1d]">Chỉnh sửa người dùng</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f5] rounded-full"><X className="w-5 h-5 text-[#707881]" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a]"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Họ tên</label>
            <input className={INPUT} value={form.ten} onChange={e => set('ten', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Email</label>
            <input className={INPUT} value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Vai trò</label>
              <select className={INPUT} value={form.vaitro} onChange={e => set('vaitro', e.target.value)}>
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#707881] mb-1 uppercase">Trạng thái</label>
              <select className={INPUT} value={form.trangthai} onChange={e => set('trangthai', e.target.value)}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Bị khóa</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#e1e3e4]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border border-[#bfc7d1] rounded-lg hover:bg-[#f3f4f5]">Hủy</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-bold bg-[#0077b6] text-white rounded-lg hover:bg-[#005d90] transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete User Modal ── */
function DeleteUserModal({ user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-[#ba1a1a]" />
        </div>
        <h3 className="text-lg font-bold text-[#191c1d] mb-1">Xác nhận xóa tài khoản</h3>
        <p className="text-sm text-[#707881] mb-6">Bạn có chắc muốn xóa tài khoản <strong className="text-[#191c1d]">"{user?.ten}"</strong>? Hành động này không thể hoàn tác.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold border border-[#bfc7d1] rounded-xl hover:bg-[#f3f4f5]">Hủy</button>
          <button
            disabled={deleting}
            onClick={async () => { setDeleting(true); await onConfirm(user.id); setDeleting(false); }}
            className="flex-1 py-2.5 text-sm font-bold bg-[#ba1a1a] text-white rounded-xl hover:bg-[#93000a] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function UserManagementPage() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [role, setRole]         = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [toast, setToast]       = useState('');
  const LIMIT = 10;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT, role });
    if (search) params.set('search', search);
    fetch(`${API_BASE}/admin/users?${params}`)
      .then(r => r.json())
      .then(data => { setUsers(data.users ?? []); setTotal(data.total ?? 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, role, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id) => {
    await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
    setModal(null);
    showToast('✅ Đã xóa tài khoản thành công!');
    fetchUsers();
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const adminCount = users.filter(u => u.vaitro === 'admin').length;
  const activeCount = users.filter(u => (u.trangthai || 'active') === 'active').length;

  return (
    <>
      {toast && <div className="fixed top-6 right-6 z-[100] bg-[#191c1d] text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold">{toast}</div>}
      {modal?.type === 'edit' && <EditUserModal user={modal.user} onClose={() => setModal(null)} onSave={(msg) => { setModal(null); showToast(msg); fetchUsers(); }} />}
      {modal?.type === 'delete' && <DeleteUserModal user={modal.user} onClose={() => setModal(null)} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="mb-8 mt-2">
        <h1 className="text-4xl font-bold text-[#191c1d] tracking-tight mb-1">Quản lý người dùng</h1>
        <p className="text-base text-[#404850]">Xem, phân quyền và quản lý tài khoản người dùng trong hệ thống.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Users,     bg: 'bg-[#cde5ff]', color: 'text-[#0077b6]', label: 'Tổng người dùng',    value: total },
          { icon: Shield,    bg: 'bg-[#ffdbc8]', color: 'text-[#904300]', label: 'Quản trị viên',       value: adminCount },
          { icon: UserCheck, bg: 'bg-[#aeeecb]', color: 'text-[#2c694e]', label: 'Đang hoạt động',      value: activeCount },
        ].map(c => (
          <div key={c.label} className="bg-white p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#e1e3e4] flex items-center gap-4">
            <div className={`p-3 rounded-xl ${c.bg}`}><c.icon className={`w-6 h-6 ${c.color}`} /></div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#707881]">{c.label}</p>
              <p className="text-2xl font-bold text-[#191c1d]">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border border-[#e1e3e4]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#707881]" />
            <input className="pl-9 pr-4 py-2 bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none" placeholder="Tìm tên, SĐT, email..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            {searchInput && <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707881]"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="bg-[#f3f4f5] border border-[#bfc7d1] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#0077b6]/30 focus:border-[#0077b6] outline-none">
            {ROLE_OPTIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#e1e3e4]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead className="bg-[#f3f4f5] border-b border-[#e1e3e4]">
              <tr>
                {['Người dùng', 'Liên hệ', 'Khu vực', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-semibold text-[#404850] uppercase tracking-wider${i === 6 ? ' text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7e8e9]">
              {loading && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-[#707881]">
                  <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-[#0077b6] border-t-transparent rounded-full animate-spin" />Đang tải...</div>
                </td></tr>
              )}
              {!loading && users.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-[#bfc7d1] mb-3" />
                  <p className="text-[#707881] text-sm font-medium">Không tìm thấy người dùng nào.</p>
                </td></tr>
              )}
              {!loading && users.map(u => {
                const sts = STATUS_STYLE[u.trangthai] || STATUS_STYLE.active;
                const roleCls = ROLE_STYLE[u.vaitro] || ROLE_STYLE.user;
                const initials = u.ten.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
                return (
                  <tr key={u.id} className="hover:bg-[#f8f9fa]/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#cde5ff] flex items-center justify-center font-bold text-[#0077b6] text-sm shrink-0">
                          {u.anhdaidien ? <img src={u.anhdaidien} alt={u.ten} className="w-full h-full object-cover" /> : initials}
                        </div>
                        <div>
                          <p className="font-semibold text-[#191c1d] text-sm">{u.ten}</p>
                          <p className="text-xs text-[#707881]">{u.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#404850]">{u.sodienthoai || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#404850]">{u.vitri || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${roleCls}`}>
                        {u.vaitro === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                        {u.vaitro === 'admin' ? 'Admin' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${sts.cls}`}>{sts.label}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#707881]">{u.ngaytao}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal({ type: 'edit', user: u })} className="p-2 text-[#404850] hover:bg-[#e7e8e9] rounded-lg transition-colors" title="Chỉnh sửa">
                          <Pencil className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => setModal({ type: 'delete', user: u })} className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors" title="Xóa tài khoản">
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-[#f3f4f5]/50 border-t border-[#e1e3e4] flex items-center justify-between">
          <span className="text-sm text-[#707881]">
            Hiển thị <span className="font-semibold text-[#191c1d]">{Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)}</span> của <span className="font-semibold text-[#191c1d]">{total}</span> tài khoản
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white disabled:opacity-40"><ChevronLeft className="w-5 h-5" /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`px-3.5 py-2 rounded-lg text-sm font-bold ${page === n ? 'bg-[#0077b6] text-white' : 'border border-[#bfc7d1] hover:bg-white text-[#404850]'}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-[#bfc7d1] hover:bg-white disabled:opacity-40"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
