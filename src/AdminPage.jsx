import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = (() => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [pRes, oRes] = await Promise.all([
          fetch(`${API}/products`),
          token ? fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ ok: false }),
        ]);
        if (!pRes.ok) throw new Error('Failed to load products');
        const pJson = await pRes.json();
        setProducts(pJson);
        if (oRes.ok) {
          const oJson = await oRes.json();
          setOrders(oJson);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="max-w-6xl mx-auto px-6 space-y-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-3"
          >
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Admin</p>
            <h1 className="text-3xl font-semibold">Catalog & Orders</h1>
            <p className="text-slate-600 max-w-3xl mx-auto">Live data from your Node + Mongo backend. Log in as admin to view orders.</p>
            <div className="flex justify-center">
              <button
                onClick={() => (window.location.href = '/admin/manage')}
                className="px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-800 hover:border-slate-300 shadow-sm text-sm"
              >
                Open Admin Manager
              </button>
            </div>
          </motion.div>

          {!token && (
            <div className="glass border border-slate-200 rounded-2xl p-6 shadow-md text-left">
              <p className="text-slate-700">Login required. Please sign in as admin, then return here.</p>
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="glass border border-slate-200 rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Products</h2>
                <span className="text-xs text-slate-500">{products.length} items</span>
              </div>
              {loading ? (
                <p className="text-slate-600 text-sm">Loading…</p>
              ) : products.length === 0 ? (
                <p className="text-slate-600 text-sm">No products yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-auto">
                  {products.map((p) => (
                    <div key={p._id || p.id} className="border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.category}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">₹{((p.priceCents || 0) / 100).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass border border-slate-200 rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Orders</h2>
                <span className="text-xs text-slate-500">{orders.length} items</span>
              </div>
              {!token ? (
                <p className="text-slate-600 text-sm">Login as admin to view orders.</p>
              ) : loading ? (
                <p className="text-slate-600 text-sm">Loading…</p>
              ) : orders.length === 0 ? (
                <p className="text-slate-600 text-sm">No orders yet.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-auto">
                  {orders.map((o) => (
                    <div key={o._id || o.id} className="border border-slate-200 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-900">Order #{(o._id || '').slice(-6)}</span>
                        <span className="text-xs uppercase tracking-[0.15em] text-slate-500">{o.status}</span>
                      </div>
                      <div className="text-xs text-slate-600">Items: {o.items?.length || 0}</div>
                      <div className="text-sm font-semibold text-slate-900">₹{((o.totalCents || 0) / 100).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
