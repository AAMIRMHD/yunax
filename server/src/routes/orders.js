import express from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { findDefaultProductBySlug, getDefaultProducts } from '../lib/defaultProducts.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';
import { sendMail, templateOrderPlaced, templateOrderRefunded, templateOrderStatus } from '../lib/mailer.js';
import { sendSms, sendWhatsApp } from '../lib/notifications.js';
import {
  buildStatusTimelineEntry,
  calculateOrderPricing,
  canCancelOrder,
  canDeleteOrder,
  createInvoiceNumber,
  getNextPaymentStatus,
  isStatusTransitionAllowed,
  normalizeBillingDetails,
  normalizePincode,
  ORDER_STATUSES,
} from '../lib/commerce.js';

const router = express.Router();
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
const offlinePaymentMethods = new Set(['cod', 'bank_transfer']);
const defaultProducts = getDefaultProducts();
const supportEmail = process.env.SUPPORT_EMAIL || 'info@yunax.com';

const mapDoc = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data?.() });
const addressSchema = z.object({
  fullName: z.string().min(1).max(80),
  phone: z.string().min(7).max(20),
  line1: z.string().min(3).max(120),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().min(3).max(12),
});
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().optional(),
    slug: z.string().optional(),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
  })).min(1),
  paymentMethod: z.enum(['cod', 'bank_transfer']).default('cod'),
  shippingAddress: addressSchema,
  billingDetails: z.object({
    isBusiness: z.boolean().optional(),
    companyName: z.string().max(120).optional(),
    gstNumber: z.string().max(20).optional(),
    sameAsShipping: z.boolean().optional(),
    address: addressSchema.partial().optional(),
  }).optional(),
});
const quoteSchema = z.object({
  items: z.array(z.object({
    productId: z.string().optional(),
    slug: z.string().optional(),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
  })).min(1),
  shippingAddress: addressSchema,
});
const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().max(180).optional().default(''),
});

const normalizeAddress = (address = {}) => ({
  fullName: String(address.fullName || '').trim(),
  phone: String(address.phone || '').trim(),
  line1: String(address.line1 || '').trim(),
  city: String(address.city || '').trim(),
  state: String(address.state || '').trim(),
  pincode: normalizePincode(address.pincode),
});

const validateAddress = (address) => {
  const requiredFields = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'];
  const missing = requiredFields.filter((field) => !address[field]);
  if (missing.length) throw new Error('Delivery address is incomplete');
};

const buildCatalogLookup = (products = []) => {
  const byId = {};
  const bySlug = {};
  products.forEach((product) => {
    const id = String(product._id || product.id || '');
    const slug = String(product.slug || '');
    if (id) byId[id] = product;
    if (slug) bySlug[slug] = product;
  });
  return { byId, bySlug };
};

const resolveProduct = (item, catalog) => {
  const productId = String(item.productId || '');
  const slug = String(item.slug || '');
  return (
    catalog.byId[productId] ||
    catalog.bySlug[slug] ||
    (slug ? findDefaultProductBySlug(slug) : null) ||
    defaultProducts.find((product) => String(product._id || product.id) === productId) ||
    null
  );
};

const buildOrderItems = (items, catalog) =>
  items.map((entry) => {
    const product = resolveProduct(entry, catalog);
    if (!product) throw new Error('One or more items in your cart are no longer available. Please refresh your cart and try again.');
    const quantity = Math.max(1, Number(entry.quantity || 1));
    const stock = Number(product.stock ?? 0);
    if (stock >= 0 && stock < quantity) throw new Error(`Only ${stock} item(s) left for ${product.name || 'this product'}`);
    return {
      productId: String(product._id || product.id || entry.productId || ''),
      slug: product.slug || entry.slug || '',
      name: product.name || 'Unknown',
      priceCents: product.priceCents || 0,
      quantity,
      image: product.images?.[0] || '',
    };
  });

