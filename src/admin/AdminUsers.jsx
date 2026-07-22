import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';

import { API } from '../lib/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', role: 'user' });

  const token = (() => {
    try {
      return localStorage.getItem('admin_token');
    } catch (e) {
      return null;
    }
  })();

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

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

  const beginEdit = (user) => {
    setEditingId(user.id || user._id);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
    });
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditForm({ name: '', email: '', password: '', role: 'user' });
  };

  const saveEdit = async () => {
    setError('');
    if (!token) {
      setError('Admin login required.');
      return;
    }

    try {
      const res = await fetch(`${API}/admin/users/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setUsers((current) => current.map((user) => ((user.id || user._id) === editingId ? data : user)));
      cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (id) => {
    setError('');
    if (!token) {
      setError('Admin login required.');
      return;
    }
    if (!window.confirm('Delete this user account?')) return;

    try {
      const res = await fetch(`${API}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');
      setUsers((current) => current.filter((user) => (user.id || user._id) !== id));
      if (editingId === id) cancelEdit();
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
              {users.map((u) => {
                const id = u.id || u._id;
                const isEditing = editingId === id;
                const isCurrentAdmin = (currentUser?.id || currentUser?._id) === id;

                return (
                  <div key={id} className="py-3 space-y-3">
                    {isEditing ? (
                      <>
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            className="w-full px-4 py-3 rounded-xl border border-slate-200"
                            value={editForm.name}
                            onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}
                            placeholder="Name"
                          />
                          <input
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200"
                            value={editForm.email}
                            onChange={(e) => setEditForm((current) => ({ ...current, email: e.target.value }))}
                            placeholder="Email"
                          />
                          <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200"
                            value={editForm.password}
                            onChange={(e) => setEditForm((current) => ({ ...current, password: e.target.value }))}
                            placeholder="New password (leave blank to keep)"
                          />
                          <select
                            className="w-full px-4 py-3 rounded-xl border border-slate-200"
                            value={editForm.role}
                            onChange={(e) => setEditForm((current) => ({ ...current, role: e.target.value }))}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 rounded-full border border-slate-200 text-sm text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{u.name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-600">{u.role}</span>
                          <button
                            type="button"
                            onClick={() => beginEdit(u)}
                            className="px-3 py-2 text-xs rounded-full border border-slate-200 text-slate-700 hover:border-slate-300 inline-flex items-center gap-1"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(id)}
                            disabled={isCurrentAdmin}
                            className="px-3 py-2 text-xs rounded-full border border-red-200 text-red-600 hover:border-red-300 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminUsers;
