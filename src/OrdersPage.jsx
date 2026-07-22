import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, MapPin, PackageSearch, ReceiptText, Search, Truck } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { API } from './lib/api';
import { addItemsToCart } from './lib/account';

const statusConfig = {
  all: { label: 'All orders' },
  pending: { label: 'Pending payment', tone: 'text-amber-700 bg-amber-50 border-amber-200' },
  placed: { label: 'Placed', tone: 'text-sky-700 bg-sky-50 border-sky-200' },
  packed: { label: 'Packed', tone: 'text-violet-700 bg-violet-50 border-violet-200' },
  shipped: { label: 'Shipped', tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  delivered: { label: 'Delivered', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', tone: 'text-rose-700 bg-rose-50 border-rose-200' },
  refunded: { label: 'Refunded', tone: 'text-slate-700 bg-slate-100 border-slate-200' },
  failed: { label: 'Failed', tone: 'text-rose-700 bg-rose-50 border-rose-200' },
};

const lifecycleSteps = ['placed', 'packed', 'shipped', 'delivered'];

const formatMoney = (value = 0) => `₹${Math.round(value / 100).toLocaleString('en-IN')}`;
const formatPaymentMethod = (value = '') => {
  if (value === 'cod') return 'Cash on Delivery';
  if (value === 'bank_transfer') return 'Bank Transfer';
  if (value === 'razorpay') return 'Razorpay';
  return 'Payment pending';
};

const downloadInvoice = async (orderId, token) => {
  const res = await fetch(`${API}/orders/${orderId}/invoice`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load invoice');

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) throw new Error('Please allow pop-ups to view the invoice.');
  const rows = (data.items || [])
    .map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${Math.round((item.priceCents || 0) / 100)}</td><td>₹${Math.round(((item.priceCents || 0) * (item.quantity || 1)) / 100)}</td></tr>`)
    .join('');
  win.document.write(`
    <html>
      <head>
        <title>Invoice ${data.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
          h1, h2, p { margin: 0 0 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Yunax Digital Invoice</h1>
        <p>Invoice Number: <strong>${data.invoiceNumber}</strong></p>
        <p>Order ID: <strong>${data.orderId}</strong></p>
        <p>Issued: <strong>${new Date(data.invoiceIssuedAt).toLocaleString()}</strong></p>
        <div class="meta">
          <div>
            <h2>Shipping</h2>
            <p>${data.shippingAddress?.fullName || ''}</p>
            <p>${data.shippingAddress?.line1 || ''}</p>
            <p>${[data.shippingAddress?.city, data.shippingAddress?.state, data.shippingAddress?.pincode].filter(Boolean).join(', ')}</p>
          </div>
          <div>
            <h2>Billing</h2>
            <p>${data.billingDetails?.companyName || data.shippingAddress?.fullName || ''}</p>
            <p>${data.billingDetails?.gstNumber ? `GSTIN: ${data.billingDetails.gstNumber}` : 'GST invoice not requested'}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:20px;">Subtotal: <strong>${formatMoney(data.subtotalCents || 0)}</strong></p>
        <p>Shipping: <strong>${formatMoney(data.shippingCents || 0)}</strong></p>
        <p>Discount: <strong>- ${formatMoney(data.discountCents || 0)}</strong></p>
        <p>GST (${Math.round((data.gstRate || 0) * 100)}% included): <strong>${formatMoney(data.taxCents || 0)}</strong></p>
        <p>Total: <strong>${formatMoney(data.totalCents || 0)}</strong></p>
      </body>
    </html>
  `);
  win.document.close();
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

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
        const data = await res.json().catch(() => ([]));
        if (!res.ok) throw new Error(data.error || 'Failed to load orders');
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
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
  }, [token]);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      const status = (order.status || 'placed').toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesQuery =
        !search ||
        String(order._id || order.id || '').toLowerCase().includes(search) ||
        (order.items || []).some((item) => item.name?.toLowerCase().includes(search));
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  const orderSummary = useMemo(() => ({
    active: orders.filter((order) => ['placed', 'packed', 'shipped'].includes(String(order.status || '').toLowerCase())).length,
    delivered: orders.filter((order) => String(order.status || '').toLowerCase() === 'delivered').length,
    cancelled: orders.filter((order) => ['cancelled', 'refunded'].includes(String(order.status || '').toLowerCase())).length,
  }), [orders]);

  const updateOrderInState = (nextOrder) => {
    setOrders((current) =>
      current.map((order) => (String(order._id || order.id) === String(nextOrder._id || nextOrder.id) ? nextOrder : order))
    );
  };

  const removeOrderFromState = (orderId) => {
    setOrders((current) => current.filter((order) => String(order._id || order.id) !== String(orderId)));
  };

  const reorder = (order) => {
    addItemsToCart((order.items || []).map((item) => ({
      slug: item.slug || `${(item.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.productId || 'demo'}`,
      productId: item.productId,
      name: item.name,
      description: item.name,
      category: 'Products',
      priceCents: item.priceCents,
      quantity: item.quantity,
    })));
    setToast('Items added to cart.');
    setTimeout(() => setToast(''), 1800);
  };

  const cancelOrder = async (order) => {
    const orderId = order._id || order.id;
    try {
      setActionLoadingId(`cancel-${orderId}`);
      const res = await fetch(`${API}/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
      updateOrderInState(data);
      setToast('Order cancelled.');
      setTimeout(() => setToast(''), 1800);
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setActionLoadingId('');
    }
  };

  const deleteOrder = async (order) => {
    const orderId = order._id || order.id;
    try {
      setActionLoadingId(`delete-${orderId}`);
      const res = await fetch(`${API}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete order');
      removeOrderFromState(orderId);
      setToast('Order deleted.');
      setTimeout(() => setToast(''), 1800);
    } catch (err) {
      setError(err.message || 'Failed to delete order');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/20">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-10 px-6 pb-24 pt-32">
        <section className="glass rounded-[36px] border border-slate-200/60 bg-white/80 p-8 shadow-2xl shadow-slate-200/30">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                <Clock3 size={12} />
                Fulfillment center
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">Your orders</h1>
                <p className="mt-3 max-w-2xl text-base text-slate-500">
                  Track each step of fulfillment, review GST-ready invoice details, and contact support quickly if anything needs attention.
                </p>
              </div>
              {toast && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600">
                  <CheckCircle2 size={16} /> {toast}
                </motion.div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'In progress', value: orderSummary.active },
                { label: 'Delivered', value: orderSummary.delivered },
                { label: 'Cancelled / refunded', value: orderSummary.cancelled },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-2xl bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-primary/20"
                placeholder="Search by order number or item"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`rounded-2xl px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    statusFilter === key ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">{error}</div>}

        <section className="space-y-6">
          {loading ? (
            <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-16 text-center text-sm font-semibold text-slate-400">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[30px] border-2 border-dashed border-slate-200 p-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <PackageSearch size={32} />
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-900">No orders found</p>
              <p className="mt-2 text-sm text-slate-500">Try another filter, or place your first order from the products catalog.</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const orderId = order._id || order.id;
              const status = (order.status || 'placed').toLowerCase();
              const config = statusConfig[status] || statusConfig.placed;
              const canCancel = ['placed', 'packed', 'pending'].includes(status);
              const canDelete = ['cancelled', 'delivered', 'failed', 'refunded'].includes(status);
              const currentStepIndex = lifecycleSteps.indexOf(status);

              return (
                <motion.div
                  key={orderId}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: index * 0.04 }}
                  className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-xl shadow-slate-200/20"
                >
                  <div className="border-b border-slate-100 p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-bold text-slate-900">#{String(orderId).slice(-10).toUpperCase()}</p>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${config.tone}`}>
                            {config.label}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {formatPaymentMethod(order.paymentMethod)} / {order.paymentStatus || 'pending'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Invoice {order.invoiceNumber || 'pending'} {order.estimatedDeliveryLabel ? `· ETA ${order.estimatedDeliveryLabel}` : ''}
                        </p>
                      </div>
                      <div className="text-left lg:text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Grand total</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(order.totalCents || 0)}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                      {lifecycleSteps.map((step, stepIndex) => {
                        const active = stepIndex <= currentStepIndex || (status === 'refunded' && step === 'delivered');
                        return (
                          <div key={step} className={`rounded-2xl border px-4 py-3 text-center ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{step}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-6 p-8 lg:grid-cols-[1.4fr,0.9fr]">
                    <div className="space-y-4">
                      {(order.items || []).map((item, itemIndex) => (
                        <div key={`${item.name}-${itemIndex}`} className="rounded-[24px] bg-slate-50 p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-sm text-slate-500">Qty {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{formatMoney((item.priceCents || 0) * (item.quantity || 1))}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-slate-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Price breakdown</p>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold text-slate-900">{formatMoney(order.subtotalCents || 0)}</span></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">Shipping</span><span className="font-semibold text-slate-900">{formatMoney(order.shippingCents || 0)}</span></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">Shipping discount</span><span className="font-semibold text-emerald-600">- {formatMoney(order.discountCents || 0)}</span></div>
                          <div className="flex items-center justify-between"><span className="text-slate-500">GST</span><span className="font-semibold text-slate-900">{formatMoney(order.taxCents || 0)}</span></div>
                        </div>
                      </div>

                      <div className="rounded-[24px] border border-slate-200 p-5">
                        <div className="flex items-start gap-3">
                          <MapPin size={18} className="mt-1 text-slate-400" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{order.shippingAddress?.fullName || 'Delivery address'}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {order.shippingAddress?.line1 || ''}
                              <br />
                              {[order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.pincode].filter(Boolean).join(', ')}
                            </p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {order.shippingZone || 'national'} zone {order.estimatedDeliveryLabel ? `· ${order.estimatedDeliveryLabel}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => reorder(order)} className="rounded-2xl bg-slate-900 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-primary">
                          Reorder
                        </button>
                        <button
                          onClick={() => downloadInvoice(orderId, token).catch((err) => setError(err.message))}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:bg-slate-50"
                        >
                          <ReceiptText size={14} />
                          Invoice
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => cancelOrder(order)}
                            disabled={actionLoadingId === `cancel-${orderId}`}
                            className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                          >
                            {actionLoadingId === `cancel-${orderId}` ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteOrder(order)}
                            disabled={actionLoadingId === `delete-${orderId}`}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                          >
                            {actionLoadingId === `delete-${orderId}` ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OrdersPage;
