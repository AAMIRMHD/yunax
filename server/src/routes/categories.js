import express from 'express';
import { z } from 'zod';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';
import { getDefaultProducts } from '../lib/defaultProducts.js';

const router = express.Router();

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(100).optional().default(''),
  image: z.string().trim().max(4000).optional().default(''),
  description: z.string().trim().max(280).optional().default(''),
});

const normalizeSlug = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const serialize = (category) => {
  const item = category?.toObject ? category.toObject() : category;
  return { ...item, id: item._id || item.id };
};

router.get('/', async (_req, res) => {
  if (_req.useMemory && _req.memoryStore) {
    const saved = _req.memoryStore.categories || [];
    const fallbackCategories = getDefaultProducts().map((product) => product.category).filter(Boolean);
    const existingNames = new Set(saved.map((category) => category.name));
    const productCategories = (_req.memoryStore.products || []).map((product) => product.category).filter(Boolean);
    const derived = Array.from(new Set([...productCategories, ...fallbackCategories]))
      .filter((name) => name && !existingNames.has(name))
      .sort()
      .map((name) => ({ id: normalizeSlug(name), name, slug: normalizeSlug(name), image: '', description: '' }));
    return ok(res, [...saved, ...derived]);
  }

  const saved = await Category.find({}).sort({ name: 1 }).lean();
  const productCategories = await Product.distinct('category');
  const fallbackCategories = getDefaultProducts().map((product) => product.category).filter(Boolean);
  const existingNames = new Set(saved.map((category) => category.name));
  const derived = Array.from(new Set([...productCategories, ...fallbackCategories]))
    .filter((name) => name && !existingNames.has(name))
    .sort()
    .map((name) => ({ id: normalizeSlug(name), name, slug: normalizeSlug(name), image: '', description: '' }));
  ok(res, [...saved.map(serialize), ...derived]);
});

router.post('/', requireAuth, requireAdmin, validate(categorySchema), async (req, res) => {
  const payload = {
    name: req.body.name,
    slug: normalizeSlug(req.body.slug || req.body.name),
    image: req.body.image || '',
    description: req.body.description || '',
  };
  if (req.useMemory && req.memoryStore) {
    req.memoryStore.categories = req.memoryStore.categories || [];
    const exists = req.memoryStore.categories.find((category) => category.slug === payload.slug);
    if (exists) return fail(res, 400, 'Category already exists', 'CONFLICT');
    const category = { ...payload, id: String(Date.now()), _id: String(Date.now()), createdAt: Date.now(), updatedAt: Date.now() };
    req.memoryStore.categories.unshift(category);
    return ok(res, category, 201);
  }

  const exists = await Category.findOne({ slug: payload.slug });
  if (exists) return fail(res, 400, 'Category already exists', 'CONFLICT');
  const category = await Category.create(payload);
  ok(res, serialize(category), 201);
});

router.put('/:id', requireAuth, requireAdmin, validate(categorySchema), async (req, res) => {
  const payload = {
    name: req.body.name,
    slug: normalizeSlug(req.body.slug || req.body.name),
    image: req.body.image || '',
    description: req.body.description || '',
  };
  if (req.useMemory && req.memoryStore) {
    const duplicate = (req.memoryStore.categories || []).find((category) => category.slug === payload.slug && String(category.id || category._id) !== String(req.params.id));
    if (duplicate) return fail(res, 400, 'Category slug already exists', 'CONFLICT');
    const idx = (req.memoryStore.categories || []).findIndex((category) => String(category.id || category._id) === String(req.params.id));
    if (idx < 0) return fail(res, 404, 'Category not found', 'NOT_FOUND');
    req.memoryStore.categories[idx] = { ...req.memoryStore.categories[idx], ...payload, updatedAt: Date.now() };
    return ok(res, req.memoryStore.categories[idx]);
  }

  const duplicate = await Category.findOne({ slug: payload.slug, _id: { $ne: req.params.id } });
  if (duplicate) return fail(res, 400, 'Category slug already exists', 'CONFLICT');
  const category = await Category.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!category) return fail(res, 404, 'Category not found', 'NOT_FOUND');
  ok(res, serialize(category));
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const before = (req.memoryStore.categories || []).length;
    req.memoryStore.categories = (req.memoryStore.categories || []).filter((category) => String(category.id || category._id) !== String(req.params.id));
    if (req.memoryStore.categories.length === before) return fail(res, 404, 'Category not found', 'NOT_FOUND');
    return ok(res, { ok: true });
  }

  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) return fail(res, 404, 'Category not found', 'NOT_FOUND');
  ok(res, { ok: true });
});

export default router;
