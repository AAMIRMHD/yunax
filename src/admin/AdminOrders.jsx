import { useEffect, useState } from 'react';
import { CheckCircle, Clock3, ReceiptText, Truck } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { API } from '../lib/api';

const ORDER_OPTIONS = ['placed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];

const formatMoney = (value = 0) => `₹${Math.round(value / 100).toLocaleString('en-IN')}`;
const formatPaymentMethod = (value = '') => {
  if (value === 'cod') return 'Cash on Delivery';
  if (value === 'bank_transfer') return 'Bank Transfer';
  if (value === 'razorpay') return 'Razorpay';
  return 'Pending';
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({});

  const token = (() => {
    try {
      return localStorage.getItem('admin_token');
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(data.error || 'Failed to load orders');
        setOrders(Array.isArray(data) ? data : []);
        setStatusDrafts(
          Object.fromEntries((Array.isArray(data) ? data : []).map((order) => [String(order._id || order.id), order.status || 'placed']))
        );
      } catch (err) {
        setError(err.message || 'Failed to load orders');
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

  const updateOrderInState = (nextOrder) => {
    const key = String(nextOrder._id || nextOrder.id);
    setOrders((current) => current.map((order) => (String(order._id || order.id) === key ? nextOrder : order)));
    setStatusDrafts((current) => ({ ...current, [key]: nextOrder.status || 'placed' }));
  };

  const removeOrderFromState = (orderId) => {
    setOrders((current) => current.filter((order) => String(order._id || order.id) !== String(orderId)));
  };

  const updateStatus = async (orderId) => {
    try {
      setActionLoadingId(`status-${orderId}`);
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusDrafts[orderId] || 'placed',
          note: `Updated by admin to ${statusDrafts[orderId] || 'placed'}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      updateOrderInState(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId('');
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      setActionLoadingId(`cancel-${orderId}`);
      const res = await fetch(`${API}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
      updateOrderInState(data);
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setActionLoadingId('');
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      setActionLoadingId(`delete-${orderId}`);
      const res = await fetch(`${API}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete order');
      removeOrderFromState(orderId);
    } catch (err) {
      setError(err.message || 'Failed to delete order');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <AdminLayout title="Orders" description="Move orders through fulfillment, handle cancellations/refunds, and verify invoice-ready customer details.">
      {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Fulfillment</p>
            <h2 className="text-lg font-semibold">{orders.length} total orders</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-slate-600">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-5 text-sm text-slate-600">No orders yet.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {orders.map((order) => {
              const orderId = order._id || order.id;
              const status = String(order.status || '').toLowerCase();
              const canCancel = ['placed', 'packed', 'pending'].includes(status);
              const canDelete = ['cancelled', 'delivered', 'failed', 'refunded'].includes(status);

              return (
                <div key={orderId} className="grid gap-4 p-5 xl:grid-cols-[1.2fr,0.8fr,1fr,1.1fr]">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Order #{String(orderId).slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{order.items?.length || 0} items · {formatPaymentMethod(order.paymentMethod)}</p>
                    <p className="text-xs text-slate-500">Invoice {order.invoiceNumber || 'pending'}</p>
                    <p className="text-xs text-slate-500">ETA {order.estimatedDeliveryLabel || 'to be confirmed'}</p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{formatMoney(order.totalCents || 0)}</p>
                    <p>Subtotal {formatMoney(order.subtotalCents || 0)}</p>
                    <p>Shipping {formatMoney(order.shippingCents || 0)}</p>
                    <p>GST {formatMoney(order.taxCents || 0)}</p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{order.customerName || 'Customer'}</p>
                    <p>{order.customerEmail || 'No email'}</p>
                    <p>{order.customerPhone || 'No phone'}</p>
                    <p>{order.shippingAddress?.city || ''}{order.shippingAddress?.city && order.shippingAddress?.pincode ? ' · ' : ''}{order.shippingAddress?.pincode || ''}</p>
                    {order.billingDetails?.gstNumber && <p>GSTIN {order.billingDetails.gstNumber}</p>}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {['delivered', 'refunded'].includes(status) ? <CheckCircle size={16} className="text-emerald-600" /> : <Truck size={16} className="text-blue-600" />}
                      <span className="uppercase tracking-[0.18em] text-[11px] text-slate-700">
                        {order.status || 'placed'} / {order.paymentStatus || 'pending'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={statusDrafts[orderId] || order.status || 'placed'}
                        onChange={(e) => setStatusDrafts((current) => ({ ...current, [orderId]: e.target.value }))}
                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                      >
                        {ORDER_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateStatus(orderId)}
                        disabled={actionLoadingId === `status-${orderId}`}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
                      >
                        {actionLoadingId === `status-${orderId}` ? 'Saving...' : 'Update'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canCancel && (
                        <button
                          onClick={() => cancelOrder(orderId)}
                          disabled={actionLoadingId === `cancel-${orderId}`}
                          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-60"
                        >
                          {actionLoadingId === `cancel-${orderId}` ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            setActionLoadingId(`invoice-${orderId}`);
                            const res = await fetch(`${API}/orders/${orderId}/invoice`, { headers: { Authorization: `Bearer ${token}` } });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) throw new Error(data.error || 'Failed to load invoice');
                            setError(`Invoice ${data.invoiceNumber} ready for ${order.customerName || 'customer'}.`);
                          } catch (err) {
                            setError(err.message || 'Failed to load invoice');
                          } finally {
                            setActionLoadingId('');
                          }
                        }}
                        disabled={actionLoadingId === `invoice-${orderId}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                      >
                        <ReceiptText size={14} />
                        Invoice
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => deleteOrder(orderId)}
                          disabled={actionLoadingId === `delete-${orderId}`}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-60"
                        >
                          {actionLoadingId === `delete-${orderId}` ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>

                    {(order.statusTimeline || []).length > 0 && (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Latest update</p>
                        <p className="text-sm text-slate-700">
                          {(order.statusTimeline[order.statusTimeline.length - 1] || {}).status || order.status || 'placed'}
                        </p>
                      </div>
                    )}
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