const buildOrderRecord = ({ user, items, catalog, paymentMethod, shippingAddress, billingDetails }) => {
  const normalizedPaymentMethod = offlinePaymentMethods.has(paymentMethod) ? paymentMethod : 'cod';
  const normalizedAddress = normalizeAddress(shippingAddress);
  validateAddress(normalizedAddress);
  const normalizedBilling = normalizeBillingDetails(billingDetails, normalizedAddress);
  const enriched = buildOrderItems(items, catalog);
  const pricing = calculateOrderPricing({ items: enriched, shippingAddress: normalizedAddress });
  if (!pricing.shipping.serviceable) {
    throw new Error('We do not currently deliver to this pincode. Please use another delivery address or contact support.');
  }

  return {
    items: enriched,
    subtotalCents: pricing.subtotalCents,
    shippingCents: pricing.shippingCents,
    discountCents: pricing.discountCents,
    taxCents: pricing.taxCents,
    totalCents: pricing.totalCents,
    currency: pricing.currency,
    status: 'placed',
    paymentMethod: normalizedPaymentMethod,
    paymentStatus: 'pending',
    taxMode: pricing.taxMode,
    gstRate: pricing.gstRate,
    customerName: normalizedAddress.fullName || user.name || '',
    customerEmail: user.email || '',
    customerPhone: normalizedAddress.phone,
    shippingAddress: normalizedAddress,
    billingDetails: normalizedBilling,
    shippingZone: pricing.shipping.zone,
    shippingLabel: pricing.shipping.label,
    shippingServiceable: pricing.shipping.serviceable,
    estimatedDeliveryMinDays: pricing.eta.minDays,
    estimatedDeliveryMaxDays: pricing.eta.maxDays,
  };
};

const buildQuoteResponse = ({ items, catalog, shippingAddress }) => {
  const normalizedAddress = normalizeAddress(shippingAddress);
  validateAddress(normalizedAddress);
  const enriched = buildOrderItems(items, catalog);
  const pricing = calculateOrderPricing({ items: enriched, shippingAddress: normalizedAddress });
  return {
    items: enriched,
    subtotalCents: pricing.subtotalCents,
    shippingCents: pricing.shippingCents,
    discountCents: pricing.discountCents,
    taxCents: pricing.taxCents,
    totalCents: pricing.totalCents,
    currency: pricing.currency,
    gstRate: pricing.gstRate,
    taxMode: pricing.taxMode,
    shipping: pricing.shipping,
    estimatedDelivery: pricing.eta,
  };
};

const decrementMemoryStock = (store, items) => {
  items.forEach((item) => {
    const product = store.products.find((entry) => entry.id === item.productId || entry._id === item.productId || entry.slug === item.slug);
    if (product) product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
  });
};

const incrementMemoryStock = (store, items) => {
  items.forEach((item) => {
    const product = store.products.find((entry) => entry.id === item.productId || entry._id === item.productId || entry.slug === item.slug);
    if (product) product.stock = Math.max(0, Number(product.stock || 0) + Number(item.quantity || 0));
  });
};

const canModifyOrder = (order, user, allowAdmin = false) => {
  if (!order) return false;
  if (allowAdmin && user?.role === 'admin') return true;
  return String(order.userId || '') === String(user?.sub || '');
};

const hydrateOrderForResponse = (order) => ({
  ...order,
  estimatedDeliveryLabel:
    order?.estimatedDeliveryMinDays && order?.estimatedDeliveryMaxDays
      ? `${order.estimatedDeliveryMinDays}-${order.estimatedDeliveryMaxDays} business days`
      : '',
});

const notifyOrderEvent = async (order, { status = '', refunded = false } = {}) => {
  const orderId = order._id || order.id;
  const etaLabel =
    order?.estimatedDeliveryMinDays && order?.estimatedDeliveryMaxDays
      ? `${order.estimatedDeliveryMinDays}-${order.estimatedDeliveryMaxDays} business days`
      : '';

  if (order.customerEmail) {
    if (refunded) {
      await sendMail({ to: order.customerEmail, ...templateOrderRefunded({ name: order.customerName || 'Customer', orderId, supportEmail }) });
    } else if (status === 'placed') {
      await sendMail({ to: order.customerEmail, ...templateOrderPlaced({ name: order.customerName || 'Customer', orderId }) });
    } else {
      await sendMail({ to: order.customerEmail, ...templateOrderStatus({ name: order.customerName || 'Customer', orderId, status, etaLabel, supportEmail }) });
    }
  }

  const message = refunded
    ? `Your refund for order ${orderId} has been processed.`
    : `Order ${orderId} is now ${status}.${etaLabel ? ` ETA: ${etaLabel}.` : ''}`;
  await sendSms({ to: order.customerPhone, message });
  await sendWhatsApp({ to: order.customerPhone, message });
};

