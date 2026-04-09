import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = (() => {
      try {
        return localStorage.getItem('token');
      } catch (err) {
        return null;
      }
    })();

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load orders');
        }
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      setError('Please log in to view your orders.');
      setLoading(false);
      return;
    }

    load();
  }, []);

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="max-w-5xl mx-auto px-6 space-y-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-3"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Orders</p>
            <h1 className="text-3xl font-semibold">Your Orders</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">Track your recent orders and payment status.</p>
          </motion.div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="glass border border-slate-200 rounded-2xl p-6 shadow-md text-left space-y-4">
            {loading ? (
              <p className="text-slate-600">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-slate-600">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order._id || order.id} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <div className="font-semibold text-slate-900">Order #{(order._id || order.id || '').slice(-6)}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{order.status}</div>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="text-slate-500">x{item.quantity}</span>
                          <span className="text-slate-900 font-semibold">₹{((item.priceCents || 0) * (item.quantity || 1) / 100).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-slate-600">Total</span>
                      <span className="text-slate-900 font-semibold">₹{(order.totalCents / 100).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
