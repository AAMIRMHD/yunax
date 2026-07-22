import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';
import { sendMail, templateOrderPaid } from '../lib/mailer.js';

const router = express.Router();
const createPaymentSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.coerce.number().int().min(1).max(20).default(1),
  })).min(1),
  shippingAddress: z.any().optional(),
  billingDetails: z.any().optional(),
});
const verifySchema = z.object({
  razorpay_order_id: z.string().min(5),
  razorpay_payment_id: z.string().min(5),
  razorpay_signature: z.string().min(5),
});

const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

const buildPaymentItems = (items, productMap) =>
  items.map((i) => {
    const p = productMap[i.productId];
    if (!p) throw new Error(`Product not found: ${i.productId}`);
    const quantity = Math.max(1, Number(i.quantity || 1));
    const stock = Number(p.stock ?? 0);
    if (stock >= 0 && stock < quantity) {
      throw new Error(`Only ${stock} item(s) left for ${p.name || 'this product'}`);
    }
    return {
      productId: i.productId,
      name: p.name,
      priceCents: p.priceCents,
      quantity,
      image: p.images?.[0] || '',
    };
  });

router.post('/create-order', requireAuth, validate(createPaymentSchema), async (req, res) => {
  try {
    const { items, shippingAddress, billingDetails } = req.body;
    if (!items || !items.length) return fail(res, 400, 'No items');
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return fail(res, 400, 'Razorpay keys are not configured on the server');
    }

    // In-memory mode
    if (req.useMemory && req.memoryStore) {
      const productMap = Object.fromEntries(req.memoryStore.products.map((p) => [p.id || p._id, p]));
      const enriched = buildPaymentItems(items, productMap);
      const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
      const razorOrder = await razor.orders.create({ amount: totalCents, currency: 'INR', receipt: `rcpt_${Date.now()}` });
      const order = {
        _id: String(Date.now()),
        id: String(Date.now()),
        userId: req.user.sub,
        items: enriched,
        totalCents,
        status: 'pending',
        paymentMethod: 'razorpay',
        paymentStatus: 'pending',
        customerEmail: req.user.email || '',
        customerName: shippingAddress?.fullName || req.user.name || '',
        customerPhone: shippingAddress?.phone || '',
        shippingAddress: shippingAddress || {},
        billingDetails: billingDetails || {},
        razorpayOrderId: razorOrder.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      req.memoryStore.orders.unshift(order);
      return ok(res, { orderId: razorOrder.id, amount: totalCents, currency: 'INR', keyId: razor.key_id, dbOrderId: order._id });
    }

    // Firestore mode is currently unsupported for payments
    if (req.useFirebase) {
      return fail(res, 501, 'Payments not enabled for Firebase mode');
    }

    // MongoDB mode
    const productDocs = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
    const map = Object.fromEntries(productDocs.map((p) => [p._id.toString(), p]));
    const enriched = buildPaymentItems(items, map).map((item) => ({
      ...item,
      productId: map[item.productId]._id,
    }));
    const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    const razorOrder = await razor.orders.create({
      amount: totalCents,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    const order = await Order.create({
      userId: req.user.sub,
      items: enriched,
      totalCents,
      status: 'pending',
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      customerEmail: req.user.email || '',
      customerName: shippingAddress?.fullName || req.user.name || '',
      customerPhone: shippingAddress?.phone || '',
      shippingAddress: shippingAddress || {},
      billingDetails: billingDetails || {},
      razorpayOrderId: razorOrder.id,
    });
    ok(res, { orderId: razorOrder.id, amount: totalCents, currency: 'INR', keyId: razor.key_id, dbOrderId: order._id });
  } catch (err) {
    console.error(err);
    fail(res, 400, err.message || 'Failed to create order');
  }
});

router.post('/verify', requireAuth, validate(verifySchema), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return fail(res, 400, 'Missing payment verification fields');
  }
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
    .update(payload)
    .digest('hex');
  if (expected !== razorpay_signature) return fail(res, 400, 'Invalid signature');

  // In-memory mode
  if (req.useMemory && req.memoryStore) {
    const order = req.memoryStore.orders.find((o) => o.razorpayOrderId === razorpay_order_id && o.userId === req.user.sub);
    if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    order.status = 'placed';
    order.paymentMethod = order.paymentMethod || 'razorpay';
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.updatedAt = Date.now();

    // decrement stock
    order.items.forEach((i) => {
      const pIdx = req.memoryStore.products.findIndex((p) => p.id === i.productId || p._id === i.productId);
      if (pIdx >= 0) {
        req.memoryStore.products[pIdx].stock = Math.max(0, (req.memoryStore.products[pIdx].stock || 0) - (i.quantity || 0));
      }
    });

    if (order.customerEmail) {
      await sendMail({ to: order.customerEmail, ...templateOrderPaid({ name: order.customerName || 'Customer', orderId: order._id || order.id }) });
    }
    return ok(res, { verified: true });
  }

  if (req.useFirebase) {
    return fail(res, 501, 'Payments not enabled for Firebase mode');
  }

  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user.sub }).session(session);
      if (!order) throw new Error('Order not found');
      if (order.paymentStatus === 'paid') return;
      for (const i of order.items) {
        const updated = await Product.findOneAndUpdate(
          { _id: i.productId, stock: { $gte: i.quantity } },
          { $inc: { stock: -i.quantity } },
          { new: true, session }
        );
        if (!updated) throw new Error(`Insufficient stock for ${i.name}`);
      }
      order.status = 'placed';
      order.paymentMethod = order.paymentMethod || 'razorpay';
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpay_payment_id;
      order.razorpaySignature = razorpay_signature;
      await order.save({ session });
    });
    if (!order) return fail(res, 404, 'Order not found', 'NOT_FOUND');
    if (order.customerEmail) {
      await sendMail({ to: order.customerEmail, ...templateOrderPaid({ name: order.customerName || 'Customer', orderId: order._id }) });
    }
    return ok(res, { verified: true });
  } catch (err) {
    if (err.message === 'Order not found') return fail(res, 404, 'Order not found', 'NOT_FOUND');
    return fail(res, 400, err.message || 'Payment verification failed');
  } finally {
    await session.endSession();
  }
});

export default router;
