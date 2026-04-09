import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { items } = req.body; // [{productId, quantity}]
    if (!items || !items.length) return res.status(400).json({ error: 'No items' });

    // In-memory mode
    if (req.useMemory && req.memoryStore) {
      const productMap = Object.fromEntries(req.memoryStore.products.map((p) => [p.id || p._id, p]));
      const enriched = items.map((i) => {
        const p = productMap[i.productId];
        if (!p) throw new Error('Product not found');
        return {
          productId: i.productId,
          name: p.name,
          priceCents: p.priceCents,
          quantity: i.quantity,
          image: p.images?.[0] || '',
        };
      });
      const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
      const razorOrder = await razor.orders.create({ amount: totalCents, currency: 'INR', receipt: `rcpt_${Date.now()}` });
      const order = {
        _id: String(Date.now()),
        id: String(Date.now()),
        userId: req.user.sub,
        items: enriched,
        totalCents,
        status: 'pending',
        razorpayOrderId: razorOrder.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      req.memoryStore.orders.unshift(order);
      return res.json({ orderId: razorOrder.id, amount: totalCents, currency: 'INR', keyId: razor.key_id, dbOrderId: order._id });
    }

    // Firestore mode is currently unsupported for payments
    if (req.useFirebase) {
      return res.status(501).json({ error: 'Payments not enabled for Firebase mode' });
    }

    // MongoDB mode
    const productDocs = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
    const map = Object.fromEntries(productDocs.map((p) => [p._id.toString(), p]));
    const enriched = items.map((i) => {
      const p = map[i.productId];
      if (!p) throw new Error('Product not found');
      return {
        productId: p._id,
        name: p.name,
        priceCents: p.priceCents,
        quantity: i.quantity,
        image: p.images?.[0] || '',
      };
    });
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
      razorpayOrderId: razorOrder.id,
    });
    res.json({ orderId: razorOrder.id, amount: totalCents, currency: 'INR', keyId: razor.key_id, dbOrderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
    .update(payload)
    .digest('hex');
  if (expected !== razorpay_signature) return res.status(400).json({ verified: false, error: 'Invalid signature' });

  // In-memory mode
  if (req.useMemory && req.memoryStore) {
    const order = req.memoryStore.orders.find((o) => o.razorpayOrderId === razorpay_order_id && o.userId === req.user.sub);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = 'paid';
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

    return res.json({ verified: true });
  }

  if (req.useFirebase) {
    return res.status(501).json({ error: 'Payments not enabled for Firebase mode' });
  }

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user.sub });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = 'paid';
  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  await order.save();

  // decrement stock
  await Promise.all(
    order.items.map((i) => Product.findByIdAndUpdate(i.productId, { $inc: { stock: -i.quantity } }))
  );

  res.json({ verified: true });
});

export default router;
