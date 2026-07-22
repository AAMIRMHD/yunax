import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';
import { isMailConfigured, sendMail, templateOtpEmail, templateResetEmail, templateResetOtpEmail } from '../lib/mailer.js';
import { findDefaultProductBySlug, getDefaultProducts } from '../lib/defaultProducts.js';

const router = express.Router();

const signToken = (user) => jwt.sign({ sub: user.id || user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const normalizeEmail = (value = '') => value.trim().toLowerCase();
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts. Please try again later.' },
});
const parseProfileName = (value = '') => String(value || '').trim().slice(0, 80);

const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
router.use(loginLimiter);

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(72),
  name: z.string().trim().max(80).optional().default(''),
});
const adminSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().trim().max(80).optional().default(''),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(6).max(72),
    confirmPassword: z.string().min(6).max(72).optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
const otpRequestSchema = z.object({ email: z.string().email() });
const otpVerifySchema = z.object({ email: z.string().email(), otp: z.string().regex(/^\d{6}$/) });
const verifyResetOtpSchema = z.object({ email: z.string().email(), otp: z.string().regex(/^\d{6}$/) });
const meUpdateSchema = z.object({ name: z.string().trim().min(1).max(80), email: z.string().email() });
const addressSchema = z.object({
  id: z.string().min(1).max(80),
  fullName: z.string().trim().max(120).default(''),
  phone: z.string().trim().max(30).default(''),
  line1: z.string().trim().max(180).default(''),
  city: z.string().trim().max(80).default(''),
  state: z.string().trim().max(80).default(''),
  pincode: z.string().trim().max(20).default(''),
  isDefault: z.boolean().optional().default(false),
});
const addressBookSchema = z.object({ addresses: z.array(addressSchema).max(20) });
const wishlistSchema = z.object({
  productId: z.string().optional(),
  slug: z.string().min(1).max(160),
});
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts. Please try again later.' },
});

const hashToken = (v) => crypto.createHash('sha256').update(v).digest('hex');
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const generateFreshOtp = (currentHash = '') => {
  let otp = generateOtp();
  while (currentHash && hashToken(otp) === currentHash) otp = generateOtp();
  return otp;
};
const getOtpExpiry = () => Date.now() + 10 * 60 * 1000;
const normalizeWishlistItem = (product = {}) => ({
  productId: String(product._id || product.id || product.productId || ''),
  slug: String(product.slug || '').trim(),
  name: String(product.name || '').trim(),
  priceCents: Math.max(0, Number(product.priceCents || 0)),
  category: String(product.category || '').trim(),
  image: Array.isArray(product.images) ? product.images.find(Boolean) || '' : String(product.image || ''),
  addedAt: product.addedAt || new Date(),
});

