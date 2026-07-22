import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { API } from '../lib/api';

const emptyForm = { name: '', slug: '', image: '', description: '' };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');

  const token = (() => {
    try { return localStorage.getItem('admin_token'); } catch (e) { return null; }
  })();

  const load = async () => {
    const res = await fetch(`${API}/categories`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load categories');
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Admin login required.');
      return;
    }
    try {
      setError('');
      const res = await fetch(`${API}/categories${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');
      setForm(emptyForm);
      setEditingId('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (category) => {
    if (!token) return setError('Admin login required.');
    if (!window.confirm(`Delete ${category.name}?`)) return;
    try {
      const res = await fetch(`${API}/categories/${category._id || category.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id || category.id);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      image: category.image || '',
      description: category.description || '',
    });
  };

  return (
    <AdminLayout title="Categories" description="Add, edit, and organize product categories with optional images.">
      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border border-slate-200 px-4 py-3" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="Category name" />
          <input className="rounded-xl border border-slate-200 px-4 py-3" value={form.slug} onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value }))} placeholder="Slug, optional" />
          <input className="rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" value={form.image} onChange={(e) => setForm((v) => ({ ...v, image: e.target.value }))} placeholder="Category image URL" />
          <textarea className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 md:col-span-2" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} placeholder="Short description" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white" type="submit">
            <Plus size={16} /> {editingId ? 'Update category' : 'Add category'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const stored = Boolean(category._id);
          return (
            <div key={category._id || category.id || category.slug} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-50">
                {category.image ? <img src={category.image} alt={category.name} className="h-full w-full rounded-2xl object-cover" /> : <span className="text-sm text-slate-400">No image</span>}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{category.name}</h2>
              <p className="text-sm text-slate-500">{category.slug}</p>
              {category.description && <p className="mt-2 text-sm leading-6 text-slate-500">{category.description}</p>}
              <div className="mt-4 flex gap-2">
                <button disabled={!stored} onClick={() => startEdit(category)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40">
                  <Pencil size={15} /> Edit
                </button>
                <button disabled={!stored} onClick={() => remove(category)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 disabled:opacity-40">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
