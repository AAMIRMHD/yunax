import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const FeaturedProducts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error('Unable to load products');
        const data = await res.json();
        setItems((data || []).slice(0, 8));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-white via-[#f7f9ff] to-white" id="featured">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Curated Picks</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">Featured Products</h2>
            <p className="text-slate-600 max-w-2xl">Handpicked bestsellers across laptops, PCs, components, and accessories.</p>
          </div>
          <a href="/products" className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline">
            View all
          </a>
        </div>

        {loading && <p className="text-slate-600 text-sm">Loading products…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((p) => {
              const price = `₹${Math.round((p.priceCents || 0) / 100).toLocaleString('en-IN')}`;
              const thumb = p.images?.[0];
              return (
                <motion.div
                  key={p._id || p.id || p.slug || p.name}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                  onClick={() => p.slug && (window.location.href = `/products/${p.slug}`)}
                  className="cursor-pointer group border border-slate-200 rounded-2xl bg-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] flex flex-col gap-3 overflow-hidden"
                >
                  <div className="relative h-44 rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-200 overflow-hidden">
                    {thumb ? (
                      <img src={thumb} alt={p.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-slate-500 font-semibold">{p.name?.slice(0, 10) || 'Product'}</div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-slate-800 border border-slate-200 shadow-sm">
                      {p.category || 'Featured'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900 line-clamp-2">{p.name}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{p.description || p.category}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-slate-900">{price}</span>
                    <button
                      className="text-xs px-3 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        const raw = localStorage.getItem('cartItems');
                        const existing = raw ? JSON.parse(raw) : [];
                        const already = existing.find((i) => i.slug === p.slug);
                        if (already) already.qty = (already.qty || 1) + 1;
                        else
                          existing.push({
                            slug: p.slug,
                            productId: p._id || p.id,
                            name: p.name,
                            spec: p.description || p.category,
                            category: p.category,
                            priceCents: p.priceCents || 0,
                            qty: 1,
                          });
                        localStorage.setItem('cartItems', JSON.stringify(existing));
                        window.dispatchEvent(new Event('cart-updated'));
                      }}
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