const resolveWishlistProduct = async (req, { slug, productId }) => {
  const id = String(productId || '').trim();
  const normalizedSlug = String(slug || '').trim();

  if (req.useMemory && req.memoryStore) {
    const product =
      req.memoryStore.products.find((p) => p.slug === normalizedSlug || p.id === id || p._id === id) ||
      findDefaultProductBySlug(normalizedSlug) ||
      getDefaultProducts().find((p) => String(p.id || p._id || '') === id);
    return product || null;
  }

  if (useFirebase && req.db) {
    if (normalizedSlug) {
      const snap = await req.db.collection('products').where('slug', '==', normalizedSlug).limit(1).get();
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
    if (id) {
      const doc = await req.db.collection('products').doc(id).get();
      if (doc.exists) return { id: doc.id, ...doc.data() };
    }
    return findDefaultProductBySlug(normalizedSlug) || null;
  }

  const product =
    (normalizedSlug ? await Product.findOne({ slug: normalizedSlug }) : null) ||
    (id ? await Product.findById(id).catch(() => null) : null) ||
    findDefaultProductBySlug(normalizedSlug);
  return product ? (product.toObject ? product.toObject() : product) : null;
};

const sortWishlist = (items = []) =>
  [...items].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
const shouldExposeOtp = () => process.env.NODE_ENV !== 'production' && process.env.EXPOSE_DEV_OTP !== 'false';
const ensureMailAvailable = (res) => {
  if (process.env.NODE_ENV === 'test') return true;
  if (isMailConfigured() || process.env.NODE_ENV !== 'production') return true;
  fail(
    res,
    503,
    'Email service is not configured yet. Add SMTP settings on the server before using signup recovery or OTP emails.',
    'MAIL_NOT_CONFIGURED'
  );
  return false;
};

const sendOtpMail = async ({ email, name, otp }) => {
  if (isMailConfigured() || process.env.NODE_ENV === 'test') {
    await sendMail({ to: email, ...templateOtpEmail({ name: name || 'User', otp }) });
    return true;
  }

  if (process.env.NODE_ENV === 'production') {
    const error = new Error('Email service is not configured yet. Add SMTP settings on the server before using OTP verification.');
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }

  console.log(`[DEV_OTP_FALLBACK] Verification code for ${email} is ${otp}`);
  return false;
};

const buildOtpResponse = ({ sent, otp }) => ({
  ok: true,
  sent,
  message: sent
    ? 'Verification code sent to your email.'
    : 'Verification code generated. Configure SMTP to send it by email.',
  ...(shouldExposeOtp() ? { devOtp: otp } : {}),
});

const buildPublicUser = (user) => ({
  id: user.id || user._id,
  email: user.email,
  name: user.name || '',
  role: user.role || 'user',
  addresses: Array.isArray(user.addresses) ? user.addresses : [],
  emailVerified: Boolean(user.emailVerified),
});

const normalizeAddresses = (addresses = []) =>
  addresses.map((address, index) => ({
    id: String(address.id || `addr-${Date.now()}-${index}`),
    fullName: String(address.fullName || '').trim(),
    phone: String(address.phone || '').trim(),
    line1: String(address.line1 || '').trim(),
    city: String(address.city || '').trim(),
    state: String(address.state || '').trim(),
    pincode: String(address.pincode || '').trim(),
    isDefault: Boolean(address.isDefault),
  }));

const hasExistingAdmin = async (req) => {
  if (req.useMemory && req.memoryStore) {
    return req.memoryStore.users.some((user) => user.role === 'admin');
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('role', '==', 'admin').limit(1).get();
    return !snap.empty;
  }

  return Boolean(await User.exists({ role: 'admin' }));
};

router.post('/signup', validate(signupSchema), async (req, res) => {
  const { password, name } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email || !password) return fail(res, 400, 'Email and password required');
  if (!isValidEmail(email)) return fail(res, 400, 'Invalid email address');
  const safeName = parseProfileName(name);
  if (req.useMemory && req.memoryStore) {
    const exists = req.memoryStore.users.find((u) => u.email === email);
    if (exists) return fail(res, 400, 'User exists', 'CONFLICT');
    const hash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const user = {
      id: String(Date.now()),
      email,
      name: safeName,
      password: hash,
      role: 'user',
      emailVerified: false,
      otpCodeHash: hashToken(otp),
      otpExpiresAt: getOtpExpiry(),
    };
    req.memoryStore.users.push(user);
    const sent = await sendOtpMail({ email, name: safeName, otp });
    return ok(res, { requiresVerification: true, user: buildPublicUser(user), verification: buildOtpResponse({ sent, otp }) }, 201);
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
    if (!snap.empty) return fail(res, 400, 'User exists', 'CONFLICT');
    const hash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const ref = await req.db.collection('users').add({
      email, password: hash, name: safeName, role: 'user', createdAt: Date.now(),
      emailVerified: false, otpCodeHash: hashToken(otp), otpExpiresAt: getOtpExpiry(),
    });
    const user = { id: ref.id, email, name: safeName, role: 'user', emailVerified: false };
    const sent = await sendOtpMail({ email, name: safeName, otp });
    return ok(res, { requiresVerification: true, user: buildPublicUser(user), verification: buildOtpResponse({ sent, otp }) }, 201);
  }

  const exists = await User.findOne({ email });
  if (exists) return fail(res, 400, 'User exists', 'CONFLICT');
  const hash = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const user = await User.create({
    email, password: hash, name: safeName, role: 'user', emailVerified: false,
    otpCodeHash: hashToken(otp), otpExpiresAt: new Date(getOtpExpiry()),
  });
  const sent = await sendOtpMail({ email, name: safeName, otp });
  ok(res, { requiresVerification: true, user: buildPublicUser(user), verification: buildOtpResponse({ sent, otp }) }, 201);
});

