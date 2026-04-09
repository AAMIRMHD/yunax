import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import AdminLayout from './AdminLayout';

const API = import.meta.env.VITE_API_URL || 'https://yunax.onrender.com';

const StatCard = ({ icon: Icon, label, value, tone = 'default' }) => {
  const toneClass =
    tone === 'danger'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-white text-slate-900 border-slate-200';

  return (
    <div className={`border rounded-2xl p-4 flex items-center gap-3 shadow-sm ${toneClass}`}>
      <div className="h-10 w-10 rounded-xl bg-white/70 grid place-items-center text-slate-700 border border-white/60">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{label}</p>
        <p className="text-xl font-semibold truncate">{value}</p>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
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
        setProducts(pJson || []);

        if (oRes.ok) {
          const oJson = await oRes.json();
          setOrders(oJson || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalCents) || 0), 0) / 100;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const lowStock = products.filter((p) => (p.stock ?? 0) < 5).length;
    return {
      productCount: products.length,
      orderCount: orders.length,
      totalRevenue,
      pending,
      lowStock,
    };
  }, [products, orders]);

  return (
    <AdminLayout title="Dashboard" description="Snapshot of store performance, inventory, and orders.">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Products" value={metrics.productCount} />
        <StatCard icon={ShoppingCart} label="Orders" value={metrics.orderCount} />
        <StatCard icon={TrendingUp} label="Revenue" value={`₹${metrics.totalRevenue.toFixed(0)}`} tone="success" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={metrics.lowStock} tone={metrics.lowStock ? 'danger' : 'default'} />
      </div>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Recent Orders</p>
              <h3 className="text-lg font-semibold">Last 6 orders</h3>
            </div>
            <a className="text-sm text-slate-700 underline" href="/admin/orders">
              View all
            </a>
          </div>
          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="p-4 text-sm text-slate-600">Loading…</div>
            ) : orders.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No orders yet.</div>
            ) : (
              orders.slice(0, 6).map((o) => (
                <div key={o._id || o.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Order #{(o._id || '').slice(-6)}</p>
                    <p className="text-xs text-slate-500">{o.items?.length || 0} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">₹{((o.totalCents || 0) / 100).toFixed(0)}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{o.status || 'pending'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Inventory</p>
            <h3 className="text-lg font-semibold">Low stock items</h3>
          </div>
          <div className="divide-y divide-slate-200 max-h-[380px] overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-600">Loading…</div>
            ) : metrics.lowStock === 0 ? (
              <div className="p-4 text-sm text-slate-600">All good. No low stock items.</div>
            ) : (
              products
                .filter((p) => (p.stock ?? 0) < 5)
                .map((p) => (
                  <div key={p._id || p.id} className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500 truncate">Stock: {p.stock ?? 0}</p>
                    </div>
                    <a href="/admin/products" className="text-xs text-slate-700 underline">
                      Restock
                    </a>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;
