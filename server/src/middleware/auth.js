import jwt from 'jsonwebtoken';
import { getFirebaseAuth } from '../lib/firebase.js';

export async function requireAuth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr || !hdr.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = hdr.slice(7);

  // First try local JWT
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    // fall through to Firebase verification
  }

  // Firebase ID token verification (if configured)
  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      const auth = getFirebaseAuth();
      const decoded = await auth.verifyIdToken(token);
      const role =
        decoded.role ||
        decoded.customClaims?.role ||
        (process.env.ADMIN_EMAIL && decoded.email === process.env.ADMIN_EMAIL ? 'admin' : 'user');
      req.user = { sub: decoded.uid, role, email: decoded.email };
      return next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  return res.status(401).json({ error: 'Invalid token' });
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}
