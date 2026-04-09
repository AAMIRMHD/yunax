import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const loadCart = () => {
  try {
    const raw = localStorage.getItem('cartItems');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveCart = (items) => {
  try {
    localStorage.setItem('cartItems', JSON.stringify(items));
  } catch (e) {
    console.error(e);
  }
};

const CartPage = () => {
  const [items, setItems] = useState(loadCart);
  const [message, setMessage] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    saveCart(items);
    window.dispatchEvent(new Event('cart-updated'));
  }, [items]);

  const total = useMemo(() => items.reduce((sum, item) => sum + (item.priceCents || 0) * (item.qty || 1), 0), [items]);

  const updateQty = (slug, delta) => {
    setItems((list) =>
      list
        .map((item) => (item.slug === slug ? { ...item, qty: Math.max(1, (item.qty || 1) + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (slug) => setItems((list) => list.filter((i) => i.slug !== slug));

  const loadRazorpay = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!items.length) {
      setMessage('Add at least one item before checkout.');
      return;
    }

    const token = (() => {
      try {
        return localStorage.getItem('token');
      } catch (err) {
        return null;
      }
    })();

    if (!token) {
      setMessage('Please log in to continue to payment.');
      window.location.href = '/login';
      return;
    }

    try {
      setIsPaying(true);

      const hydratedItems = await Promise.all(
        items.map(async (item) => {
          if (item.productId) return item;
          if (!item.slug) throw new Error('A cart item is missing its identifier. Please re-add it.');
          const res = await fetch(`${API}/products/${item.slug}`);
          if (!res.ok) throw new Error(`Could not refresh ${item.name || item.slug}. Please try again.`);
          const data = await res.json();
          return {
            ...item,
            productId: data._id || data.id,
            priceCents: data.priceCents ?? item.priceCents,
            name: data.name || item.name,
            spec: data.description || data.category || item.spec,
          };
        })
      );

      const orderRes = await fetch(`${API}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: hydratedItems.map((i) => ({ productId: i.productId, quantity: i.qty || 1 })) }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || 'Could not start payment.');
      }

      const orderData = await orderRes.json();
      await loadRazorpay();

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Yunax',
        description: 'Order payment',
        order_id: orderData.orderId,
        theme: { color: '#0f172a' },
        handler: async (resp) => {
          try {
            const verifyRes = await fetch(`${API}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });

            const payload = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || !payload.verified) {
              throw new Error(payload.error || 'Payment verification failed.');
            }

            setMessage('Payment successful! Redirecting to orders…');
            setItems([]);
            saveCart([]);
            setTimeout(() => {
              window.location.href = '/orders';
            }, 900);
          } catch (err) {
            setMessage(err.message || 'Payment captured but verification failed.');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            setMessage('Payment cancelled.');
          },
        },
        prefill: {},
        notes: { dbOrderId: orderData.dbOrderId },
      });

      razorpay.on('payment.failed', (response) => {
        setIsPaying(false);
        setMessage(response.error?.description || 'Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Checkout failed.');
      setIsPaying(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-6 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-3 text-center"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Cart</p>
            <h1 className="text-3xl font-semibold">Your Bag</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">Review items, then continue to checkout for address and payment.</p>
          </motion.div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
            <div className="glass border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Items ({items.length})</h2>
                <a className="text-sm text-slate-700 underline" href="/products">
                  Continue shopping
                </a>
              </div>
              {items.length === 0 ? (
                <p className="text-slate-600 text-sm">No items yet. Add products to see them here.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.slug}
                      className="border border-slate-200 rounded-xl p-3 flex items-center gap-3 bg-white shadow-xs"
                    >
                      <div className="h-14 w-14 rounded-lg bg-slate-100 grid place-items-center text-xs text-slate-500">Img</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                        <div className="text-xs text-slate-500 truncate">{item.spec || item.category}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                        ₹{((item.priceCents || 0) / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="h-8 w-8 rounded-full border border-slate-200" onClick={() => updateQty(item.slug, -1)}>
                          -
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.qty || 1}</span>
                        <button className="h-8 w-8 rounded-full border border-slate-200" onClick={() => updateQty(item.slug, 1)}>
                          +
                        </button>
                      </div>
                      <button className="text-xs text-red-600" onClick={() => removeItem(item.slug)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form className="glass border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 sticky top-24" onSubmit={handleCheckout}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Summary</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Review</span>
              </div>

              {message && <div className="text-sm text-slate-700">{message}</div>}

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">₹{(total / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="text-slate-500">Calculated at checkout</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPaying || !items.length}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPaying ? 'Processing…' : 'Proceed to checkout'}
              </button>
              <p className="text-xs text-slate-500">Address and payment will be collected on the checkout step.</p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
