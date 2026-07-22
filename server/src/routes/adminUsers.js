import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';

const router = express.Router();
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  name: z.string().max(80).optional().default(''),
  role: z.enum(['user', 'admin']).default('user'),
});
const updateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().max(80).default(''),
  role: z.enum(['user', 'admin']).default('user'),
  password: z.string().min(6).max(72).optional(),
});

const mapDoc = (doc) => ({ id: doc.id, _id: doc.id, ...doc.data?.() });
const normalizeUserPayload = (payload = {}) => ({
  email: String(payload.email || '').trim().toLowerCase(),
  name: String(payload.name || '').trim(),
  role: payload.role === 'admin' ? 'admin' : 'user',
});

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.useMemory && req.memoryStore) {
      return ok(res, req.memoryStore.users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, emailVerified: Boolean(u.emailVerified) })));
    }

    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').orderBy('createdAt', 'desc').get();
      return ok(res, snap.docs.map((d) => {
        const data = mapDoc(d);
        delete data.password;
        return data;
      }));
    }

    const users = await User.find().sort({ createdAt: -1 }).select('email name role emailVerified createdAt');
    ok(res, users);
  } catch (err) {
    fail(res, 500, 'Failed to load users', 'INTERNAL_ERROR');
  }
});

router.post('/', requireAuth, requireAdmin, validate(createUserSchema), async (req, res) => {
  const { email, password, name = '', role = 'user' } = req.body;

  try {
    if (req.useMemory && req.memoryStore) {
      const exists = req.memoryStore.users.find((u) => u.email === email);
      if (exists) return fail(res, 400, 'User exists', 'CONFLICT');
      const hash = await bcrypt.hash(password, 10);
      const user = {
        id: String(Date.now()),
        email,
        name,
        role,
        password: hash,
        emailVerified: true,
        otpCodeHash: '',
        otpExpiresAt: null,
        createdAt: Date.now(),
      };
      req.memoryStore.users.unshift(user);
      const { password: _, ...safe } = user;
      return ok(res, safe, 201);
    }

    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
      if (!snap.empty) return fail(res, 400, 'User exists', 'CONFLICT');
      const hash = await bcrypt.hash(password, 10);
      const ref = await req.db.collection('users').add({
        email,
        name,
        role,
        password: hash,
        emailVerified: true,
        otpCodeHash: '',
        otpExpiresAt: null,
        createdAt: Date.now(),
      });
      const doc = await ref.get();
      const data = mapDoc(doc);
      delete data.password;
      return ok(res, data, 201);
    }

    const exists = await User.findOne({ email });
    if (exists) return fail(res, 400, 'User exists', 'CONFLICT');
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      name,
      role,
      emailVerified: true,
      otpCodeHash: '',
      otpExpiresAt: null,
    });
    ok(res, { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified }, 201);
  } catch (err) {
    fail(res, 500, 'Failed to create user', 'INTERNAL_ERROR');
  }
});

router.put('/:id', requireAuth, requireAdmin, validate(updateUserSchema), async (req, res) => {
  const { email, name, role } = normalizeUserPayload(req.body);
  const password = String(req.body.password || '').trim();

  if (!email) return fail(res, 400, 'Email required');

  try {
    if (req.useMemory && req.memoryStore) {
      const duplicate = req.memoryStore.users.find((u) => u.email === email && u.id !== req.params.id);
      if (duplicate) return fail(res, 400, 'Email already in use', 'CONFLICT');

      req.memoryStore.users = await Promise.all(
        req.memoryStore.users.map(async (user) => {
          if (user.id !== req.params.id) return user;
          const nextUser = { ...user, email, name, role, updatedAt: Date.now() };
          if (password) nextUser.password = await bcrypt.hash(password, 10);
          return nextUser;
        })
      );

      const user = req.memoryStore.users.find((entry) => entry.id === req.params.id);
      if (!user) return fail(res, 404, 'User not found', 'NOT_FOUND');
      const { password: _, ...safe } = user;
      return ok(res, safe);
    }

    if (useFirebase && req.db) {
      const ref = req.db.collection('users').doc(req.params.id);
      const doc = await ref.get();
      if (!doc.exists) return fail(res, 404, 'User not found', 'NOT_FOUND');

      const existing = await req.db.collection('users').where('email', '==', email).limit(5).get();
      const duplicate = existing.docs.find((entry) => entry.id !== req.params.id);
      if (duplicate) return fail(res, 400, 'Email already in use', 'CONFLICT');

      const updatePayload = { email, name, role, updatedAt: Date.now() };
      if (password) updatePayload.password = await bcrypt.hash(password, 10);
      await ref.update(updatePayload);
      const updatedDoc = await ref.get();
      const data = mapDoc(updatedDoc);
      delete data.password;
      return ok(res, data);
    }

    const duplicate = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (duplicate) return fail(res, 400, 'Email already in use', 'CONFLICT');

    const updatePayload = { email, name, role };
    if (password) updatePayload.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, updatePayload, { new: true }).select('email name role createdAt updatedAt');
    if (!user) return fail(res, 404, 'User not found', 'NOT_FOUND');
    return ok(res, { id: user._id, _id: user._id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt });
  } catch (err) {
    fail(res, 500, 'Failed to update user', 'INTERNAL_ERROR');
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (String(req.user.sub) === String(req.params.id)) {
      return fail(res, 400, 'You cannot delete your own admin account');
    }

    if (req.useMemory && req.memoryStore) {
      const before = req.memoryStore.users.length;
      req.memoryStore.users = req.memoryStore.users.filter((user) => user.id !== req.params.id);
      if (req.memoryStore.users.length === before) return fail(res, 404, 'User not found', 'NOT_FOUND');
      return ok(res, { ok: true });
    }

    if (useFirebase && req.db) {
      const ref = req.db.collection('users').doc(req.params.id);
      const doc = await ref.get();
      if (!doc.exists) return fail(res, 404, 'User not found', 'NOT_FOUND');
      await ref.delete();
      return ok(res, { ok: true });
    }

    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return fail(res, 404, 'User not found', 'NOT_FOUND');
    return ok(res, { ok: true });
  } catch (err) {
    fail(res, 500, 'Failed to delete user', 'INTERNAL_ERROR');
  }
});

export default router;