router.post('/request-otp', validate(otpRequestSchema), async (req, res) => {
  const email = normalizeEmail(req.body.email);

  try {
    if (req.useMemory && req.memoryStore) {
      const user = req.memoryStore.users.find((u) => u.email === email);
      if (!user) return ok(res, { ok: true });
      if (user.emailVerified) return ok(res, { ok: true, message: 'Email is already verified.' });
      const otp = generateFreshOtp(user.otpCodeHash);
      const expiresAt = getOtpExpiry();
      user.otpCodeHash = hashToken(otp);
      user.otpExpiresAt = expiresAt;
      const sent = await sendOtpMail({ email, name: user.name, otp });
      return ok(res, buildOtpResponse({ sent, otp }));
    }

    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
      if (snap.empty) return ok(res, { ok: true });
      const doc = snap.docs[0];
      const user = doc.data() || {};
      if (user.emailVerified) return ok(res, { ok: true, message: 'Email is already verified.' });
      const otp = generateFreshOtp(user.otpCodeHash);
      const expiresAt = getOtpExpiry();
      await doc.ref.update({ otpCodeHash: hashToken(otp), otpExpiresAt: expiresAt });
      const sent = await sendOtpMail({ email, name: user.name, otp });
      return ok(res, buildOtpResponse({ sent, otp }));
    }

    const user = await User.findOne({ email });
    if (!user) return ok(res, { ok: true });
    if (user.emailVerified) return ok(res, { ok: true, message: 'Email is already verified.' });
    const otp = generateFreshOtp(user.otpCodeHash);
    const expiresAt = getOtpExpiry();
    user.otpCodeHash = hashToken(otp);
    user.otpExpiresAt = new Date(expiresAt);
    await user.save();
    const sent = await sendOtpMail({ email, name: user.name, otp });
    return ok(res, buildOtpResponse({ sent, otp }));
  } catch (err) {
    return fail(res, err.code === 'MAIL_NOT_CONFIGURED' ? 503 : 400, err.message || 'Could not send verification code', err.code);
  }
});

router.post('/verify-otp', validate(otpVerifySchema), async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otpHash = hashToken(req.body.otp);
  const isOtpValid = (user) =>
    user &&
    !user.emailVerified &&
    user.otpCodeHash === otpHash &&
    Number(new Date(user.otpExpiresAt || 0).getTime()) > Date.now();

  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.email === email);
    if (!isOtpValid(user)) return fail(res, 400, 'Invalid or expired verification code', 'OTP_INVALID');
    user.emailVerified = true;
    user.otpCodeHash = '';
    user.otpExpiresAt = null;
    const token = signToken(user);
    return ok(res, { token, user: buildPublicUser(user) });
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return fail(res, 400, 'Invalid or expired verification code', 'OTP_INVALID');
    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };
    if (!isOtpValid(user)) return fail(res, 400, 'Invalid or expired verification code', 'OTP_INVALID');
    await doc.ref.update({ emailVerified: true, otpCodeHash: '', otpExpiresAt: null, updatedAt: Date.now() });
    const token = signToken(user);
    return ok(res, { token, user: buildPublicUser({ ...user, emailVerified: true }) });
  }

  const user = await User.findOne({ email });
  if (!isOtpValid(user)) return fail(res, 400, 'Invalid or expired verification code', 'OTP_INVALID');
  user.emailVerified = true;
  user.otpCodeHash = '';
  user.otpExpiresAt = null;
  await user.save();
  const token = signToken(user);
  return ok(res, { token, user: buildPublicUser(user) });
});

