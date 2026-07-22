import express from 'express';
import { z } from 'zod';
import Review from '../models/Review.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';

const router = express.Router();

const reviewSchema = z.object({
  productId: z.string().optional().default(''),
  slug: z.string().min(1).max(160),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(3).max(1200),
});
const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(3).max(1200),
});
const statusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

const serializeReview = (review) => {
  const item = review?.toObject ? review.toObject() : review;
  return {
    ...item,
    id: item._id || item.id,
  };
};

const summarize = (reviews = []) => {
  const approved = reviews.filter((review) => review.status === 'approved');
  const count = approved.length;
  const average = count ? approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) / count : 0;
  return { averageRating: Number(average.toFixed(1)), reviewCount: count };
};

router.get('/summary', async (_req, res) => {
  if (_req.useMemory && _req.memoryStore) {
    const reviews = _req.memoryStore.reviews || [];
    const grouped = reviews.filter((review) => review.status === 'approved').reduce((acc, review) => {
      if (!acc[review.slug]) acc[review.slug] = [];
      acc[review.slug].push(review);
      return acc;
    }, {});
    return ok(res, Object.fromEntries(Object.entries(grouped).map(([slug, items]) => [slug, summarize(items)])));
  }

  const reviews = await Review.find({ status: 'approved' }).lean();
  const grouped = reviews.reduce((acc, review) => {
    if (!acc[review.slug]) acc[review.slug] = [];
    acc[review.slug].push(review);
    return acc;
  }, {});
  ok(res, Object.fromEntries(Object.entries(grouped).map(([slug, items]) => [slug, summarize(items)])));
});

router.get('/product/:slug', async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const reviews = (req.memoryStore.reviews || [])
      .filter((review) => review.slug === req.params.slug && review.status === 'approved')
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return ok(res, { ...summarize(reviews), reviews });
  }

  const reviews = await Review.find({ slug: req.params.slug, status: 'approved' }).sort({ createdAt: -1 });
  ok(res, {
    ...summarize(reviews),
    reviews: reviews.map(serializeReview),
  });
});

router.get('/me/product/:slug', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const review = (req.memoryStore.reviews || []).find((item) => item.slug === req.params.slug && item.userId === String(req.user.sub));
    return ok(res, review || null);
  }

  const review = await Review.findOne({ slug: req.params.slug, userId: String(req.user.sub) });
  ok(res, review ? serializeReview(review) : null);
});

router.post('/', requireAuth, validate(reviewSchema), async (req, res) => {
  const payload = {
    productId: req.body.productId || '',
    slug: req.body.slug,
    rating: Number(req.body.rating),
    text: req.body.text,
    userId: String(req.user.sub),
    userName: req.user.name || req.user.email || 'Verified customer',
    status: 'pending',
  };

  if (req.useMemory && req.memoryStore) {
    req.memoryStore.reviews = req.memoryStore.reviews || [];
    const existingIndex = req.memoryStore.reviews.findIndex((review) => review.slug === payload.slug && review.userId === payload.userId);
    const item = {
      ...payload,
      id: existingIndex >= 0 ? req.memoryStore.reviews[existingIndex].id : String(Date.now()),
      _id: existingIndex >= 0 ? req.memoryStore.reviews[existingIndex]._id : String(Date.now()),
      createdAt: existingIndex >= 0 ? req.memoryStore.reviews[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) req.memoryStore.reviews[existingIndex] = item;
    else req.memoryStore.reviews.unshift(item);
    return ok(res, item, 201);
  }

  const review = await Review.findOneAndUpdate(
    { slug: payload.slug, userId: payload.userId },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  ok(res, serializeReview(review), 201);
});

router.put('/:id', requireAuth, validate(updateReviewSchema), async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const idx = (req.memoryStore.reviews || []).findIndex((review) => String(review.id || review._id) === String(req.params.id) && review.userId === String(req.user.sub));
    if (idx < 0) return fail(res, 404, 'Review not found', 'NOT_FOUND');
    req.memoryStore.reviews[idx] = { ...req.memoryStore.reviews[idx], rating: Number(req.body.rating), text: req.body.text, status: 'pending', updatedAt: new Date().toISOString() };
    return ok(res, req.memoryStore.reviews[idx]);
  }

  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, userId: String(req.user.sub) },
    { rating: Number(req.body.rating), text: req.body.text, status: 'pending' },
    { new: true }
  );
  if (!review) return fail(res, 404, 'Review not found', 'NOT_FOUND');
  ok(res, serializeReview(review));
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const before = (req.memoryStore.reviews || []).length;
    req.memoryStore.reviews = (req.memoryStore.reviews || []).filter((review) => {
      const matchesId = String(review.id || review._id) === String(req.params.id);
      const canDelete = req.user.role === 'admin' || review.userId === String(req.user.sub);
      return !(matchesId && canDelete);
    });
    if (req.memoryStore.reviews.length === before) return fail(res, 404, 'Review not found', 'NOT_FOUND');
    return ok(res, { ok: true });
  }

  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, userId: String(req.user.sub) };
  const deleted = await Review.findOneAndDelete(filter);
  if (!deleted) return fail(res, 404, 'Review not found', 'NOT_FOUND');
  ok(res, { ok: true });
});

router.get('/admin', requireAuth, requireAdmin, async (_req, res) => {
  if (_req.useMemory && _req.memoryStore) {
    return ok(res, (_req.memoryStore.reviews || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  }

  const reviews = await Review.find({}).sort({ createdAt: -1 });
  ok(res, reviews.map(serializeReview));
});

router.patch('/:id/status', requireAuth, requireAdmin, validate(statusSchema), async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const idx = (req.memoryStore.reviews || []).findIndex((review) => String(review.id || review._id) === String(req.params.id));
    if (idx < 0) return fail(res, 404, 'Review not found', 'NOT_FOUND');
    req.memoryStore.reviews[idx] = { ...req.memoryStore.reviews[idx], status: req.body.status, updatedAt: new Date().toISOString() };
    return ok(res, req.memoryStore.reviews[idx]);
  }

  const review = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!review) return fail(res, 404, 'Review not found', 'NOT_FOUND');
  ok(res, serializeReview(review));
});

export default router;
