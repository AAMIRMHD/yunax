import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);

const mapDoc = (doc) => ({ id: doc.id, _id: doc.id, ...doc.data?.() });

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.useMemory && req.memoryStore) {
      return res.json(req.memoryStore.users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
    }

    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').orderBy('createdAt', 'desc').get();
      return res.json(snap.docs.map((d) => {
        const data = mapDoc(d);
        delete data.password;
        return data;
      }));
    }

    const users = await User.find().sort({ createdAt: -1 }).select('email name role createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { email, password, name = '', role = 'user' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    if (req.useMemory && req.memoryStore) {
      const exists = req.memoryStore.users.find((u) => u.email === email);
      if (exists) return res.status(400).json({ error: 'User exists' });
      const hash = await bcrypt.hash(password, 10);
      const user = { id: String(Date.now()), email, name, role, password: hash, createdAt: Date.now() };
      req.memoryStore.users.unshift(user);
      const { password: _, ...safe } = user;
      return res.status(201).json(safe);
    }

    if (useFirebase && req.db) {
      const snap = await req.db.collection('users').where('email', '==', email).limit(1).get();
      if (!snap.empty) return res.status(400).json({ error: 'User exists' });
      const hash = await bcrypt.hash(password, 10);
      const ref = await req.db.collection('users').add({ email, name, role, password: hash, createdAt: Date.now() });
      const doc = await ref.get();
      const data = mapDoc(doc);
      delete data.password;
      return res.status(201).json(data);
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash, name, role });
    res.status(201).json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
