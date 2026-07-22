import express from 'express';
import { z } from 'zod';
import ContactMessage from '../models/ContactMessage.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fail, ok } from '../lib/http.js';
import { isMailConfigured, sendMail } from '../lib/mailer.js';

const router = express.Router();
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
const supportEmail = process.env.SUPPORT_EMAIL || 'info@yunax.com';

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  phone: z.string().trim().max(20).optional().default(''),
  subject: z.string().trim().max(120).optional().default('General enquiry'),
  message: z.string().trim().min(10).max(2000),
  source: z.string().trim().max(40).optional().default('website'),
});

const mapDoc = (doc) => ({ _id: doc.id, id: doc.id, ...doc.data?.() });

const contactMail = ({ name, email, phone, subject, message, source }) => ({
  to: supportEmail,
  subject: `Website enquiry: ${subject}`,
  text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSource: ${source}\n\n${message}`,
  html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Source:</strong> ${source}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br />')}</p>`,
});

router.post('/contact', validate(contactSchema), async (req, res) => {
  try {
    const payload = {
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone?.trim?.() || '',
      subject: req.body.subject?.trim?.() || 'General enquiry',
      message: req.body.message.trim(),
      source: req.body.source?.trim?.() || 'website',
      status: 'new',
    };

    let savedMessage;

    if (req.useMemory && req.memoryStore) {
      req.memoryStore.contacts = req.memoryStore.contacts || [];
      savedMessage = {
        _id: String(Date.now()),
        id: String(Date.now()),
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      req.memoryStore.contacts.unshift(savedMessage);
    } else if (useFirebase && req.db) {
      const ref = await req.db.collection('contactMessages').add({
        ...payload,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      savedMessage = mapDoc(await ref.get());
    } else {
      savedMessage = await ContactMessage.create(payload);
    }

    if (isMailConfigured()) {
      await sendMail(contactMail(payload));
    }

    return ok(res, {
      ok: true,
      message: 'Thanks for contacting us. Our team will get back to you within one business day.',
      id: savedMessage._id || savedMessage.id,
    }, 201);
  } catch (err) {
    return fail(res, 400, err.message || 'Failed to submit contact request');
  }
});

router.get('/messages', requireAuth, requireAdmin, async (req, res) => {
  if (req.useMemory && req.memoryStore) {
    return ok(res, (req.memoryStore.contacts || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }

  if (useFirebase && req.db) {
    const snap = await req.db.collection('contactMessages').orderBy('createdAt', 'desc').get();
    return ok(res, snap.docs.map(mapDoc));
  }

  const messages = await ContactMessage.find({}).sort({ createdAt: -1 });
  return ok(res, messages);
});

export default router;
