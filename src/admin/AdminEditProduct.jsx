import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
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

const AdminEditProduct = () => {
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const productId = window.location.pathname.split('/').pop();

  const token = (() => {
    try {
      return localStorage.getItem('admin_token');
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('No product ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${API}/products/id/${productId}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          category: data.category || '',
          priceCents: Number(data.priceCents || 0) / 100,
          stock: data.stock || '',
          images: Array.isArray(data.images) ? data.images : [],
          description: data.description || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addImageUrl = () => {
    if (!imageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl('');
  };

  const removeImage = (index) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!token) {
      setError('Admin login required.');
      setSaving(false);
      return;
    }

    try {
      const body = {
        ...form,
        priceCents: Math.round(Number(form.priceCents || 0) * 100),
        stock: Number(form.stock || 0),
        images: form.images.filter(Boolean),
      };

      const res = await fetch(`${API}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update product');

      // Success
      window.location.href = '/admin/products';
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Product" description="Loading product details details...">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-slate-400" size={48} />
          <p className="text-slate-500 font-medium">Fetching technical specifications...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Product" description={`Modifying specifications for ${form.name}`}>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => window.location.href = '/admin/products'}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Products
        </button>

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Technical Update</h2>
              <p className="text-sm text-slate-500 mt-1">Review and modify the hardware details below.</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
              <Save size={24} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Basic Information</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Product Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. YunaX Ultra Pro 15"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all bg-white"
                    value={form.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Slug (Unique Identifier)</label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                    value={form.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="yunax-ultra-pro-15"
                    required
                  />
                </div>
              </div>

              {/* Inventory & Pricing */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Inventory & Pricing</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Price (INR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                      value={form.priceCents}
                      onChange={(e) => handleChange('priceCents', e.target.value)}
                      placeholder="999"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">Current: ₹{Number(form.priceCents || 0).toFixed(2)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Stock Quantity</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                    value={form.stock}
                    onChange={(e) => handleChange('stock', e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Specifications</h3>
                <label className="text-sm font-bold text-slate-700">Product Description</label>
                <textarea
                  className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                  rows={4}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detail the technical specs and features..."
                />
              </div>

              {/* Media */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Product Media</h3>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter Image URL (e.g. https://...)"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                  >
                    Add
                  </button>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="group relative aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => window.location.href = '/admin/products'}
                className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
              >
                {saving ? 'Saving...' : 'Save Specifications'}
                {!saving && <Save size={18} />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminEditProduct;
