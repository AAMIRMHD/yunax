import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { API } from './lib/api';
import { defaultProducts, findDefaultProductBySlug } from './lib/defaultProducts';
import { addToWishlist, getAuthToken, loadWishlist, removeFromWishlist } from './lib/wishlist';

const specLabels = {
  brand: 'Brand',
  series: 'Series',
  model: 'Model',
  processor: 'Processor',
  graphics: 'Graphics',
  display: 'Display',
  memory: 'Memory',
  storage: 'Storage',
  operatingSystem: 'Operating System',
  wireless: 'Wireless',
  battery: 'Battery',
  ports: 'Ports',
  cooling: 'Cooling',
  keyboard: 'Keyboard',
  audio: 'Audio',
  weight: 'Weight',
  build: 'Build',
  durability: 'Durability',
  design: 'Design',
  usage: 'Best For',
};

const ProductDetailPage = ({ slug }) => {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRotateMode, setIsRotateMode] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [wishlistSlugs, setWishlistSlugs] = useState([]);

  const enrichProduct = (item) => ({
    ...item,
    priceDisplay:
      item.currency === 'INR' || !item.currency
        ? `₹${Math.round((item.priceCents || 0) / 100).toLocaleString('en-IN')}`
        : item.priceCents,
  });

  const fillRelatedProducts = (baseProduct, items) => {
    const normalizedItems = Array.isArray(items) ? items : [];
    const matching = normalizedItems.filter(
      (item) => item.category === baseProduct.category && item.slug !== baseProduct.slug
    );
    return matching.slice(0, 4);
  };

  const addProductToCart = (item) => {
    try {
      const raw = localStorage.getItem('cartItems');
      const existing = raw ? JSON.parse(raw) : [];
      const already = existing.find((entry) => entry.slug === item.slug);
      if (already) {
        already.qty = (already.qty || 1) + 1;
      } else {
        existing.push({
          slug: item.slug,
          productId: item._id || item.id,
          name: item.name,
          spec: item.description || item.category,
          category: item.category,
          priceCents: item.priceCents || 0,
          qty: 1,
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(existing));
      window.dispatchEvent(new Event('cart-updated'));
      setToast(`${item.name} added to cart`);
      setTimeout(() => setToast(''), 1500);
      return true;
    } catch (err) {
      setToast('Could not add to cart. Please try again.');
      setTimeout(() => setToast(''), 1800);
      return false;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [detailRes, listRes] = await Promise.all([
          fetch(`${API}/products/${slug}`),
          fetch(`${API}/products`).catch(() => null),
        ]);

        let resolvedProduct = null;
        let catalog = [];

        if (detailRes.ok) {
          const data = await detailRes.json();
          resolvedProduct = enrichProduct(data);
        } else {
          const fallback = findDefaultProductBySlug(slug);
          if (fallback) resolvedProduct = enrichProduct(fallback);
          else setError('Product not found');
        }

        if (listRes?.ok) {
          catalog = await listRes.json();
        }
        if (!Array.isArray(catalog) || catalog.length === 0) {
          catalog = defaultProducts;
        }

        if (resolvedProduct) {
          setProduct(resolvedProduct);
          setRelatedProducts(fillRelatedProducts(resolvedProduct, catalog));
          setError('');
        }
      } catch (err) {
        const fallback = findDefaultProductBySlug(slug);
        if (fallback) {
          setProduct(enrichProduct(fallback));
          setRelatedProducts(fillRelatedProducts(fallback, defaultProducts));
          setError('');
          return;
        }
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    loadWishlist()
      .then((items) => setWishlistSlugs(items.map((item) => item.slug)))
      .catch(() => {});
  }, []);

  const toggleWishlist = async () => {
    if (!product) return;
    if (!getAuthToken()) {
      window.location.href = '/login';
      return;
    }
    try {
      const isSaved = wishlistSlugs.includes(product.slug);
      const nextItems = isSaved ? await removeFromWishlist(product.slug) : await addToWishlist(product);
      setWishlistSlugs(nextItems.map((item) => item.slug));
      setToast(isSaved ? 'Removed from wishlist' : 'Saved to wishlist');
      setTimeout(() => setToast(''), 1600);
    } catch (err) {
      setToast(err.message || 'Could not update wishlist.');
      setTimeout(() => setToast(''), 2000);
    }
  };

  useEffect(() => {
    setSelectedImageIndex(0);
    setIsRotateMode(false);
    setZoomOrigin('50% 50%');
    setIsHoveringImage(false);
    setIsHoveringControls(false);
  }, [product?.slug]);

  const galleryImages = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];

  useEffect(() => {
    if (!isRotateMode || galleryImages.length < 2) return undefined;

    const rotation = window.setInterval(() => {
      setSelectedImageIndex((current) => (current + 1) % galleryImages.length);
    }, 900);

    return () => window.clearInterval(rotation);
  }, [galleryImages, isRotateMode]);

  useEffect(() => {
    if (galleryImages.length < 2) return undefined;

    const handleKeydown = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIsRotateMode(false);
        setSelectedImageIndex((current) => (current + 1) % galleryImages.length);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsRotateMode(false);
        setSelectedImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [galleryImages]);

  if (loading) {
    return (
      <div className="bg-white text-slate-900 min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">Loading…</main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white text-slate-900 min-h-screen">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 pt-24 pb-12">
          <p className="text-red-600 text-sm">{error || 'Product not found'}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const price = product.priceDisplay || product.price || `₹${product.priceCents ? Math.round(product.priceCents / 100) : ''}`;
  const highlights = Array.isArray(product.highlights) ? product.highlights.filter(Boolean) : [];
  const specEntries = Object.entries(product.specs || {}).filter(([, value]) => value);
  const activeImage = galleryImages[selectedImageIndex] || '';
  const showPreviousImage = () => {
    setIsRotateMode(false);
    setSelectedImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNextImage = () => {
    setIsRotateMode(false);
    setSelectedImageIndex((current) => (current + 1) % galleryImages.length);
  };

  const addToCart = () => {
    addProductToCart(product);
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16 space-y-12">
        <button onClick={() => window.history.back()} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="border border-slate-200 rounded-3xl p-6 shadow-sm bg-gradient-to-br from-slate-100 via-white to-slate-200 space-y-4"
          >
            {activeImage ? (
              <div
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseMove={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - bounds.left) / bounds.width) * 100;
                  const y = ((event.clientY - bounds.top) / bounds.height) * 100;
                  setZoomOrigin(`${x}% ${y}%`);
                }}
                onMouseLeave={() => {
                  setIsHoveringImage(false);
                  setIsHoveringControls(false);
                  setZoomOrigin('50% 50%');
                }}
              >
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-80 object-contain rounded-2xl transition duration-300"
                  style={{ transformOrigin: zoomOrigin, transform: isHoveringImage && !isHoveringControls ? 'scale(1.8)' : 'scale(1)' }}
                />
                <div
                  className="absolute bottom-3 right-3 flex gap-2"
                  onMouseEnter={() => setIsHoveringControls(true)}
                  onMouseLeave={() => setIsHoveringControls(false)}
                >
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    disabled={galleryImages.length < 2}
                    className="rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Show previous photo"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    disabled={galleryImages.length < 2}
                    className="rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Show next photo"
                  >
                    →
                  </button>
                {galleryImages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setIsRotateMode((current) => !current)}
                      className="pointer-events-auto rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm"
                    >
                      {isRotateMode ? 'Stop 360°' : '360° View'}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500 font-semibold">No Image</div>
            )}
            {galleryImages.length > 1 ? (
              <div
                className="flex gap-3 overflow-x-auto pb-2"
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
              >
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setIsRotateMode(false);
                      setSelectedImageIndex(index);
                    }}
                    className={`pointer-events-auto min-w-[96px] overflow-hidden rounded-2xl border bg-white ${selectedImageIndex === index ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200'}`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-20 w-24 object-contain" />
                  </button>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-slate-500">
              Hover on the main photo to zoom. Scroll sideways through the thumbnails for side views, use left/right arrow keys to switch photos, or use multiple photos for the 360° spin view.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{product.category}</p>
              {product.brand ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-600">
                  {product.brand}
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold leading-tight">{product.name}</h1>
            <p className="text-2xl font-bold text-slate-900">{price}</p>
            <p className="text-slate-600">{product.description || product.spec}</p>
            <div className="text-sm text-slate-500">Stock: {product.stock ?? '—'}</div>
            {highlights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                className="px-5 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={addToCart}
              >
                Add to Cart
              </button>
              <button
                className="px-5 py-3 rounded-full border border-slate-200 text-slate-800 hover:border-slate-300"
                onClick={() => {
                  addToCart();
                  window.location.href = '/cart';
                }}
              >
                Buy Now
              </button>
              <button
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 transition ${
                  wishlistSlugs.includes(product.slug)
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-slate-200 text-slate-800 hover:border-rose-200 hover:text-rose-700'
                }`}
                onClick={toggleWishlist}
              >
                <Heart size={18} fill={wishlistSlugs.includes(product.slug) ? 'currentColor' : 'none'} />
                {wishlistSlugs.includes(product.slug) ? 'Saved' : 'Add to Wishlist'}
              </button>
            </div>
            {toast && <div className="text-sm text-emerald-600">{toast}</div>}
          </motion.div>
        </div>

        {specEntries.length > 0 && (
          <section className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Full Details</p>
              <h2 className="text-2xl font-semibold text-slate-900">Specifications</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {specEntries.map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    {specLabels[key] || key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-700">{value}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">You may also like</p>
              <h2 className="text-2xl font-semibold text-slate-900">Related products</h2>
            </div>
            <a href="/products" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              View all products
            </a>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => {
              const relatedPrice = `₹${Math.round((item.priceCents || 0) / 100).toLocaleString('en-IN')}`;
              return (
                <motion.div
                  key={item.slug}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  onClick={() => {
                    window.location.href = `/products/${item.slug}`;
                  }}
                  className="group cursor-pointer overflow-hidden rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]"
                >
                  <div className="relative h-40 overflow-hidden rounded-[22px] border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100">
                    {item.images?.[0] ? (
                      <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(246,166,0,0.12),transparent_48%)]">
                        <div className="grid h-20 w-20 place-items-center rounded-[26px] border border-white/70 bg-white/85 text-xl font-semibold tracking-[0.18em] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_30px_-18px_rgba(15,23,42,0.3)]">
                          {item.name?.slice(0, 2)?.toUpperCase() || '--'}
                        </div>
                      </div>
                    )}
                    <div className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
                      {item.category}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-slate-900">{item.name}</h3>
                    <p className="line-clamp-2 text-sm text-slate-600">{item.description || item.category}</p>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Price</div>
                      <div className="text-lg font-semibold text-slate-900">{relatedPrice}</div>
                    </div>
                    <button
                      className="rounded-full bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        addProductToCart(item);
                      }}
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              );
            })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500 shadow-sm">
              No related products found in this category yet.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
