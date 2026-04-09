import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { initFirebase } from "./lib/firebase.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import adminUsersRoutes from "./routes/adminUsers.js";

dotenv.config();

const app = express();

// ✅ FIX 1: Proper CORS for Vercel
const allowedOrigin = process.env.CLIENT_ORIGIN || "*";

app.use(
  cors({
    origin: allowedOrigin === "*" ? true : allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());

// ✅ Modes
const useFirebase = Boolean(process.env.FIREBASE_PROJECT_ID);
const useMemory = process.env.MEMORY_MODE === "true";

let firestoreDb = null;
let memoryStore = useMemory
  ? {
      users: [],
      products: [],
      orders: [],
    }
  : null;

// ✅ Firebase Init
if (useFirebase) {
  try {
    firestoreDb = initFirebase();
    console.log("Firebase initialized");
  } catch (err) {
    console.error("Failed to init Firebase", err.message);
    process.exit(1);
  }
}

// ✅ FIX 2: Wrap async seeding inside function
async function seedMemory() {
  if (useMemory && memoryStore && memoryStore.users.length === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@yunax.local";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const hash = await bcrypt.hash(adminPassword, 10);

    memoryStore.users.push({
      id: "seed-admin",
      email: adminEmail,
      name: "Seed Admin",
      role: "admin",
      password: hash,
      createdAt: Date.now(),
    });

    console.log(`Memory admin -> ${adminEmail}`);

    const userHash = await bcrypt.hash("user123", 10);

    memoryStore.users.push({
      id: "seed-user",
      email: "user@yunax.local",
      name: "Demo User",
      role: "user",
      password: userHash,
      createdAt: Date.now(),
    });
  }

  // ✅ Seed Products
  if (useMemory && memoryStore && memoryStore.products.length === 0) {
    memoryStore.products = [
      {
        _id: "demo-1",
        name: "Apex 15 Pro",
        category: "Laptops",
        priceCents: 129900,
        stock: 10,
        createdAt: Date.now(),
      },
    ];
    console.log("Memory products seeded");
  }
}

// ✅ Attach DB
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
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);
app.use("/admin/users", adminUsersRoutes);

// ✅ PORT FIX (Render compatible)
const PORT = process.env.PORT || 4000;

// ✅ START SERVER
async function start() {
  try {
    await seedMemory();

    if (useFirebase) {
      console.log("Using Firebase");
    } else if (useMemory) {
      console.log("Using Memory DB");
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected");
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();