const stockUpdateForStatusChange = async ({ beforeStatus, nextStatus, items, req, session = null }) => {
  const wasStockReserved = ['placed', 'packed', 'shipped', 'delivered'].includes(String(beforeStatus || '').toLowerCase());
  const shouldRestore = wasStockReserved && ['cancelled', 'refunded', 'failed'].includes(String(nextStatus || '').toLowerCase());
  if (!shouldRestore) return;

  if (req.useMemory && req.memoryStore) {
    incrementMemoryStock(req.memoryStore, items || []);
    return;
  }

  if (useFirebase && req.db) {
    await Promise.all(
      (items || []).map(async (item) => {
        if (!item.productId) return;
        const ref = req.db.collection('products').doc(String(item.productId));
        const doc = await ref.get();
        if (!doc.exists) return;
        const currentStock = Number((doc.data() || {}).stock || 0);
        await ref.update({ stock: currentStock + Number(item.quantity || 0) });
      })
    );
    return;
  }

  for (const item of items || []) {
    if (!mongoose.isValidObjectId(String(item.productId || ''))) continue;
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: Number(item.quantity || 0) } }, { session });
  }
};

const loadCatalogForQuote = async (req, items = []) => {
  if (req.useMemory && req.memoryStore) return buildCatalogLookup([...defaultProducts, ...req.memoryStore.products]);
  if (useFirebase && req.db) {
    const productDocsById = await Promise.all(items.map((i) => req.db.collection('products').doc(String(i.productId || '')).get()));
    const productDocsBySlug = await Promise.all(
      items.filter((item) => item.slug).map(async (item) => {
        const snap = await req.db.collection('products').where('slug', '==', String(item.slug)).limit(1).get();
        return snap.empty ? null : snap.docs[0];
      })
    );
    const dbProducts = [...productDocsById, ...productDocsBySlug]
      .filter((doc) => doc?.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((product, index, list) => list.findIndex((entry) => entry.id === product.id) === index);
    return buildCatalogLookup([...defaultProducts, ...dbProducts]);
  }
  const productDocs = await Product.find({
    $or: [
      { _id: { $in: items.map((item) => item.productId).filter((value) => mongoose.isValidObjectId(String(value || ''))) } },
      { slug: { $in: items.map((item) => String(item.slug || '')).filter(Boolean) } },
    ],
  });
  return buildCatalogLookup([...defaultProducts, ...productDocs]);
};

router.post('/quote', validate(quoteSchema), async (req, res) => {
  try {
    const catalog = await loadCatalogForQuote(req, req.body.items || []);
    const quote = buildQuoteResponse({ items: req.body.items || [], catalog, shippingAddress: req.body.shippingAddress || {} });
    return ok(res, quote);
  } catch (err) {
    return fail(res, 400, err.message || 'Could not calculate shipping');
  }
});

router.get('/', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const list = req.user.role === 'admin' ? req.memoryStore.orders : req.memoryStore.orders.filter((order) => order.userId === req.user.sub);
    return ok(res, list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map(hydrateOrderForResponse));
  }

  if (useFirebase && req.db) {
    let ref = req.db.collection('orders').orderBy('createdAt', 'desc');
    if (req.user.role !== 'admin') ref = req.db.collection('orders').where('userId', '==', req.user.sub).orderBy('createdAt', 'desc');
    const snap = await ref.get();
    return ok(res, snap.docs.map((doc) => hydrateOrderForResponse(mapDoc(doc))));
  }

  const filter = req.user.role === 'admin' ? {} : { userId: req.user.sub };
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return ok(res, orders.map((order) => hydrateOrderForResponse(order.toObject ? order.toObject() : order)));
});

