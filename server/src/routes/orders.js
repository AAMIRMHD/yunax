import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);

const mapDoc = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data?.() });

router.get('/', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const list = req.user.role === 'admin' ? req.memoryStore.orders : req.memoryStore.orders.filter((o) => o.userId === req.user.sub);
    return res.json(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }

  if (useFirebase && req.db) {
    let ref = req.db.collection('orders').orderBy('createdAt', 'desc');
    if (req.user.role !== 'admin') {
      ref = req.db.collection('orders').where('userId', '==', req.user.sub).orderBy('createdAt', 'desc');
    }
    const snap = await ref.get();
    return res.json(snap.docs.map(mapDoc));
  }

  const filter = req.user.role === 'admin' ? {} : { userId: req.user.sub };
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
});

router.post('/', requireAuth, async (req, res) => {
  const { items } = req.body; // [{productId, quantity}]
  if (!items || !items.length) return res.status(400).json({ error: 'No items' });
  if (req.useMemory && req.memoryStore) {
    const productMap = Object.fromEntries(req.memoryStore.products.map((p) => [p.id || p._id, p]));
    const enriched = items.map((i) => {
      const p = productMap[i.productId];
      return {
        productId: i.productId,
        name: p?.name || 'Unknown',
        priceCents: p?.priceCents || 0,
        quantity: i.quantity,
        image: p?.images?.[0] || '',
      };
    });
    const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    const order = {
      _id: String(Date.now()),
      id: String(Date.now()),
      userId: req.user.sub,
      items: enriched,
      totalCents,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    req.memoryStore.orders.unshift(order);
    return res.status(201).json(order);
  }

  if (useFirebase && req.db) {
    const productDocs = await Promise.all(items.map((i) => req.db.collection('products').doc(i.productId).get()));
    const productMap = Object.fromEntries(productDocs.filter((d) => d.exists).map((d) => [d.id, d.data()]));
    const enriched = items.map((i) => {
      const p = productMap[i.productId];
      return {
        productId: i.productId,
        name: p?.name || 'Unknown',
        priceCents: p?.priceCents || 0,
        quantity: i.quantity,
        image: p?.images?.[0] || '',
      };
    });
    const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    const ref = await req.db.collection('orders').add({
      userId: req.user.sub,
      items: enriched,
      totalCents,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const doc = await ref.get();
    return res.status(201).json(mapDoc(doc));
  }

  const productDocs = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const productMap = Object.fromEntries(productDocs.map((p) => [p._id.toString(), p]));
  const enriched = items.map((i) => {
    const p = productMap[i.productId];
    return {
      productId: p._id,
      name: p.name,
      priceCents: p.priceCents,
      quantity: i.quantity,
      image: p.images?.[0] || '',
    };
  });
  const totalCents = enriched.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const order = await Order.create({ userId: req.user.sub, items: enriched, totalCents, status: 'pending' });
  res.status(201).json(order);
});

export default router;
