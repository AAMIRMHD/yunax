import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'https://yunax.onrender.com';

const emptyProduct = {
  name: '',
  slug: '',
  category: '',
  priceCents: '',
  stock: '',
  images: [''],
  description: '',
};

const AdminManagePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState('');
  const [editForm, setEditForm] = useState(emptyProduct);
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
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key, value) => {
    if (key === 'images') {
      setForm((f) => ({ ...f, images: [value] }));
    } else {
      setForm((f) => ({ ...f, [key]: value }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Admin login required.');
      return;
    }
    try {
      const body = {
        ...form,
        priceCents: Math.round(Number(form.priceCents || 0)),
        stock: Number(form.stock || 0),
        images: form.images.filter(Boolean),
      };
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setProducts((p) => [data, ...p]);
      setForm(emptyProduct);
    } catch (err) {
      setError(err.message);
    }
  };

  const beginEdit = (product) => {
    setEditingId(product._id || product.id);
    setEditForm({
      name: product.name || '',
      slug: product.slug || '',
      category: product.category || '',
      priceCents: product.priceCents ?? '',
      stock: product.stock ?? '',
      images: [product.images?.[0] || ''],
      description: product.description || '',
    });
  };

  const handleEditChange = (key, value) => {
    if (key === 'images') {
      setEditForm((f) => ({ ...f, images: [value] }));
    } else {
      setEditForm((f) => ({ ...f, [key]: value }));
    }
  };

  const saveEdit = async () => {
    if (!token) {
      setError('Admin login required.');
      return;
    }
    try {
      const body = {
        ...editForm,
        priceCents: Math.round(Number(editForm.priceCents || 0)),
        stock: Number(editForm.stock || 0),
        images: editForm.images.filter(Boolean),
      };
      const res = await fetch(`${API}/products/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setProducts((p) => p.map((item) => ((item._id || item.id) === editingId ? data : item)));
      setEditingId('');
      setEditForm(emptyProduct);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditForm(emptyProduct);
  };

  const deleteProduct = async (id) => {
    if (!token) {
      setError('Admin login required.');
      return;
    }
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      setProducts((p) => p.filter((item) => (item._id || item.id) !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16 space-y-10 max-w-6xl mx-auto px-6">
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Admin</p>
          <h1 className="text-3xl font-semibold">Catalog Manager</h1>
          <p className="text-slate-600">Add products or review the latest items. Admin token required for create.</p>
        </motion.div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <section className="glass border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Add Product</h2>
          <form className="grid md:grid-cols-2 gap-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Name</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Category</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="e.g. Laptops"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Slug (unique)</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="yunax-pro-15"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Price (in cents)</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={form.priceCents}
                onChange={(e) => handleChange('priceCents', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Stock</label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Image URL</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={form.images[0]}
                onChange={(e) => handleChange('images', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-slate-600">Description</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70"
                disabled={!token}
              >
                {token ? 'Create Product' : 'Login as Admin to Create'}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{products.length} items</span>
          </div>
          {loading ? (
            <p className="text-slate-600 text-sm">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const id = p._id || p.id;
                const editing = editingId === id;
                return (
                  <div key={id} className="border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                    {editing ? (
                      <>
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          value={editForm.name}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          value={editForm.slug}
                          onChange={(e) => handleEditChange('slug', e.target.value)}
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          value={editForm.category}
                          onChange={(e) => handleEditChange('category', e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          value={editForm.priceCents}
                          onChange={(e) => handleEditChange('priceCents', e.target.value)}
                        />
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          value={editForm.stock}
                          onChange={(e) => handleEditChange('stock', e.target.value)}
                        />
                        <input
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          value={editForm.images[0]}
                          onChange={(e) => handleEditChange('images', e.target.value)}
                        />
                        <textarea
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                          rows={2}
                          value={editForm.description}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                        />
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-2 text-xs rounded-full bg-slate-900 text-white hover:bg-slate-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-2 text-xs rounded-full border border-slate-200 text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate">{p.category}</div>
                        <div className="text-xs text-slate-500 truncate">Slug: {p.slug}</div>
                        <div className="text-xs text-slate-500">Stock: {p.stock ?? 0}</div>
                        <div className="text-sm font-semibold text-slate-900">₹{((p.priceCents || 0) / 100).toFixed(0)}</div>
                        {p.images?.[0] ? (
                          <div className="h-24 rounded-xl overflow-hidden bg-slate-100">
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => beginEdit(p)}
                            className="px-3 py-2 text-xs rounded-full border border-slate-200 text-slate-700 hover:border-slate-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProduct(id)}
                            className="px-3 py-2 text-xs rounded-full border border-red-200 text-red-600 hover:border-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminManagePage;
