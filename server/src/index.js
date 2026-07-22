import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { initFirebase } from "./lib/firebase.js";
import { getDefaultProducts } from "./lib/defaultProducts.js";
import { getMailConfigSummary, verifyMailTransport } from "./lib/mailer.js";

import Product from "./models/Product.js";
import User from "./models/User.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import supportRoutes from "./routes/support.js";
import reviewRoutes from "./routes/reviews.js";
import categoryRoutes from "./routes/categories.js";

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === "production";
if (!process.env.JWT_SECRET) {
  if (isProduction) {
    throw new Error("JWT_SECRET must be set in production");
  }
  process.env.JWT_SECRET = "dev-secret-change-me";
  console.warn("JWT_SECRET not set. Using insecure development fallback secret.");
}

// ✅ Better CORS (handles multiple origins)
const allowedOriginsEnv = process.env.CLIENT_ORIGIN || "";
const allowedOrigins = allowedOriginsEnv
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Safe defaults for dev + deployed preview
[
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://yunax.onrender.com",
  "https://yunax.vercel.app",
].forEach((o) => {
  if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser or curl
      if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json());

// ✅ Modes
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
let useMemory = process.env.MEMORY_MODE === "true";
const seedProductsInMemory = process.env.SEED_PRODUCTS === "true";

let firestoreDb = null;
let memoryStore = useMemory
  ? { users: [], products: [], orders: [], contacts: [], reviews: [], categories: [] }
  : null;

// ✅ Firebase Init
if (useFirebase) {
  try {
    firestoreDb = initFirebase();
    console.log("Firebase initialized");
  } catch (err) {
    console.error("Firebase error:", err.message);
    process.exit(1);
  }
}

// ✅ Seed memory data
async function seedMemory() {
  if (!useMemory || !memoryStore) return;

  if (memoryStore.users.length === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@yunax.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const userEmail = process.env.SEED_USER_EMAIL || 'user@yunax.com';
    const userPassword = process.env.SEED_USER_PASSWORD || 'user123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const userHash = await bcrypt.hash(userPassword, 10);

    memoryStore.users.push(
      {
        id: "admin",
        email: adminEmail,
        name: 'Admin User',
        role: "admin",
        password: adminHash,
        emailVerified: true,
      },
      {
        id: "user",
        email: userEmail,
        name: 'Demo User',
        role: "user",
        password: userHash,
        emailVerified: true,
      }
    );

    console.log("Users seeded");
  }

  if (seedProductsInMemory && memoryStore.products.length === 0) {
    memoryStore.products = getDefaultProducts();
    console.log("Products seeded");
  }
}

// ✅ Seed MongoDB data
async function seedMongoDB() {
  if (useMemory || useFirebase) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yunax.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const userEmail = process.env.SEED_USER_EMAIL || 'user@yunax.com';
  const userPassword = process.env.SEED_USER_PASSWORD || 'user123';

  // Seed Users
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const userHash = await bcrypt.hash(userPassword, 10);

    await User.create([
      {
        email: adminEmail,
        name: 'Admin User',
        role: "admin",
        password: adminHash,
        emailVerified: true,
      },
      {
        email: userEmail,
        name: 'Demo User',
        role: "user",
        password: userHash,
        emailVerified: true,
      }
    ]);
    console.log("MongoDB Users seeded");
  }

  // Seed Products
  const seedProducts = process.env.SEED_PRODUCTS === "true" || process.env.NODE_ENV !== "production";
  if (seedProducts) {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const defaults = getDefaultProducts().map(p => {
        const { _id, id, ...rest } = p;
        return rest;
      });
      await Product.insertMany(defaults);
      console.log("MongoDB Products seeded");
    }
  }
}

// ✅ Attach DB to request
app.use((req, res, next) => {
  req.db = firestoreDb;
  req.useFirebase = useFirebase;
  req.useMemory = useMemory;
  req.memoryStore = memoryStore;
  next();
});

// ✅ Routes
app.get("/", (req, res) => {
  res.send("Yunax API Running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);
app.use("/admin/users", adminUsersRoutes);
app.use("/support", supportRoutes);
app.use("/reviews", reviewRoutes);
app.use("/categories", categoryRoutes);

app.use((err, _req, res, next) => {
  if (!err) return next();
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

// ✅ PORT
const PORT = process.env.PORT || 5001;

// ✅ START SERVER
export async function start() {
  try {
    await seedMemory();

    if (useFirebase) {
      console.log("Using Firebase");
    } else if (useMemory) {
      console.log("Using Memory DB");
    } else {
      if (!process.env.MONGO_URI) {
        console.warn("⚠️ MONGO_URI not set. Falling back to Memory Database Mode...");
        useMemory = true;
        memoryStore = { users: [], products: [], orders: [], contacts: [], reviews: [], categories: [] };
        await seedMemory();
      } else {
        try {
          console.log("Connecting to MongoDB...");
          // Establish connection with a timeout of 3000ms so it doesn't hang if Mongo isn't running
          await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 3000
          });
          console.log("MongoDB connected");
          await seedMongoDB();
        } catch (dbErr) {
          console.warn(`⚠️ Local MongoDB connection failed: ${dbErr.message}`);
          console.warn("⚠️ Falling back to Memory Database Mode...");
          useMemory = true;
          memoryStore = { users: [], products: [], orders: [], contacts: [], reviews: [], categories: [] };
          await seedMemory();
        }
      }
    }

    const mailConfig = getMailConfigSummary();
    if (!mailConfig.configured) {
      console.warn("Email delivery disabled: SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM are not fully configured.");
    } else {
      const mailCheck = await verifyMailTransport();
      if (mailCheck.ok) {
        console.log(`Email delivery ready via ${mailConfig.host}:${mailConfig.port}`);
      } else {
        console.warn(`Email delivery check failed: ${mailCheck.reason}`);
      }
    }

    const HOST = process.env.HOST || "0.0.0.0";
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
