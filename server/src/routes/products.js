import express from 'express';
import { z } from 'zod';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { findDefaultProductBySlug, getDefaultProducts } from '../lib/defaultProducts.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';

const router = express.Router();
const listSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc']).optional(),
});
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);

const mapDoc = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data?.() });
const normalizeSlug = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sanitizeStringMap = (value = {}) =>
  Object.fromEntries(
    Object.entries(value || {})
      .map(([key, entry]) => [String(key || '').trim(), String(entry || '').trim()])
      .filter(([key, entry]) => key && entry)
  );
const isValidImageReference = (value = '') =>
  String(value || '').startsWith('data:image/') ||
  /^https?:\/\//i.test(String(value || '')) ||
  String(value || '').startsWith('/');

const sanitizeProductPayload = (payload = {}) => ({
  name: String(payload.name || '').trim(),
  slug: normalizeSlug(payload.slug || payload.name || ''),
  category: String(payload.category || '').trim(),
  priceCents: Math.max(0, Number(payload.priceCents || 0)),
  currency: payload.currency || 'INR',
  stock: Math.max(0, Number(payload.stock || 0)),
  brand: String(payload.brand || '').trim(),
  description: String(payload.description || '').trim(),
  images: Array.isArray(payload.images) ? payload.images.filter((item) => isValidImageReference(item)).slice(0, 8) : [],
  highlights: Array.isArray(payload.highlights) ? payload.highlights.map((item) => String(item || '').trim()).filter(Boolean) : [],
  specs: sanitizeStringMap(payload.specs),
  featured: Boolean(payload.featured),
});

const filterDefaultProducts = (category) => {
  const products = getDefaultProducts();
  return category ? products.filter((product) => product.category === category) : products;
};

