import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from './AdminLayout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });

  const token = (() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        setUsers(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
    else {
      setError('Admin login required.');
      setLoading(false);
    }
  }, [token]);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Admin login required.');
      return;
    }
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setUsers((u) => [data, ...u]);
      setForm({ name: '', email: '', password: '', role: 'user' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Users" description="Create and manage user accounts.">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <section className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <form className="glass border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4" onSubmit={createUser}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">New user</p>
              <h2 className="text-lg font-semibold">Create account</h2>
            </div>
            <div className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs inline-flex items-center gap-1">
              <Plus size={14} /> Quick add
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Name</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Role</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Working…' : 'Create user'}
          </button>
          <p className="text-xs text-slate-500">Users get immediate access; admins can manage catalog and orders.</p>
        </form>

        <div className="glass border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Directory</p>
              <h2 className="text-lg font-semibold">Users ({users.length})</h2>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-600">No users yet.</p>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[520px] overflow-auto">
              {users.map((u) => (
                <div key={u.id || u._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{u.name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.25em] text-slate-600">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminUsers;
