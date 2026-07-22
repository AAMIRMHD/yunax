import { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { API } from '../lib/api';
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

const emptyProduct = {
  name: '',
  slug: '',
  category: '',
  priceCents: '',
  stock: '',
  images: [],
  description: '',
};

const priceBands = [
  { value: 'all', label: 'All prices' },
  { value: 'budget', label: 'Under Rs 10,000' },
  { value: 'mid', label: 'Rs 10,000 - 50,000' },
  { value: 'premium', label: 'Above Rs 50,000' },
];

const matchesPriceBand = (priceCents, band) => {
  const price = Number(priceCents || 0) / 100;
  if (band === 'budget') return price < 10000;
  if (band === 'mid') return price >= 10000 && price <= 50000;
  if (band === 'premium') return price > 50000;
  return true;
};

const readFilesAsDataUrls = async (files) => {
  const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));

  return Promise.all(
    imageFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );
};

const createProductDraft = (product = {}) => ({
  name: product.name || '',
  slug: product.slug || '',
  category: product.category || '',
  priceCents: product.priceCents ?? '',
  stock: product.stock ?? '',
  images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
  description: product.description || '',
});

const ImagePicker = ({ images, onAddFiles, onAddUrl, onRemoveImage, inputIdPrefix }) => {
  const photoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [urlValue, setUrlValue] = useState('');

  const submitUrl = () => {
    const nextUrl = urlValue.trim();
    if (!nextUrl) return;
    onAddUrl(nextUrl);
    setUrlValue('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-slate-300"
        >
          Choose Photos
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-slate-300"
        >
          Browse Files
        </button>
        <span className="self-center text-xs text-slate-500">
          Mobile devices may open the gallery automatically.
        </span>
      </div>

      <input
        ref={photoInputRef}
        id={`${inputIdPrefix}-photos`}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          onAddFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={fileInputRef}
        id={`${inputIdPrefix}-files`}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          onAddFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="flex gap-2">
        <input
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200"
          value={urlValue}
          onChange={(event) => setUrlValue(event.target.value)}
          placeholder="Paste image URL"
        />
        <button
          type="button"
          onClick={submitUrl}
          className="px-4 py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
        >
          Add URL
        </button>
      </div>

      {images.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
              <div className="aspect-square bg-slate-100">
                <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="w-full px-3 py-2 text-xs rounded-full border border-red-200 text-red-600 hover:border-red-300"
                >
                  Remove photo
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No product photos added yet.
        </div>
      )}
    </div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');

  const token = (() => {
    try {
      return localStorage.getItem('admin_token');
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const apiData = await res.json();
        setProducts(Array.isArray(apiData) ? apiData : []);
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddProduct = () => {
    window.location.href = '/admin/products/add';
  };

  const handleEdit = (id) => {
    window.location.href = `/admin/products/edit/${id}`;
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
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/admin/login';
          return;
        }
        throw new Error(data.error || 'Failed to delete');
      }
      setProducts((p) => p.filter((item) => (item._id || item.id) !== id));
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const categoryChoices = ['All', ...Array.from(new Set([...categoryOptions, ...products.map((product) => product.category).filter(Boolean)])).sort()];

  const filteredProducts = products.filter((product) => {
    const text = search.trim().toLowerCase();
    const matchesSearch =
      !text ||
      product.name?.toLowerCase().includes(text) ||
      product.slug?.toLowerCase().includes(text) ||
      product.description?.toLowerCase().includes(text);
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory && matchesPriceBand(product.priceCents, priceFilter);
  });

  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.includes(product._id || product.id));

  const toggleSelect = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredProducts.map((product) => product._id || product.id);
    setSelectedIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const applyBulkChanges = async () => {
    if (!token) {
      setError('Admin login required.');
      return;
    }
    if (!selectedIds.length) {
      setError('Select at least one product to modify.');
      return;
    }
    if (!bulkCategory && !bulkPrice) {
      setError('Choose a category or set a new price before applying changes.');
      return;
    }

    try {
      setError('');
      const nextPriceCents = bulkPrice ? Math.round(Number(bulkPrice) * 100) : null;
      const selectedProducts = products.filter((product) => selectedIds.includes(product._id || product.id));

      for (const product of selectedProducts) {
        const id = product._id || product.id;
        const payload = {
          ...product,
          category: bulkCategory || product.category,
          priceCents: nextPriceCents ?? product.priceCents,
        };

        const res = await fetch(`${API}/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to update ${product.name}`);
        setProducts((current) => current.map((item) => (((item._id || item.id) === id) ? data : item)));
      }

      setBulkCategory('');
      setBulkPrice('');
      setSelectedIds([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSelectedProducts = async () => {
    if (!token) {
      setError('Admin login required.');
      return;
    }
    if (!selectedIds.length) {
      setError('Select at least one product to delete.');
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;

    try {
      setError('');
      const selectedProducts = products.filter((product) => selectedIds.includes(product._id || product.id));

      for (const product of selectedProducts) {
        const id = product._id || product.id;

        const res = await fetch(`${API}/products/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to delete ${product.name}`);
        }
        setProducts((current) => current.filter((item) => (item._id || item.id) !== id));
      }

      setSelectedIds([]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Products" description="Create, edit, and organize the YunaX catalog.">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <section className="flex items-center justify-between gap-6 bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-slate-200">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Expand the Inventory</h2>
          <p className="text-slate-400 text-sm max-w-md">Register new high-performance hardware and elite tech gear to the YunaX catalog.</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} /> Add New Product
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Catalog</p>
            <h2 className="text-lg font-semibold">Products ({filteredProducts.length} of {products.length})</h2>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Search products</label>
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, slug, description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Category filter</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categoryChoices.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Price filter</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                {priceBands.map((band) => (
                  <option key={band.value} value={band.value}>
                    {band.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Select visible</label>
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-900 text-white hover:bg-slate-800"
              >
                {allVisibleSelected ? 'Unselect all' : 'Select all'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto] items-end">
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Bulk category update</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
              >
                <option value="">Keep current category</option>
                {categoryChoices.filter((option) => option !== 'All').map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Bulk price set (INR)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-slate-200"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Leave empty to keep price"
              />
            </div>
            <button
              type="button"
              onClick={applyBulkChanges}
              className="px-5 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70"
              disabled={!selectedIds.length}
            >
              Modify selected ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={deleteSelectedProducts}
              className="px-5 py-3 rounded-full border border-red-200 text-red-600 hover:border-red-300 disabled:opacity-70"
              disabled={!selectedIds.length}
            >
              Delete selected
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-slate-600 text-sm">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const id = p._id || p.id;
              const selected = selectedIds.includes(id);
              return (
                <div key={id} className={`border rounded-2xl bg-white shadow-sm p-4 space-y-2 ${selected ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(id)}
                      />
                      Select
                    </label>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{p.category}</span>
                  </div>
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-100">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">Slug: {p.slug}</div>
                  <div className="text-xs text-slate-500">Stock: {p.stock ?? 0}</div>
                  <div className="text-sm font-semibold text-slate-900">₹{((p.priceCents || 0) / 100).toFixed(0)}</div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(id)}
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
