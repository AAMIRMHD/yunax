import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ProductDetailPage = ({ slug }) => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct({
            ...data,
            priceDisplay: data.currency === 'INR' ? `₹${Math.round((data.priceCents || 0) / 100).toLocaleString('en-IN')}` : data.priceCents,
          });
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

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

  const addToCart = () => {
    try {
      const raw = localStorage.getItem('cartItems');
      const existing = raw ? JSON.parse(raw) : [];
      const already = existing.find((i) => i.slug === product.slug);
      if (already) {
        already.qty = (already.qty || 1) + 1;
      } else {
        existing.push({
          slug: product.slug,
          productId: product._id || product.id,
          name: product.name,
          spec: product.description || product.category,
          category: product.category,
          priceCents: product.priceCents || 0,
          qty: 1,
        });
      }
      localStorage.setItem('cartItems', JSON.stringify(existing));
      window.dispatchEvent(new Event('cart-updated'));
      setToast('Added to cart');
      setTimeout(() => setToast(''), 1500);
    } catch (err) {
      setToast('Could not add to cart. Please try again.');
      setTimeout(() => setToast(''), 1800);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16 space-y-10">
        <button onClick={() => window.history.back()} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="border border-slate-200 rounded-3xl p-6 shadow-sm bg-gradient-to-br from-slate-100 via-white to-slate-200"
          >
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-80 object-cover rounded-2xl" />
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500 font-semibold">No Image</div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
            className="space-y-4"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{product.category}</p>
            <h1 className="text-3xl font-semibold leading-tight">{product.name}</h1>
            <p className="text-2xl font-bold text-slate-900">{price}</p>
            <p className="text-slate-600">{product.description || product.spec}</p>
            <div className="text-sm text-slate-500">Stock: {product.stock ?? '—'}</div>
            <div className="flex gap-3 pt-2">
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
            </div>
            {toast && <div className="text-sm text-emerald-600">{toast}</div>}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
