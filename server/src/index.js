import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initFirebase } from './lib/firebase.js';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminUsersRoutes from './routes/adminUsers.js';

dotenv.config();

const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
const useMemory = process.env.MEMORY_MODE === 'true';
let firestoreDb = null;
let memoryStore = useMemory
  ? {
      users: [],
      products: [],
      orders: [],
    }
  : null;

if (useFirebase) {
  try {
    firestoreDb = initFirebase();
    console.log('Firebase initialized');
  } catch (err) {
    console.error('Failed to init Firebase', err.message);
    process.exit(1);
  }
}

// Seed a default admin in memory mode if none exists
if (useMemory && memoryStore && memoryStore.users.length === 0) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yunax.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 10);
  memoryStore.users.push({
    id: 'seed-admin',
    email: adminEmail,
    name: 'Seed Admin',
    role: 'admin',
    password: hash,
    createdAt: Date.now(),
  });
  console.log(`Memory admin seeded -> ${adminEmail} / ${adminPassword}`);

  const userEmail = process.env.SEED_USER_EMAIL || 'user@yunax.local';
  const userPassword = process.env.SEED_USER_PASSWORD || 'user123';
  const userHash = await bcrypt.hash(userPassword, 10);
  memoryStore.users.push({
    id: 'seed-user',
    email: userEmail,
    name: 'Demo User',
    role: 'user',
    password: userHash,
    createdAt: Date.now(),
  });
  console.log(`Memory user seeded -> ${userEmail} / ${userPassword}`);
}

