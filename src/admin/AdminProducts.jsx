import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const categoryOptions = [
  'Laptops',
  'Accessories',
  'Headphones',
  'Graphics Cards',
  'Networking Products',
  'Gaming',
  'Desktop PCs',
  'SSD / HDD',
  'Power Supply (SMPS)',
];

const demoProducts = [
  { name: 'AuraBook 14 Pro', slug: 'demo-aurabook-14-pro', category: 'Laptops', priceCents: 129900, stock: 8, description: '14\" QHD, Ryzen 7, 16GB, 1TB NVMe, RTX 4060.', images: [], demo: false },
  { name: 'Titan 15 Gaming', slug: 'demo-titan-15-gaming', category: 'Laptops', priceCents: 118500, stock: 12, description: '15.6\" 165Hz, i7, 32GB, 1TB NVMe, RTX 4070.', images: [], demo: false },
  { name: 'Inferno RTX Station', slug: 'demo-inferno-rtx-station', category: 'Gaming', priceCents: 189900, stock: 4, description: 'i7 14700K, RTX 4080 Super, 32GB DDR5.', images: [], demo: false },
  { name: 'Helios 27Q 165Hz', slug: 'demo-helios-27q', category: 'Gaming', priceCents: 29900, stock: 16, description: '27\" QHD 165Hz IPS.', images: [], demo: false },
  { name: 'Nebula Mini Workstation', slug: 'demo-nebula-mini', category: 'Desktop PCs', priceCents: 154900, stock: 6, description: 'ITX, Ryzen 9, RTX 4070 Super.', images: [], demo: false },
  { name: 'Vega X 7800 XT', slug: 'demo-vega-7800xt', category: 'Graphics Cards', priceCents: 54900, stock: 14, description: '16GB, 1440p high refresh.', images: [], demo: false },
  { name: 'Flux TKL Wireless', slug: 'demo-flux-tkl', category: 'Accessories', priceCents: 8900, stock: 30, description: 'Tri-mode mechanical, PBT.', images: [], demo: false },
  { name: 'AeroMesh AXE Router', slug: 'demo-aeromesh-axe', category: 'Networking Products', priceCents: 18900, stock: 14, description: 'Wi‑Fi 6E tri-band.', images: [], demo: false },
  { name: 'NovaX 2TB Gen4', slug: 'demo-novax-2tb', category: 'SSD / HDD', priceCents: 16900, stock: 22, description: 'PCIe 4.0 NVMe.', images: [], demo: false },
  { name: 'CorePower 850W Platinum', slug: 'demo-corepower-850w', category: 'Power Supply (SMPS)', priceCents: 12400, stock: 18, description: 'Fully modular 80+ Platinum.', images: [], demo: false },
];

const emptyProduct = {
  name: '',
  slug: '',
  category: '',
  priceCents: '',
  stock: '',
  images: [''],
  description: '',
};

const AdminProducts = () => {
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
        const apiData = await res.json();
        const base = Array.isArray(apiData) ? [...apiData] : [];
        const slugSet = new Set(base.map((p) => p.slug));

        const ensureCategoryMin = (category, min = 8) => {
          let count = base.filter((p) => p.category === category).length;
          const pool = demoProducts.filter((p) => p.category === category);
          let idx = 0;
          while (count < min && pool.length) {
            const template = pool[idx % pool.length];
            const clone = {
              ...template,
              slug: `${template.slug}-demo-${count}`,
              name: `${template.name} (Demo ${count + 1})`,
              _id: `${template.slug}-demo-${count}`,
              id: `${template.slug}-demo-${count}`,
              demo: false, // allow edit/delete
            };
            if (!slugSet.has(clone.slug)) {
              slugSet.add(clone.slug);
              base.push(clone);
              count += 1;
            }
            idx += 1;
          }
        };

        ['Laptops', 'Gaming', 'Desktop PCs', 'Graphics Cards', 'Accessories', 'Networking Products', 'SSD / HDD', 'Power Supply (SMPS)'].forEach((cat) =>
          ensureCategoryMin(cat)
        );

        setProducts(base.length ? base : demoProducts.map((p, i) => ({ ...p, _id: p.slug + '-demo-' + i, demo: true })));
      } catch (err) {
        setError(err.message);
        setProducts(demoProducts.map((p, i) => ({ ...p, _id: p.slug + '-demo-' + i, demo: true })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key, value) => {
    setForm((f) => (key === 'images' ? { ...f, images: [value] } : { ...f, [key]: value }));
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
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }
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
    setEditForm((f) => (key === 'images' ? { ...f, images: [value] } : { ...f, [key]: value }));
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
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return;
      }
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
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error(data.error || 'Failed to delete');
      }
      setProducts((p) => p.filter((item) => (item._id || item.id) !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Products" description="Create, edit, and organize the YunaX catalog.">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <section className="border border-slate-200 bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">New Item</p>
            <h2 className="text-lg font-semibold">Create product</h2>
          </div>
          <div className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs inline-flex items-center gap-1">
            <Plus size={14} /> Quick Add
          </div>
        </div>
        <form className="grid md:grid-cols-3 gap-4" onSubmit={handleCreate}>
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
              list="admin-category-options"
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Choose or type"
              required
            />
            <datalist id="admin-category-options">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Slug</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              value={form.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="yunax-pro-15"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Price (cents)</label>
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
          <div className="md:col-span-3 space-y-2">
            <label className="text-sm text-slate-600">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
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
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Catalog</p>
            <h2 className="text-lg font-semibold">Products ({products.length})</h2>
          </div>
        </div>
        {loading ? (
          <p className="text-slate-600 text-sm">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {products.map((p) => {
              const id = p._id || p.id;
              const editing = editingId === id;
              return (
                <div key={id} className="border border-slate-200 rounded-2xl bg-white shadow-sm p-4 space-y-2">
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
                        <button onClick={saveEdit} className="px-3 py-2 text-xs rounded-full bg-slate-900 text-white hover:bg-slate-800">
                          Save
                        </button>
                        <button onClick={cancelEdit} className="px-3 py-2 text-xs rounded-full border border-slate-200 text-slate-700">
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-32 rounded-xl overflow-hidden bg-slate-100">
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 truncate">{p.category}</div>
                      <div className="text-xs text-slate-500 truncate">Slug: {p.slug}</div>
                      <div className="text-xs text-slate-500">Stock: {p.stock ?? 0}</div>
                      <div className="text-sm font-semibold text-slate-900">₹{((p.priceCents || 0) / 100).toFixed(0)}</div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => beginEdit(p)}
                          className="px-3 py-2 text-xs rounded-full border border-slate-200 text-slate-700 hover:border-slate-300 inline-flex items-center gap-1"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(id)}
                          className="px-3 py-2 text-xs rounded-full border border-red-200 text-red-600 hover:border-red-300 inline-flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
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
    </AdminLayout>
  );
};

export default AdminProducts;
