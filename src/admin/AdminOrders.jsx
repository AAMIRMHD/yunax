import { useEffect, useState } from 'react';
import { CheckCircle, Clock3 } from 'lucide-react';
import AdminLayout from './AdminLayout';

const API = import.meta.env.VITE_API_URL || 'https://yunax.onrender.com';

const AdminOrders = () => {
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
        const res = await fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) load();
    else {
      setError('Login as admin to view orders.');
      setLoading(false);
    }
  }, [token]);

  return (
    <AdminLayout title="Orders" description="Monitor incoming orders and fulfillment status.">
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Orders</p>
            <h2 className="text-lg font-semibold">{orders.length} total</h2>
          </div>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-slate-600">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">No orders yet.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {orders.map((o) => {
              const status = (o.status || '').toLowerCase();
              const isPending = status === 'pending' || status === '';
              return (
                <div key={o._id || o.id} className="p-4 grid md:grid-cols-4 gap-3 items-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Order #{(o._id || '').slice(-6)}</p>
                    <p className="text-xs text-slate-500">{o.items?.length || 0} items</p>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">₹{((o.totalCents || 0) / 100).toFixed(0)}</div>
                  <div className="text-xs text-slate-600 break-all">{o.email || o.customerEmail || 'unknown@yunax.com'}</div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {isPending ? <Clock3 size={16} className="text-amber-600" /> : <CheckCircle size={16} className="text-emerald-600" />}
                    <span className={`uppercase tracking-[0.18em] text-[11px] ${isPending ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {o.status || 'pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