// Seed sample products for demo/testing in memory mode
if (useMemory && memoryStore && (memoryStore.products?.length || 0) === 0) {
  const demoProducts = [
    {
      name: 'Apex 15 Pro (RTX 4060)',
      slug: 'apex-15-pro-4060',
      category: 'Laptops',
      priceCents: 129900,
      stock: 8,
      featured: true,
      description: '15.6" QHD 165Hz, Ryzen 7 7840HS, 16GB RAM, 1TB NVMe, RTX 4060 8GB.',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Vertex Creator 14 OLED',
      slug: 'vertex-creator-14-oled',
      category: 'Laptops',
      priceCents: 118500,
      stock: 12,
      description: '14" 3K OLED, Intel i7 13700H, 32GB RAM, 1TB NVMe, Iris Xe.',
      images: ['https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Nebula Mini Workstation',
      slug: 'nebula-mini-workstation',
      category: 'Desktop PCs',
      priceCents: 154900,
      stock: 6,
      featured: true,
      description: 'Compact ITX, Ryzen 9 7900, 32GB DDR5, 2TB Gen4 NVMe, RTX 4070 Super.',
      images: ['https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Glacier Gaming Tower',
      slug: 'glacier-gaming-tower',
      category: 'Gaming PCs',
      priceCents: 189900,
      stock: 4,
      description: 'Lian Li 011D, Intel i7 14700K, RTX 4080 Super, 32GB DDR5, 2TB NVMe.',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Pulse RX 7800 XT',
      slug: 'pulse-rx-7800xt',
      category: 'Graphics Cards',
      priceCents: 54900,
      stock: 14,
      description: '16GB GDDR6, dual-fan, PCIe 4.0, ideal for 1440p high refresh.',
      images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Strata Z790 Creator',
      slug: 'strata-z790-creator',
      category: 'Motherboards',
      priceCents: 32900,
      stock: 10,
      description: 'Intel Z790, Wi-Fi 6E, 4x M.2, Thunderbolt header, DDR5.',
      images: ['https://images.unsplash.com/photo-1587202372775-98927b7d0d3c?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Nova 2TB NVMe Gen4',
      slug: 'nova-2tb-gen4',
      category: 'SSD / HDD',
      priceCents: 16900,
      stock: 22,
      description: 'PCIe 4.0 x4, 7400/6800 MBps, DRAM cache, 5-year warranty.',
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Atlas 850W Platinum',
      slug: 'atlas-850w-platinum',
      category: 'Power Supply (SMPS)',
      priceCents: 12400,
      stock: 18,
      description: 'Fully modular, 80+ Platinum, zero RPM mode, 10-year warranty.',
      images: ['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Aurora TKL Wireless',
      slug: 'aurora-tkl-wireless',
      category: 'Accessories',
      priceCents: 8900,
      stock: 30,
      description: 'Hot-swap mechanical, tri-mode, PBT keycaps, per-key RGB.',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Velo Wireless Pro Mouse',
      slug: 'velo-wireless-pro',
      category: 'Accessories',
      priceCents: 6200,
      stock: 40,
      description: '55g lightweight, PixArt 3395, 4K polling ready, USB-C.',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Helios 27" QHD 165Hz',
      slug: 'helios-27q-165',
      category: 'Gaming',
      priceCents: 29900,
      stock: 16,
      description: 'IPS, 165Hz, 1ms MPRT, HDR400, USB-C 65W, height adjustable.',
      images: ['https://images.unsplash.com/photo-1505740106531-4243f3831c78?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Pulse ANC Headset',
      slug: 'pulse-anc-headset',
      category: 'Headphones',
      priceCents: 12900,
      stock: 25,
      description: 'Hybrid ANC, LDAC, dual mics, 40mm drivers, 50h battery.',
      images: ['https://images.unsplash.com/photo-1511367466-95bf97d1a5b4?auto=format&fit=crop&w=900&q=80'],
    },
    {
      name: 'Carbon XL Router Wi‑Fi 6E',
      slug: 'carbon-xl-router',
      category: 'Networking Products',
      priceCents: 18900,
      stock: 14,
      description: 'Tri-band Wi‑Fi 6E, 2.5G WAN/LAN, OFDMA/MU-MIMO, mesh ready.',
      images: ['https://images.unsplash.com/photo-1587202372775-98927b7d0d3c?auto=format&fit=crop&w=900&q=80'],
    },
  ];

  memoryStore.products = demoProducts.map((p, idx) => ({ ...p, _id: `demo-${idx}`, id: `demo-${idx}`, createdAt: Date.now() - idx * 1000, updatedAt: Date.now() - idx * 1000 }));
  console.log(`Memory products seeded -> ${memoryStore.products.length} items`);
}

const app = express();
app.use(express.json());
const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin, credentials: true }));

// attach db reference for routes
app.use((req, _res, next) => {
  req.db = firestoreDb;
  req.useFirebase = useFirebase;
  req.useMemory = useMemory;
  req.memoryStore = memoryStore;
  next();
});

// Friendly landing page for the API root
app.get('/', (_req, res) =>
  res
    .status(200)
    .send(
      `<html><body style="font-family: sans-serif; padding: 24px;">
        <h1>Yunax API</h1>
        <p>Status: ok</p>
        <ul>
          <li><a href="/health">/health</a> - health check</li>
          <li><a href="/products">/products</a> - list products</li>
          <li><a href="/auth/login">/auth/login</a> (POST)</li>
          <li><a href="/auth/signup">/auth/signup</a> (POST)</li>
          <li><a href="/orders">/orders</a> (auth required)</li>
        </ul>
      </body></html>`
    )
);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/admin/users', adminUsersRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    if (useFirebase) {
      console.log('Skipping MongoDB — using Firebase Firestore');
    } else if (useMemory) {
      console.log('Skipping MongoDB — using in-memory storage (not persistent)');
    } else {
      await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || undefined });
      console.log('Mongo connected');
    }
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    if (useMemory) {
      console.log('Starting anyway with in-memory storage. Data will reset on restart.');
      app.listen(PORT, () => console.log(`API running (memory mode) on http://localhost:${PORT}`));
    } else {
      process.exit(1);
    }
  }
}

start();