router.post('/admin/signup', validate(adminSignupSchema), async (req, res) => {
  const { password, name } = req.body;
  const email = normalizeEmail(req.body.email);
  if (!email || !password) return fail(res, 400, 'Email and password required');
  if (!isValidEmail(email)) return fail(res, 400, 'Invalid email address');
  if (await hasExistingAdmin(req)) {
    return fail(res, 403, 'Admin account already exists. Sign in with the existing admin account.', 'ADMIN_EXISTS');
  }

  const safeName = parseProfileName(name) || 'Admin';
  const passwordHash = await bcrypt.hash(password, 10);

  if (req.useMemory && req.memoryStore) {
    const exists = req.memoryStore.users.find((user) => user.email === email);
    if (exists) return fail(res, 400, 'User exists', 'CONFLICT');
    const user = {
      id: String(Date.now()),
      email,
      name: safeName,
      password: passwordHash,
      role: 'admin',
      emailVerified: true,
      otpCodeHash: '',
      otpExpiresAt: null,
    };
    req.memoryStore.users.push(user);
    const token = signToken(user);
    return ok(res, { token, user: buildPublicUser(user) }, 201);
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
    if (!snap.empty) return fail(res, 400, 'User exists', 'CONFLICT');
    const ref = await req.db.collection('users').add({
      email,
      password: passwordHash,
      name: safeName,
      role: 'admin',
      createdAt: Date.now(),
      emailVerified: true,
      otpCodeHash: '',
      otpExpiresAt: null,
    });
    const user = { id: ref.id, email, name: safeName, role: 'admin', emailVerified: true };
    const token = signToken(user);
    return ok(res, { token, user: buildPublicUser(user) }, 201);
  }

  const exists = await User.findOne({ email });
  if (exists) return fail(res, 400, 'User exists', 'CONFLICT');
  const user = await User.create({
    email,
    password: passwordHash,
    name: safeName,
    role: 'admin',
    emailVerified: true,
    otpCodeHash: '',
    otpExpiresAt: null,
  });
  const token = signToken(user);
  return ok(res, { token, user: buildPublicUser(user) }, 201);
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password) return fail(res, 400, 'Email and password required');
  if (!isValidEmail(email)) return fail(res, 400, 'Invalid email address');
  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.email === email);
    if (!user) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
    if (!user.emailVerified) return fail(res, 403, 'Please verify your email before signing in.', 'EMAIL_NOT_VERIFIED');
    const token = signToken(user);
    return ok(res, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified } });
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
    if (!user.emailVerified) return fail(res, 403, 'Please verify your email before signing in.', 'EMAIL_NOT_VERIFIED');
    const token = signToken(user);
    return ok(res, { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: Boolean(user.emailVerified) } });
  }

  const user = await User.findOne({ email });
  if (!user) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) return fail(res, 401, 'Invalid credentials', 'UNAUTHORIZED');
  if (!user.emailVerified) return fail(res, 403, 'Please verify your email before signing in.', 'EMAIL_NOT_VERIFIED');
  const token = signToken(user);
  ok(res, { token, user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified } });
});

router.post('/admin/login', validate(adminLoginSchema), async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!email || !password) return fail(res, 400, 'Email and password required');
  if (!isValidEmail(email)) return fail(res, 400, 'Invalid email address');

  const buildAdminResponse = (user) => ({
    id: user.id || user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
  });

  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((entry) => entry.email === email && entry.role === 'admin');
    if (!user) return fail(res, 401, 'Invalid admin credentials', 'UNAUTHORIZED');
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return fail(res, 401, 'Invalid admin credentials', 'UNAUTHORIZED');
    const token = signToken(user);
    return ok(res, { token, user: buildAdminResponse(user) });
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).where('role', '==', 'admin').limit(1).get();
    if (snap.empty) return fail(res, 401, 'Invalid admin credentials', 'UNAUTHORIZED');
    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return fail(res, 401, 'Invalid admin credentials', 'UNAUTHORIZED');
    const token = signToken(user);
    return ok(res, { token, user: buildAdminResponse(user) });
  }

  const user = await User.findOne({ email, role: 'admin' });
  if (!user) return fail(res, 401, 'Invalid admin credentials', 'UNAUTHORIZED');
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) return fail(res, 401, 'Invalid admin credentials', 'UNAUTHORIZED');
  const token = signToken(user);
  return ok(res, { token, user: buildAdminResponse(user) });
});

const requestPasswordReset = async (req, res) => {
  if (!ensureMailAvailable(res)) return;
  const email = normalizeEmail(req.body.email);
  const otp = generateOtp();
  const tokenHash = hashToken(otp);
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;
  const response = {
    ok: true,
    message: 'Password reset code sent to your email.',
    ...(shouldExposeOtp() ? { devOtp: otp } : {}),
  };

  try {
    if (req.useMemory && req.memoryStore) {
      const user = req.memoryStore.users.find((u) => u.email === email);
      if (!user) {
        return fail(res, 404, 'The email is not registered.', 'USER_NOT_FOUND');
      }
      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = expiresAt;
      await sendMail({ to: email, ...templateResetOtpEmail({ name: user.name || 'User', otp }) });
      return ok(res, response);
    }
    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
      if (snap.empty) {
        return fail(res, 404, 'The email is not registered.', 'USER_NOT_FOUND');
      }
      const doc = snap.docs[0];
      await doc.ref.update({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt, updatedAt: Date.now() });
      await sendMail({ to: email, ...templateResetOtpEmail({ name: doc.data()?.name || 'User', otp }) });
      return ok(res, response);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return fail(res, 404, 'The email is not registered.', 'USER_NOT_FOUND');
    }
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(expiresAt);
    await user.save();
    await sendMail({ to: email, ...templateResetOtpEmail({ name: user.name || 'User', otp }) });
    return ok(res, response);
  } catch (err) {
    console.error('Password reset request failed:', err.message);
    return fail(res, 500, 'Could not send password reset email. Please try again later.', 'RESET_EMAIL_FAILED');
  }
};

