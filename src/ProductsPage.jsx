import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import Reveal from './components/motion/Reveal';
import { Heart, LayoutGrid, Search, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { API } from './lib/api';
import { defaultProducts } from './lib/defaultProducts';
import Tilt from './components/ui/Tilt';
import { addToWishlist, getAuthToken, loadWishlist, removeFromWishlist } from './lib/wishlist';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [wishlistSlugs, setWishlistSlugs] = useState([]);
  const [wishlistMessage, setWishlistMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        const nextProducts = Array.isArray(data) && data.length > 0 ? data : defaultProducts;
        setProducts(nextProducts);
      } catch (err) {
        setError('');
        setProducts(defaultProducts);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    loadWishlist()
      .then((items) => setWishlistSlugs(items.map((item) => item.slug)))
      .catch(() => {});
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

  const activeFilterCount = (activeCategory !== 'All' ? 1 : 0) + (sort !== 'featured' ? 1 : 0);

  const clearFilters = () => {
    setActiveCategory('All');
    setSort('featured');
  };

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

  const toggleWishlist = async (product) => {
    if (!getAuthToken()) {
      window.location.href = '/login';
      return;
    }
    try {
      const isSaved = wishlistSlugs.includes(product.slug);
      const nextItems = isSaved ? await removeFromWishlist(product.slug) : await addToWishlist(product);
      setWishlistSlugs(nextItems.map((item) => item.slug));
      setWishlistMessage(isSaved ? `${product.name} removed from wishlist.` : `${product.name} added to wishlist.`);
      window.setTimeout(() => setWishlistMessage(''), 1800);
    } catch (err) {
      setWishlistMessage(err.message || 'Could not update wishlist.');
      window.setTimeout(() => setWishlistMessage(''), 2200);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen selection:bg-primary/20">
      <Navbar />
      <main className="pt-24 pb-16 space-y-8 sm:pt-28 sm:space-y-10 lg:space-y-14">
        {/* Header Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end lg:gap-10">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8 }}
               className="space-y-3 sm:space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                <span className="w-1 h-1 rounded-full bg-primary" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Catalog</p>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">Products</span>
              </h1>
              <p className="max-w-xl text-sm font-medium leading-6 text-slate-500 sm:text-base sm:leading-relaxed">
                The world's most powerful components, curated for professionals.
              </p>
            </motion.div>
            
          </div>
        </section>

        {/* Search & Sort Bar */}
        <section className="sticky top-20 z-30 mx-auto max-w-7xl px-4 sm:top-24 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.5rem] border border-slate-200 bg-white/95 p-1.5 shadow-xl shadow-slate-200/40 backdrop-blur-xl sm:rounded-3xl sm:p-3"
          >
            <div className="flex items-center gap-2 lg:grid lg:grid-cols-[minmax(220px,1fr),auto,auto] lg:gap-3">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 sm:left-4" size={16} />
                <input
                  type="text"
                  placeholder="Search hardware..."
                  className="min-h-10 w-full rounded-full border border-transparent bg-slate-50 py-2 pl-10 pr-3 text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-primary/20 focus:bg-white sm:min-h-12 sm:rounded-2xl sm:py-3 sm:pl-11 sm:pr-4 sm:text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              <button
                type="button"
                onClick={() => setCategoriesOpen(true)}
                aria-label="Open product categories"
                className={`relative flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider transition-all sm:h-11 sm:min-w-[132px] sm:px-4 sm:text-xs lg:rounded-xl ${
                  activeCategory !== 'All'
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                    : 'border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200/60'
                }`}
              >
                <LayoutGrid size={15} />
                <span className="sm:hidden">Cat</span>
                <span className="hidden sm:inline">Categories</span>
                {activeCategory !== 'All' && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[9px] leading-none text-white sm:static sm:h-5 sm:min-w-5 sm:border-0 sm:bg-white/20 sm:text-[10px]">
                    1
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-label="Open product filters"
                className={`relative flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wider transition-all lg:hidden ${
                  sort !== 'featured'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                    : 'border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-200/60'
                }`}
              >
                <SlidersHorizontal size={15} />
                <span>Filter</span>
                {sort !== 'featured' && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-primary px-1 text-[9px] leading-none text-white">
                    1
                  </span>
                )}
              </button>

              <label className="relative hidden w-full lg:block lg:w-auto">
                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="min-h-11 w-full cursor-pointer appearance-none rounded-xl border border-transparent bg-slate-50 py-2 pl-10 pr-8 text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none lg:w-auto"
                >
                  <option value="featured">Featured</option>
                  <option value="priceAsc">Price low to high</option>
                  <option value="priceDesc">Price high to low</option>
                </select>
              </label>
            </div>
          </motion.div>
        </section>

        {categoriesOpen && (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              aria-label="Close categories"
              className="absolute inset-0 bg-slate-950/40"
              onClick={() => setCategoriesOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:bottom-6 sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2 sm:rounded-3xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Categories</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Choose a category</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    {filtered.length} product{filtered.length === 1 ? '' : 's'} shown
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoriesOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                  aria-label="Close categories"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((label) => {
                  const active = activeCategory === label;
                  const count = label === 'All' ? products.length : products.filter((product) => product.category === label).length;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setActiveCategory(label);
                        setCategoriesOpen(false);
                      }}
                      className={`min-h-[64px] rounded-2xl border px-3 py-3 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                          : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span className="block text-xs font-black uppercase tracking-wider">{label}</span>
                      <span className={`mt-1 block text-[11px] font-semibold ${active ? 'text-white/80' : 'text-slate-400'}`}>
                        {count} item{count === 1 ? '' : 's'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-slate-950/40"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Filters</p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">Find products faster</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-900">Category</p>
                  <button
                    type="button"
                    onClick={() => {
                      setFiltersOpen(false);
                      setCategoriesOpen(true);
                    }}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Open categories
                  </button>
                </div>

                <div>
                  <p className="mb-3 text-sm font-bold text-slate-900">Sort by</p>
                  <div className="grid gap-2">
                    {[
                      ['featured', 'Featured'],
                      ['priceAsc', 'Price low to high'],
                      ['priceDesc', 'Price high to low'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSort(value)}
                        className={`min-h-11 rounded-xl px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                          sort === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="min-h-11 rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20"
                >
                  Show products
                </button>
              </div>
            </motion.div>
          </div>
        )}


        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
               {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                 <div key={i} className="h-[280px] rounded-2xl bg-slate-50 animate-shimmer sm:h-[420px]" />
               ))}
            </div>
          )}
          
          {error && <p className="text-red-600 font-bold bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center">{error}</p>}
          {wishlistMessage && (
            <div className="mb-4 rounded-[18px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {wishlistMessage}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="space-y-5 py-20 text-center sm:space-y-6 sm:py-24">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 opacity-50 sm:h-20 sm:w-20 sm:rounded-3xl">
                 <Search size={32} className="text-slate-300" />
              </div>
              <p className="text-lg font-bold uppercase tracking-widest text-slate-900 sm:text-xl">No Matches Found</p>
              <p className="mx-auto max-w-sm text-sm font-medium leading-6 text-slate-500 sm:text-base">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
          )}
 
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.08 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.05 }
              }
            }}
            className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filtered.map((product) => {
              const price = `₹${Math.round((product.priceCents || 0) / 100).toLocaleString('en-IN')}`;
              const thumb = product.images?.[0];
              const stock = product.stock ?? null;
              const isWishlisted = wishlistSlugs.includes(product.slug);
              
              return (
                <motion.div
                  key={product._id || product.id || product.slug || product.name}
                  variants={{
                    hidden: { opacity: 0, y: 28, scale: 0.96 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  onClick={() => product.slug && (window.location.href = `/products/${product.slug}`)}
                  className="group relative min-w-0"
                >
                  <Tilt maxRotation={8} className="h-full">
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-500 hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/5 h-full flex flex-col">
                      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-slate-50/50 p-3 sm:h-60 sm:p-7 lg:h-64 lg:p-8">
                        {thumb ? (
                          <motion.img 
                            whileHover={{ scale: 1.08 }}
                            src={thumb} alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500" 
                          />
                        ) : (
                          <div className="text-3xl font-black text-slate-200">{product.name?.slice(0, 2)}</div>
                        )}
                        
                        <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
                          <div className="max-w-[112px] rounded-lg border border-slate-100 bg-white/90 px-2 py-1 shadow-sm sm:max-w-none">
                             <p className="truncate text-[8px] font-black uppercase tracking-wider text-primary sm:text-[9px] sm:tracking-widest">{product.category || 'Elite'}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                          className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition sm:right-4 sm:top-4 ${
                            isWishlisted ? 'border-rose-100 text-rose-600' : 'border-slate-100 text-slate-500 hover:text-rose-600'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                        >
                          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-slate-900 transition-colors group-hover:text-primary sm:min-h-0 sm:text-base sm:leading-normal sm:line-clamp-1">{product.name}</h3>
                          <p className="text-slate-400 text-[11px] font-medium tracking-tight line-clamp-1">{product.description || product.category}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3 sm:gap-3">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Price</p>
                            <p className="text-base font-black text-slate-900 sm:text-lg">{price}</p>
                          </div>
                          
                          <button
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 transition-colors hover:bg-primary sm:h-11 sm:w-11"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                          >
                            <ShoppingCart size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Tilt>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductsPage;