router.post('/', requireAuth, validate(createOrderSchema), async (req, res) => {
  try {
    const { items, paymentMethod = 'cod', shippingAddress, billingDetails } = req.body;
    if (!items || !items.length) return fail(res, 400, 'No items');
    if (!offlinePaymentMethods.has(paymentMethod)) return fail(res, 400, 'Unsupported payment method for direct order placement');

    if (req.useMemory && req.memoryStore) {
      const catalog = buildCatalogLookup([...defaultProducts, ...req.memoryStore.products]);
      const orderPayload = buildOrderRecord({ user: req.user, items, catalog, paymentMethod, shippingAddress, billingDetails });
      const orderId = String(Date.now());
      const order = {
        _id: orderId,
        id: orderId,
        userId: req.user.sub,
        ...orderPayload,
        invoiceNumber: createInvoiceNumber(orderId),
        invoiceIssuedAt: Date.now(),
        statusTimeline: [buildStatusTimelineEntry('placed', 'Order created by customer')],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      decrementMemoryStock(req.memoryStore, order.items);
      req.memoryStore.orders.unshift(order);
      await notifyOrderEvent(order, { status: 'placed' });
      return ok(res, hydrateOrderForResponse(order), 201);
    }

    if (useFirebase && req.db) {
      const catalog = await loadCatalogForQuote(req, items);
      const orderPayload = buildOrderRecord({ user: req.user, items, catalog, paymentMethod, shippingAddress, billingDetails });
      const ref = await req.db.collection('orders').add({
        userId: req.user.sub,
        ...orderPayload,
        invoiceNumber: createInvoiceNumber(),
        invoiceIssuedAt: Date.now(),
        statusTimeline: [buildStatusTimelineEntry('placed', 'Order created by customer')],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await Promise.all(
        orderPayload.items.map((item) =>
          item.productId
            ? req.db.collection('products').doc(String(item.productId)).get().then((doc) => {
                if (!doc.exists) return null;
                const stock = Number((doc.data() || {}).stock || 0);
                return req.db.collection('products').doc(String(item.productId)).update({ stock: Math.max(0, stock - Number(item.quantity || 0)) });
              })
            : Promise.resolve()
        )
      );
      await ref.update({ invoiceNumber: createInvoiceNumber(ref.id) });
      const created = mapDoc(await ref.get());
      await notifyOrderEvent(created, { status: 'placed' });
      return ok(res, hydrateOrderForResponse(created), 201);
    }

    const session = await mongoose.startSession();
    try {
      let created;
      await session.withTransaction(async () => {
        const catalog = await loadCatalogForQuote(req, items);
        const orderPayload = buildOrderRecord({ user: req.user, items, catalog, paymentMethod, shippingAddress, billingDetails });
        for (const item of orderPayload.items) {
          if (!mongoose.isValidObjectId(item.productId)) continue;
          const updated = await Product.findOneAndUpdate(
            { _id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          );
          if (!updated) throw new Error(`Insufficient stock for ${item.name}`);
        }
        const inserted = await Order.create([{
          userId: req.user.sub,
          ...orderPayload,
          invoiceNumber: createInvoiceNumber(),
          invoiceIssuedAt: new Date(),
          statusTimeline: [buildStatusTimelineEntry('placed', 'Order created by customer')],
        }], { session });
        created = inserted[0];
        created.invoiceNumber = createInvoiceNumber(created._id);
        await created.save({ session });
      });
      await notifyOrderEvent(created, { status: 'placed' });
      return ok(res, hydrateOrderForResponse(created.toObject ? created.toObject() : created), 201);
    } finally {
      await session.endSession();
    }
  } catch (err) {
    return fail(res, 400, err.message || 'Failed to create order');
  }
});

router.patch('/:id/status', requireAuth, validate(updateStatusSchema), async (req, res) => {
  const { status, note = '' } = req.body;

  if (req.useMemory && req.memoryStore) {
    const order = req.memoryStore.orders.find((entry) => entry.id === req.params.id || entry._id === req.params.id);
    if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    const isAdmin = req.user?.role === 'admin';
    if (!canModifyOrder(order, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
    if (!isStatusTransitionAllowed({ currentStatus: order.status, nextStatus: status, isAdmin, paymentStatus: order.paymentStatus })) {
      return fail(res, 400, 'Invalid status transition', 'INVALID_ORDER_STATUS');
    }
    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    await stockUpdateForStatusChange({ beforeStatus: previousStatus, nextStatus: status, items: order.items, req });
    order.status = status;
    order.paymentStatus = getNextPaymentStatus({ currentStatus: previousStatus, nextStatus: status, paymentStatus: previousPaymentStatus });
    order.updatedAt = Date.now();
    order.refundReason = status === 'refunded' ? (note || 'Refund issued') : (order.refundReason || '');
    order.refundedAt = status === 'refunded' ? Date.now() : (order.refundedAt || null);
    order.statusTimeline = [...(order.statusTimeline || []), buildStatusTimelineEntry(status, note)];
    await notifyOrderEvent(order, { status, refunded: status === 'refunded' });
    return ok(res, hydrateOrderForResponse(order));
  }

  if (useFirebase && req.db) {
    const ref = req.db.collection('orders').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    const current = mapDoc(doc);
    const isAdmin = req.user?.role === 'admin';
    if (!canModifyOrder(current, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
    if (!isStatusTransitionAllowed({ currentStatus: current.status, nextStatus: status, isAdmin, paymentStatus: current.paymentStatus })) {
      return fail(res, 400, 'Invalid status transition', 'INVALID_ORDER_STATUS');
    }
    const nextPaymentStatus = getNextPaymentStatus({ currentStatus: current.status, nextStatus: status, paymentStatus: current.paymentStatus });
    await stockUpdateForStatusChange({ beforeStatus: current.status, nextStatus: status, items: current.items, req });
    await ref.update({
      status,
      paymentStatus: nextPaymentStatus,
      refundReason: status === 'refunded' ? (note || 'Refund issued') : (current.refundReason || ''),
      refundedAt: status === 'refunded' ? Date.now() : (current.refundedAt || null),
      statusTimeline: [...(current.statusTimeline || []), buildStatusTimelineEntry(status, note)],
      updatedAt: Date.now(),
    });
    const updated = mapDoc(await ref.get());
    await notifyOrderEvent(updated, { status, refunded: status === 'refunded' });
    return ok(res, hydrateOrderForResponse(updated));
  }

  const existingOrder = await Order.findById(req.params.id);
  if (!existingOrder) return fail(res, 404, 'Order not found', 'NOT_FOUND');
  const isAdmin = req.user?.role === 'admin';
  if (!canModifyOrder(existingOrder, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
  if (!isStatusTransitionAllowed({ currentStatus: existingOrder.status, nextStatus: status, isAdmin, paymentStatus: existingOrder.paymentStatus })) {
    return fail(res, 400, 'Invalid status transition', 'INVALID_ORDER_STATUS');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const previousStatus = existingOrder.status;
      const previousPaymentStatus = existingOrder.paymentStatus;
      await stockUpdateForStatusChange({ beforeStatus: previousStatus, nextStatus: status, items: existingOrder.items, req, session });
      existingOrder.status = status;
      existingOrder.paymentStatus = getNextPaymentStatus({ currentStatus: previousStatus, nextStatus: status, paymentStatus: previousPaymentStatus });
      existingOrder.refundReason = status === 'refunded' ? (note || 'Refund issued') : existingOrder.refundReason;
      existingOrder.refundedAt = status === 'refunded' ? new Date() : existingOrder.refundedAt;
      existingOrder.statusTimeline = [...(existingOrder.statusTimeline || []), buildStatusTimelineEntry(status, note)];
      await existingOrder.save({ session });
    });
    await notifyOrderEvent(existingOrder, { status, refunded: status === 'refunded' });
    return ok(res, hydrateOrderForResponse(existingOrder.toObject ? existingOrder.toObject() : existingOrder));
  } finally {
    await session.endSession();
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res) => {
  req.body = { ...(req.body || {}), status: 'cancelled', note: req.user?.role === 'admin' ? 'Cancelled by admin' : 'Cancelled by customer' };

  if (req.useMemory && req.memoryStore) {
    const order = req.memoryStore.orders.find((entry) => entry.id === req.params.id || entry._id === req.params.id);
    if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    if (!canModifyOrder(order, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
    if (!isStatusTransitionAllowed({ currentStatus: order.status, nextStatus: 'cancelled', isAdmin: req.user?.role === 'admin', paymentStatus: order.paymentStatus })) {
      return fail(res, 400, 'This order cannot be cancelled', 'ORDER_NOT_CANCELLABLE');
    }
    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    await stockUpdateForStatusChange({ beforeStatus: previousStatus, nextStatus: 'cancelled', items: order.items, req });
    order.status = 'cancelled';
    order.paymentStatus = getNextPaymentStatus({ currentStatus: previousStatus, nextStatus: 'cancelled', paymentStatus: previousPaymentStatus });
    order.updatedAt = Date.now();
    order.statusTimeline = [...(order.statusTimeline || []), buildStatusTimelineEntry('cancelled', req.body.note)];
    await notifyOrderEvent(order, { status: 'cancelled' });
    return ok(res, hydrateOrderForResponse(order));
  }

  if (useFirebase && req.db) {
    const ref = req.db.collection('orders').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    const order = mapDoc(doc);
    if (!canModifyOrder(order, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
    if (!isStatusTransitionAllowed({ currentStatus: order.status, nextStatus: 'cancelled', isAdmin: req.user?.role === 'admin', paymentStatus: order.paymentStatus })) {
      return fail(res, 400, 'This order cannot be cancelled', 'ORDER_NOT_CANCELLABLE');
    }
    const nextPaymentStatus = getNextPaymentStatus({ currentStatus: order.status, nextStatus: 'cancelled', paymentStatus: order.paymentStatus });
    await stockUpdateForStatusChange({ beforeStatus: order.status, nextStatus: 'cancelled', items: order.items, req });
    await ref.update({
      status: 'cancelled',
      paymentStatus: nextPaymentStatus,
      statusTimeline: [...(order.statusTimeline || []), buildStatusTimelineEntry('cancelled', req.body.note)],
      updatedAt: Date.now(),
    });
    const updated = mapDoc(await ref.get());
    await notifyOrderEvent(updated, { status: 'cancelled' });
    return ok(res, hydrateOrderForResponse(updated));
  }

  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
  if (!canModifyOrder(order, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
  if (!isStatusTransitionAllowed({ currentStatus: order.status, nextStatus: 'cancelled', isAdmin: req.user?.role === 'admin', paymentStatus: order.paymentStatus })) {
    return fail(res, 400, 'This order cannot be cancelled', 'ORDER_NOT_CANCELLABLE');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const previousStatus = order.status;
      const previousPaymentStatus = order.paymentStatus;
      await stockUpdateForStatusChange({ beforeStatus: previousStatus, nextStatus: 'cancelled', items: order.items, req, session });
      order.status = 'cancelled';
      order.paymentStatus = getNextPaymentStatus({ currentStatus: previousStatus, nextStatus: 'cancelled', paymentStatus: previousPaymentStatus });
      order.statusTimeline = [...(order.statusTimeline || []), buildStatusTimelineEntry('cancelled', req.body.note)];
      await order.save({ session });
    });
    await notifyOrderEvent(order, { status: 'cancelled' });
    return ok(res, hydrateOrderForResponse(order.toObject ? order.toObject() : order));
  } finally {
    await session.endSession();
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const order = req.memoryStore.orders.find((entry) => entry.id === req.params.id || entry._id === req.params.id);
    if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    if (req.user?.role !== 'admin' && (!canModifyOrder(order, req.user) || !canDeleteOrder(order))) {
      return fail(res, 403, 'Order cannot be deleted', 'ORDER_NOT_DELETABLE');
    }
    req.memoryStore.orders = req.memoryStore.orders.filter((entry) => entry.id !== req.params.id && entry._id !== req.params.id);
    return ok(res, { ok: true });
  }

  if (useFirebase && req.db) {
    const ref = req.db.collection('orders').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    const order = mapDoc(doc);
    if (req.user?.role !== 'admin' && (!canModifyOrder(order, req.user) || !canDeleteOrder(order))) {
      return fail(res, 403, 'Order cannot be deleted', 'ORDER_NOT_DELETABLE');
    }
    await ref.delete();
    return ok(res, { ok: true });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
  if (req.user?.role !== 'admin' && (!canModifyOrder(order, req.user) || !canDeleteOrder(order))) {
    return fail(res, 403, 'Order cannot be deleted', 'ORDER_NOT_DELETABLE');
  }
  await order.deleteOne();
  return ok(res, { ok: true });
});

router.get('/:id/invoice', requireAuth, async (req, res) => {
  const orderId = req.params.id;
  let order = null;

  if (req.useMemory && req.memoryStore) {
    order = req.memoryStore.orders.find((entry) => entry.id === orderId || entry._id === orderId) || null;
  } else if (useFirebase && req.db) {
    const doc = await req.db.collection('orders').doc(orderId).get();
    order = doc.exists ? mapDoc(doc) : null;
  } else {
    order = await Order.findById(orderId);
  }

  if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
  if (!canModifyOrder(order, req.user, true)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');

  return ok(res, {
    invoiceNumber: order.invoiceNumber || createInvoiceNumber(order._id || order.id),
    invoiceIssuedAt: order.invoiceIssuedAt || order.createdAt || Date.now(),
    orderId: order._id || order.id,
    customerName: order.customerName || '',
    customerEmail: order.customerEmail || '',
    customerPhone: order.customerPhone || '',
    shippingAddress: order.shippingAddress || {},
    billingDetails: order.billingDetails || {},
    subtotalCents: order.subtotalCents || 0,
    shippingCents: order.shippingCents || 0,
    discountCents: order.discountCents || 0,
    taxCents: order.taxCents || 0,
    totalCents: order.totalCents || 0,
    gstRate: order.gstRate || 0.18,
    taxMode: order.taxMode || 'inclusive',
    items: order.items || [],
  });
});

export default router;