const verifyResetOtp = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const otp = String(req.body.otp || '').trim();
  const otpHash = hashToken(otp);

  try {
    let user = null;
    const isOtpValid = (u) =>
      u &&
      u.passwordResetTokenHash === otpHash &&
      Number(new Date(u.passwordResetExpiresAt || 0).getTime()) > Date.now();

    if (req.useMemory && req.memoryStore) {
      user = req.memoryStore.users.find((u) => u.email === email);
      if (!isOtpValid(user)) return fail(res, 400, 'Invalid or expired reset code.', 'OTP_INVALID');
    } else if (useFirebase && req.db) {
      const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
      if (snap.empty) return fail(res, 400, 'Invalid or expired reset code.', 'OTP_INVALID');
      user = { id: snap.docs[0].id, ...snap.docs[0].data() };
      if (!isOtpValid(user)) return fail(res, 400, 'Invalid or expired reset code.', 'OTP_INVALID');
    } else {
      user = await User.findOne({ email });
      if (!isOtpValid(user)) return fail(res, 400, 'Invalid or expired reset code.', 'OTP_INVALID');
    }

    const resetToken = jwt.sign(
      { email, purpose: 'reset-password' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return ok(res, { ok: true, resetToken });
  } catch (err) {
    console.error('Verify reset OTP failed:', err.message);
    return fail(res, 500, 'Failed to verify reset code. Please try again later.');
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return fail(res, 400, 'Missing reset token or new password.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset-password' || !decoded.email) {
      return fail(res, 400, 'Invalid reset token purpose.', 'TOKEN_INVALID');
    }

    const email = normalizeEmail(decoded.email);
    const passwordHash = await bcrypt.hash(password, 10);

    if (req.useMemory && req.memoryStore) {
      const user = req.memoryStore.users.find((u) => u.email === email);
      if (!user) return fail(res, 404, 'User not found.', 'NOT_FOUND');
      user.password = passwordHash;
      user.passwordResetTokenHash = '';
      user.passwordResetExpiresAt = null;
      return ok(res, { ok: true });
    }

    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
      if (snap.empty) return fail(res, 404, 'User not found.', 'NOT_FOUND');
      const doc = snap.docs[0];
      await doc.ref.update({ password: passwordHash, passwordResetTokenHash: '', passwordResetExpiresAt: null, updatedAt: Date.now() });
      return ok(res, { ok: true });
    }

    const user = await User.findOne({ email });
    if (!user) return fail(res, 404, 'User not found.', 'NOT_FOUND');
    user.password = passwordHash;
    user.passwordResetTokenHash = '';
    user.passwordResetExpiresAt = null;
    await user.save();
    return ok(res, { ok: true });
  } catch (err) {
    console.error('Password reset failed:', err.message);
    return fail(res, 400, 'Invalid or expired reset token', 'TOKEN_INVALID');
  }
};

router.post('/forgot-password', passwordResetLimiter, validate(forgotSchema), requestPasswordReset);
router.post('/request-reset', passwordResetLimiter, validate(forgotSchema), requestPasswordReset);
router.post('/verify-reset-otp', passwordResetLimiter, validate(verifyResetOtpSchema), verifyResetOtp);
router.post('/reset-password', passwordResetLimiter, validate(resetSchema), resetPassword);

router.get('/me', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, addresses: user.addresses || [] });
  }

  if (useFirebase && req.db) {
    const doc = await req.db.collection('users').doc(String(req.user.sub)).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const data = doc.data() || {};
    return res.json({ id: doc.id, email: data.email, name: data.name || '', role: data.role || 'user', addresses: data.addresses || [] });
  }

  const user = await User.findById(req.user.sub).select('_id email name role addresses');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user._id, email: user.email, name: user.name || '', role: user.role, addresses: user.addresses || [] });
});