router.get('/', validate(listSchema, 'query'), async (req, res) => {
  const { category, brand, q } = req.query;
  const minPriceCents = req.query.minPrice ? Number(req.query.minPrice) * 100 : null;
  const maxPriceCents = req.query.maxPrice ? Number(req.query.maxPrice) * 100 : null;
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const sort = req.query.sort || 'newest';
  const hasPagingQuery = Boolean(req.query.page || req.query.limit || req.query.q || req.query.sort);
  const skip = (page - 1) * limit;
  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { priceCents: 1, _id: 1 },
    price_desc: { priceCents: -1, _id: 1 },
    name_asc: { name: 1, _id: 1 },
  };
  if (req.useMemory && req.memoryStore) {
    const all = req.memoryStore.products.length > 0 ? req.memoryStore.products : filterDefaultProducts(category);
    const filtered = all.filter((p) => {
      const byCat = category ? p.category === category : true;
      const text = String(q || '').trim().toLowerCase();
      const byBrand = brand ? String(p.brand || '').toLowerCase() === String(brand).toLowerCase() : true;
      const price = Number(p.priceCents || 0);
      const byMin = minPriceCents === null || price >= minPriceCents;
      const byMax = maxPriceCents === null || price <= maxPriceCents;
      const byQ = !text || [p.name, p.slug, p.description, p.brand].some((v) => String(v || '').toLowerCase().includes(text));
      return byCat && byBrand && byMin && byMax && byQ;
    });
    if (!hasPagingQuery) return ok(res, filtered);
    return ok(res, { items: filtered.slice(skip, skip + limit), total: filtered.length, page, limit });
  }

  if (useFirebase && req.db) {
    let ref = req.db.collection('products').orderBy('createdAt', 'desc');
    if (category) {
      ref = req.db.collection('products').where('category', '==', category).orderBy('createdAt', 'desc');
    }
    const snap = await ref.get();
    let products = snap.docs.map(mapDoc);
    if (q) {
      const text = String(q).toLowerCase();
      products = products.filter((p) => [p.name, p.slug, p.description, p.brand].some((v) => String(v || '').toLowerCase().includes(text)));
    }
    if (!hasPagingQuery) return ok(res, products);
    return ok(res, { items: products.slice(skip, skip + limit), total: products.length, page, limit });
  }

  const filter = category ? { category } : {};
  if (brand) filter.brand = new RegExp(`^${String(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  if (minPriceCents !== null || maxPriceCents !== null) {
    filter.priceCents = {};
    if (minPriceCents !== null) filter.priceCents.$gte = minPriceCents;
    if (maxPriceCents !== null) filter.priceCents.$lte = maxPriceCents;
  }
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { slug: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { brand: { $regex: q, $options: 'i' } },
  ];
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  const normalizedItems = items.length > 0 ? items : filterDefaultProducts(category).slice(skip, skip + limit);
  if (!hasPagingQuery) return ok(res, normalizedItems);
  ok(res, { items: normalizedItems, total, page, limit });
});

router.get('/id/:id', async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const product = req.memoryStore.products.find((p) => p.id === req.params.id || p._id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json(product);
  }

  if (useFirebase && req.db) {
    const doc = await req.db.collection('products').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    return res.json(mapDoc(doc));
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  return res.json(product);
});

router.get('/:slug', async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const product = req.memoryStore.products.find((p) => p.slug === req.params.slug);
    const fallbackProduct = findDefaultProductBySlug(req.params.slug);
    if (!product && !fallbackProduct) return fail(res, 404, 'Not found', 'NOT_FOUND');
    return ok(res, product || fallbackProduct);
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('products').where('slug', '==', req.params.slug).limit(1).get();
    if (!snap.empty) return ok(res, mapDoc(snap.docs[0]));
    const fallbackProduct = findDefaultProductBySlug(req.params.slug);
    if (!fallbackProduct) return fail(res, 404, 'Not found', 'NOT_FOUND');
    return ok(res, fallbackProduct);
  }

  const product = await Product.findOne({ slug: req.params.slug });
  if (product) return ok(res, product);
  const fallbackProduct = findDefaultProductBySlug(req.params.slug);
  if (!fallbackProduct) return fail(res, 404, 'Not found', 'NOT_FOUND');
  ok(res, fallbackProduct);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const productPayload = sanitizeProductPayload(req.body);
    if (!productPayload.name || !productPayload.slug || !productPayload.category) {
      return res.status(400).json({ error: 'Name, slug, and category are required' });
    }

    if (req.useMemory && req.memoryStore) {
      const exists = req.memoryStore.products.find((p) => p.slug === productPayload.slug);
      if (exists) return res.status(400).json({ error: 'Slug already exists' });
      const product = { ...productPayload, _id: String(Date.now()), id: String(Date.now()), createdAt: Date.now(), updatedAt: Date.now() };
      req.memoryStore.products.unshift(product);
      return res.status(201).json(product);
    }

    if (useFirebase && req.db) {
      const existing = await req.db.collection('products').where('slug', '==', productPayload.slug).limit(1).get();
      if (!existing.empty) return res.status(400).json({ error: 'Slug already exists' });
      const payload = { ...productPayload, createdAt: Date.now(), updatedAt: Date.now() };
      const ref = await req.db.collection('products').add(payload);
      const doc = await ref.get();
      return res.status(201).json(mapDoc(doc));
    }

    const existing = await Product.findOne({ slug: productPayload.slug });
    if (existing) return res.status(400).json({ error: 'Slug already exists' });
    const product = await Product.create(productPayload);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const productPayload = sanitizeProductPayload(req.body);
  if (!productPayload.name || !productPayload.slug || !productPayload.category) {
    return res.status(400).json({ error: 'Name, slug, and category are required' });
  }

  if (req.useMemory && req.memoryStore) {
    const duplicate = req.memoryStore.products.find((p) => (p.id !== req.params.id && p._id !== req.params.id) && p.slug === productPayload.slug);
    if (duplicate) return res.status(400).json({ error: 'Slug already exists' });
    req.memoryStore.products = req.memoryStore.products.map((p) => (p.id === req.params.id || p._id === req.params.id ? { ...p, ...productPayload, updatedAt: Date.now() } : p));
    const product = req.memoryStore.products.find((p) => p.id === req.params.id || p._id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json(product);
  }

  if (useFirebase && req.db) {
    const ref = req.db.collection('products').doc(req.params.id);
    const existing = await req.db.collection('products').where('slug', '==', productPayload.slug).limit(5).get();
    const duplicate = existing.docs.find((doc) => doc.id !== req.params.id);
    if (duplicate) return res.status(400).json({ error: 'Slug already exists' });
    await ref.update({ ...productPayload, updatedAt: Date.now() });
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    return res.json(mapDoc(doc));
  }

  const duplicate = await Product.findOne({ slug: productPayload.slug, _id: { $ne: req.params.id } });
  if (duplicate) return res.status(400).json({ error: 'Slug already exists' });
  const updated = await Product.findByIdAndUpdate(req.params.id, productPayload, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
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
