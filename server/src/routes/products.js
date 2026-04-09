import express from 'express';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);

const mapDoc = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data?.() });

router.get('/', async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const { category } = req.query;
    const list = category ? req.memoryStore.products.filter((p) => p.category === category) : req.memoryStore.products;
    return res.json(list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }

  if (useFirebase && req.db) {
    const { category } = req.query;
    let ref = req.db.collection('products').orderBy('createdAt', 'desc');
    if (category) {
      ref = req.db.collection('products').where('category', '==', category).orderBy('createdAt', 'desc');
    }
    const snap = await ref.get();
    return res.json(snap.docs.map(mapDoc));
  }

  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

router.get('/:slug', async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const product = req.memoryStore.products.find((p) => p.slug === req.params.slug);
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json(product);
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('products').where('slug', '==', req.params.slug).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Not found' });
    return res.json(mapDoc(snap.docs[0]));
  }

  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.useMemory && req.memoryStore) {
      const product = { ...req.body, _id: String(Date.now()), id: String(Date.now()), createdAt: Date.now(), updatedAt: Date.now() };
      req.memoryStore.products.unshift(product);
      return res.status(201).json(product);
    }

    if (useFirebase && req.db) {
      const payload = { ...req.body, createdAt: Date.now(), updatedAt: Date.now() };
      const ref = await req.db.collection('products').add(payload);
      const doc = await ref.get();
      return res.status(201).json(mapDoc(doc));
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    req.memoryStore.products = req.memoryStore.products.map((p) => (p.id === req.params.id || p._id === req.params.id ? { ...p, ...req.body, updatedAt: Date.now() } : p));
    const product = req.memoryStore.products.find((p) => p.id === req.params.id || p._id === req.params.id);
    return res.json(product);
  }

  if (useFirebase && req.db) {
    const ref = req.db.collection('products').doc(req.params.id);
    await ref.update({ ...req.body, updatedAt: Date.now() });
    const doc = await ref.get();
    return res.json(mapDoc(doc));
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    req.memoryStore.products = req.memoryStore.products.filter((p) => p.id !== req.params.id && p._id !== req.params.id);
    return res.json({ ok: true });
  }

  if (useFirebase && req.db) {
    await req.db.collection('products').doc(req.params.id).delete();
    return res.json({ ok: true });
  }

  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