router.put('/me', requireAuth, validate(meUpdateSchema), async (req, res) => {
  const name = parseProfileName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email is required' });

  if (req.useMemory && req.memoryStore) {
    const duplicate = req.memoryStore.users.find((u) => u.email === email && u.id !== req.user.sub);
    if (duplicate) return res.status(400).json({ error: 'Email already in use' });
    const user = req.memoryStore.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.name = name;
    user.email = email;
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  }

  if (useFirebase && req.db) {
    const userRef = req.db.collection('users').doc(String(req.user.sub));
    const existing = await req.db.collection('users').where('email', '==', email).limit(1).get();
    const duplicate = existing.docs.find((doc) => doc.id !== String(req.user.sub));
    if (duplicate) return res.status(400).json({ error: 'Email already in use' });
    await userRef.update({ name, email, updatedAt: Date.now() });
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const data = doc.data() || {};
    return res.json({ id: doc.id, email: data.email, name: data.name || '', role: data.role || 'user' });
  }

  const duplicate = await User.findOne({ email, _id: { $ne: req.user.sub } });
  if (duplicate) return res.status(400).json({ error: 'Email already in use' });
  const user = await User.findByIdAndUpdate(req.user.sub, { name, email }, { new: true }).select('_id email name role');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user._id, email: user.email, name: user.name || '', role: user.role });
});

router.put('/me/addresses', requireAuth, validate(addressBookSchema), async (req, res) => {
  const addresses = normalizeAddresses(req.body.addresses);

  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.addresses = addresses;
    return res.json({ addresses });
  }

  if (useFirebase && req.db) {
    const userRef = req.db.collection('users').doc(String(req.user.sub));
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    await userRef.update({ addresses, updatedAt: Date.now() });
    return res.json({ addresses });
  }

  const user = await User.findByIdAndUpdate(req.user.sub, { addresses }, { new: true }).select('_id addresses');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ addresses: user.addresses || [] });
});

router.get('/me/wishlist', requireAuth, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.wishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
    return ok(res, sortWishlist(user.wishlist));
  }

  if (useFirebase && req.db) {
    const doc = await req.db.collection('users').doc(String(req.user.sub)).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    return ok(res, sortWishlist(doc.data()?.wishlist || []));
  }

  const user = await User.findById(req.user.sub).select('_id wishlist');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return ok(res, sortWishlist(user.wishlist || []));
});

router.post('/me/wishlist', requireAuth, validate(wishlistSchema), async (req, res) => {
  const product = await resolveWishlistProduct(req, req.body);
  if (!product?.slug) return fail(res, 404, 'Product not found', 'NOT_FOUND');
  const item = normalizeWishlistItem(product);

  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.wishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
    const exists = user.wishlist.some((entry) => entry.slug === item.slug);
    if (!exists) user.wishlist.unshift(item);
    return ok(res, sortWishlist(user.wishlist), exists ? 200 : 201);
  }

  if (useFirebase && req.db) {
    const userRef = req.db.collection('users').doc(String(req.user.sub));
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const wishlist = Array.isArray(doc.data()?.wishlist) ? doc.data().wishlist : [];
    const exists = wishlist.some((entry) => entry.slug === item.slug);
    const nextWishlist = exists ? wishlist : [item, ...wishlist];
    await userRef.update({ wishlist: nextWishlist, updatedAt: Date.now() });
    return ok(res, sortWishlist(nextWishlist), exists ? 200 : 201);
  }

  const user = await User.findById(req.user.sub).select('_id wishlist');
  if (!user) return res.status(404).json({ error: 'User not found' });
  const wishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
  const exists = wishlist.some((entry) => entry.slug === item.slug);
  if (!exists) {
    user.wishlist.unshift(item);
    await user.save();
  }
  return ok(res, sortWishlist(user.wishlist || []), exists ? 200 : 201);
});

router.delete('/me/wishlist/:slug', requireAuth, async (req, res) => {
  const slug = String(req.params.slug || '').trim();
  if (!slug) return fail(res, 400, 'Product slug is required');

  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.wishlist = (user.wishlist || []).filter((entry) => entry.slug !== slug);
    return ok(res, sortWishlist(user.wishlist));
  }

  if (useFirebase && req.db) {
    const userRef = req.db.collection('users').doc(String(req.user.sub));
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const nextWishlist = (doc.data()?.wishlist || []).filter((entry) => entry.slug !== slug);
    await userRef.update({ wishlist: nextWishlist, updatedAt: Date.now() });
    return ok(res, sortWishlist(nextWishlist));
  }

  const user = await User.findById(req.user.sub).select('_id wishlist');
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.wishlist = (user.wishlist || []).filter((entry) => entry.slug !== slug);
  await user.save();
  return ok(res, sortWishlist(user.wishlist || []));
});

export default router;
