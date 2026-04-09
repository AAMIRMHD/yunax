import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Star, User } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const demoProducts = [
  {
    name: 'AuraBook 14 Pro',
    slug: 'demo-aurabook-14-pro',
    category: 'Laptops',
    priceCents: 129900,
    stock: 8,
    featured: true,
    description: '14" QHD, Ryzen 7, 16GB, 1TB NVMe, RTX 4060.',
    images: [],
  },
  {
    name: 'Titan 15 Gaming',
    slug: 'demo-titan-15-gaming',
    category: 'Laptops',
    priceCents: 118500,
    stock: 12,
    description: '15.6" 165Hz, Intel i7, 32GB RAM, 1TB NVMe, RTX 4070.',
    images: [],
  },
  {
    name: 'Inferno RTX Station',
    slug: 'demo-inferno-rtx-station',
    category: 'Gaming',
    priceCents: 189900,
    stock: 4,
    featured: true,
    description: 'i7 14700K, RTX 4080 Super, 32GB DDR5, 2TB NVMe.',
    images: [],
  },
  {
    name: 'Helios 27" QHD 165Hz',
    slug: 'demo-helios-27q',
    category: 'Gaming',
    priceCents: 29900,
    stock: 16,
    description: 'IPS, 165Hz, HDR400, USB-C 65W, height adjustable.',
    images: [],
  },
  {
    name: 'AeroMesh AXE Router',
    slug: 'demo-aeromesh-axe',
    category: 'Networking Products',
    priceCents: 18900,
    stock: 14,
    description: 'Tri-band Wi‑Fi 6E, 2.5G WAN/LAN, mesh ready.',
    images: [],
  },
  {
    name: 'NovaX 2TB NVMe Gen4',
    slug: 'demo-novax-2tb',
    category: 'SSD / HDD',
    priceCents: 16900,
    stock: 22,
    description: 'PCIe 4.0, 7400/6800 MBps, DRAM cache, 5-year warranty.',
    images: [],
  },
  {
    name: 'Flux TKL Wireless',
    slug: 'demo-flux-tkl',
    category: 'Accessories',
    priceCents: 8900,
    stock: 30,
    description: 'Tri-mode hot-swap mechanical, PBT keycaps, per-key RGB.',
    images: [],
  },
  {
    name: 'Glide Pro Wireless Mouse',
    slug: 'demo-glide-pro',
    category: 'Accessories',
    priceCents: 6200,
    stock: 40,
    description: '55g lightweight, PixArt 3395, 4K polling ready, USB-C.',
    images: [],
  },
  {
    name: 'CorePower 850W Platinum',
    slug: 'demo-corepower-850w',
    category: 'Power Supply (SMPS)',
    priceCents: 12400,
    stock: 18,
    description: 'Fully modular, 80+ Platinum, 10-year warranty.',
    images: [],
  },
  {
    name: 'Pulse ANC Studio Headset',
    slug: 'demo-pulse-anc',
    category: 'Headphones',
    priceCents: 12900,
    stock: 25,
    description: 'Hybrid ANC, LDAC, dual mics, 40mm drivers, 50h battery.',
    images: [],
  },
  {
    name: 'Nebula Mini Workstation',
    slug: 'demo-nebula-mini',
    category: 'Desktop PCs',
    priceCents: 154900,
    stock: 6,
    description: 'ITX, Ryzen 9, 32GB DDR5, 2TB Gen4 NVMe, RTX 4070 Super.',
    images: [],
  },
  {
    name: 'Vega X 7800 XT',
    slug: 'demo-vega-7800xt',
    category: 'Graphics Cards',
    priceCents: 54900,
    stock: 14,
    description: '16GB GDDR6, dual-fan, PCIe 4.0, ideal for 1440p high refresh.',
    images: [],
  },
];

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        const base = Array.isArray(data) ? data : [];

        // Map for quick slug lookup to avoid duplicates
        const slugSet = new Set(base.map((p) => p.slug));

        // Ensure each key category has at least 4 items by appending demo fillers
        const ensureCategoryMin = (category, min = 8) => {
          let count = base.filter((p) => p.category === category).length;
          if (count >= min) return;
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

        setProducts(base.length ? base : demoProducts.slice(0, 12));
      } catch (err) {
        setError(err.message);
        setProducts(demoProducts.slice(0, 12)); // fallback to demo
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
    return ['All', ...unique];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchQuery =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });

    const sorters = {
      featured: (a, b) => (b.featured === true) - (a.featured === true),
      priceAsc: (a, b) => (a.priceCents || 0) - (b.priceCents || 0),
      priceDesc: (a, b) => (b.priceCents || 0) - (a.priceCents || 0),
      newest: (a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0),
    };
    return [...list].sort(sorters[sort] || sorters.featured);
  }, [products, activeCategory, query, sort]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((p) => {
      const key = p.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const addToCart = (product) => {
    try {
      const raw = localStorage.getItem('cartItems');
      const existing = raw ? JSON.parse(raw) : [];
      const already = existing.find((i) => i.slug === product.slug);
      if (already) {
        already.qty = (already.qty || 1) + 1;
      } else {
        existing.push({
          slug: product.slug,
          name: product.name,
          spec: product.description || product.category,
          category: product.category,
          priceCents: product.priceCents || 0,
          qty: 1,
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(existing));
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-20 pb-16 space-y-10 bg-white">
        <section className="max-w-6xl mx-auto px-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Shop</p>
              <h1 className="text-3xl font-semibold text-slate-900">Products</h1>
              <p className="text-slate-600">Browse laptops, PCs, components, and accessories.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => (localStorage.getItem('token') ? (window.location.href = '/cart') : (window.location.href = '/login'))}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm bg-white"
              >
                <ShoppingCart size={16} /> Cart
              </button>
              <button
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (token) window.location.href = '/account';
                  else window.location.href = '/login';
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-800 hover:border-slate-300 shadow-sm bg-white"
              >
                <User size={16} /> Account
              </button>
            </div>
          </div>

          <motion.div
            className="border border-slate-200 rounded-2xl p-4 shadow-sm bg-white flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search GPUs, laptops, components, accessories"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-slate-300 outline-none text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">Sort</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white text-slate-900 border border-slate-200 text-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 items-center overflow-x-auto no-scrollbar py-1">
              {categories.map((label) => {
                const active = activeCategory === label;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveCategory(label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm whitespace-nowrap transition ${
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-6 space-y-10">
          {loading && <p className="text-slate-600 text-sm">Loading…</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!loading && !error && grouped.length === 0 && <p className="text-slate-600 text-sm">No products found.</p>}

          {grouped.map(([label, items]) => (
            <motion.div
              key={label}
              className="space-y-4"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{label}</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{items.length} picks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
                {items.slice(0, 8).map((product) => {
                  const price = `₹${Math.round((product.priceCents || 0) / 100).toLocaleString('en-IN')}`;
                  const thumb = product.images?.[0];
                  const stock = product.stock ?? null;
                  return (
                    <div
                      key={product._id || product.id || product.slug || product.name}
                      onClick={() => product.slug && (window.location.href = `/products/${product.slug}`)}
                      className="relative border border-slate-200 rounded-2xl bg-white p-4 shadow-sm flex flex-col gap-3 hover:-translate-y-1 hover:shadow-md transition cursor-pointer overflow-hidden"
                    >
                      <div className="relative h-44 rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-200 overflow-hidden flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 text-slate-500 font-semibold grid place-items-center shadow-inner">
                              {product.name?.slice(0, 2)?.toUpperCase() || '—'}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-slate-800 border border-slate-200 shadow-sm">{product.category || 'Featured'}</div>
                        {product.featured && (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-sm">
                            <Star size={12} /> Featured
                          </div>
                        )}
                      </div>

                      <div className="relative space-y-1">
                        <div className="font-semibold text-slate-900 leading-tight line-clamp-2">{product.name}</div>
                        <div className="text-sm text-slate-600 line-clamp-2">{product.description || product.category}</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-lg font-semibold text-slate-900">{price}</div>
                          {stock !== null && (
                            <div className={`text-xs ${stock > 5 ? 'text-emerald-600' : stock > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {stock > 5 ? 'In stock' : stock > 0 ? `${stock} left` : 'Restocking'}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="text-xs px-3 py-2 rounded-full border border-slate-200 text-slate-800 hover:border-slate-300 bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/products/${product.slug}`;
                            }}
                          >
                            View
                          </button>
                          <button
                            className="text-xs px-3 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
