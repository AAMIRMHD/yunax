import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

const signToken = (user) => jwt.sign({ sub: user.id || user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (req.useMemory && req.memoryStore) {
    const exists = req.memoryStore.users.find((u) => u.email === email);
    if (exists) return res.status(400).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const firstUser = req.memoryStore.users.length === 0;
    const user = { id: String(Date.now()), email, name: name || '', password: hash, role: firstUser ? 'admin' : 'user' };
    req.memoryStore.users.push(user);
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
    if (!snap.empty) return res.status(400).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const ref = await req.db.collection('users').add({ email, password: hash, name: name || '', role: 'user', createdAt: Date.now() });
    const user = { id: ref.id, email, name: name || '', role: 'user' };
    const token = signToken(user);
    return res.json({ token, user });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'User exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash, name: name || '', role: 'user' });
  const token = signToken(user);
  res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (req.useMemory && req.memoryStore) {
    const user = req.memoryStore.users.find((u) => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'Invalid credentials' });
    const doc = snap.docs[0];
    const user = { id: doc.id, ...doc.data() };
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
});

export default router;
