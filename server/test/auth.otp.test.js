import { beforeAll, describe, expect, it } from 'vitest';

let authRouter;

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    locals: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
  };
  return res;
};

const getRouteHandlers = (router, path, method) => {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === path && entry.route.methods[method]
  );
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((entry) => entry.handle);
};

const runHandlers = async (handlers, req, res) => {
  for (const handler of handlers) {
    await new Promise((resolve, reject) => {
      let settled = false;
      const next = (err) => {
        settled = true;
        if (err) reject(err);
        else resolve();
      };

      Promise.resolve(handler(req, res, next))
        .then(() => {
          if (!settled) resolve();
        })
        .catch(reject);
    });
  }
  return res;
};

describe('auth signup flow', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MEMORY_MODE = 'true';
    process.env.JWT_SECRET = 'test-secret';
    const mod = await import('../src/routes/auth.js');
    authRouter = mod.default;
  });

  it('requires OTP verification before customer login', async () => {
    const memoryStore = {
      users: [
        {
          id: 'admin-seed',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'admin',
          password: 'hashed-admin-password',
          emailVerified: true,
        },
      ],
      products: [],
      orders: [],
    };
    const email = `user${Date.now()}@test.com`;
    const password = 'password123';

    const signupReq = {
      body: { email, password, name: 'Test User' },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const signupRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/signup', 'post'), signupReq, signupRes);

    expect(signupRes.statusCode).toBe(201);
    expect(signupRes.body.user.email).toBe(email);
    expect(signupRes.body.user.emailVerified).toBe(false);
    expect(signupRes.body.requiresVerification).toBe(true);
    expect(signupRes.body.verification.devOtp).toMatch(/^\d{6}$/);
    expect(signupRes.body.token).toBeUndefined();
    expect(memoryStore.users).toHaveLength(2);

    const loginReq = {
      body: { email, password },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const successLoginRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/login', 'post'), loginReq, successLoginRes);

    expect(successLoginRes.statusCode).toBe(403);
    expect(successLoginRes.body.errorObj.code).toBe('EMAIL_NOT_VERIFIED');

    const verifyReq = {
      body: { email, otp: signupRes.body.verification.devOtp },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const verifyRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/verify-otp', 'post'), verifyReq, verifyRes);

    expect(verifyRes.statusCode).toBe(200);
    expect(typeof verifyRes.body.token).toBe('string');
    expect(verifyRes.body.user.emailVerified).toBe(true);

    const verifiedLoginRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/login', 'post'), loginReq, verifiedLoginRes);

    expect(verifiedLoginRes.statusCode).toBe(200);
    expect(typeof verifiedLoginRes.body.token).toBe('string');
    expect(verifiedLoginRes.body.user.emailVerified).toBe(true);
  });

  it('keeps the first regular memory signup as a non-admin user', async () => {
    const memoryStore = {
      users: [],
      products: [],
      orders: [],
    };

    const signupReq = {
      body: { email: 'first-user@test.com', password: 'password123', name: 'First User' },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const signupRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/signup', 'post'), signupReq, signupRes);

    expect(signupRes.statusCode).toBe(201);
    expect(signupRes.body.user.role).toBe('user');
    expect(memoryStore.users[0].role).toBe('user');
  });

  it('can resend a customer OTP and rejects stale codes', async () => {
    const memoryStore = {
      users: [],
      products: [],
      orders: [],
    };
    const email = 'resend-user@test.com';

    const signupRes = createMockRes();
    await runHandlers(
      getRouteHandlers(authRouter, '/signup', 'post'),
      {
        body: { email, password: 'password123', name: 'Resend User' },
        headers: {},
        useMemory: true,
        memoryStore,
        useFirebase: false,
        db: null,
      },
      signupRes
    );

    const firstOtp = signupRes.body.verification.devOtp;

    const resendRes = createMockRes();
    await runHandlers(
      getRouteHandlers(authRouter, '/request-otp', 'post'),
      {
        body: { email },
        headers: {},
        useMemory: true,
        memoryStore,
        useFirebase: false,
        db: null,
      },
      resendRes
    );

    expect(resendRes.statusCode).toBe(200);
    expect(resendRes.body.devOtp).toMatch(/^\d{6}$/);

    const staleVerifyRes = createMockRes();
    await runHandlers(
      getRouteHandlers(authRouter, '/verify-otp', 'post'),
      {
        body: { email, otp: firstOtp },
        headers: {},
        useMemory: true,
        memoryStore,
        useFirebase: false,
        db: null,
      },
      staleVerifyRes
    );
    expect(staleVerifyRes.statusCode).toBe(400);

    const verifyRes = createMockRes();
    await runHandlers(
      getRouteHandlers(authRouter, '/verify-otp', 'post'),
      {
        body: { email, otp: resendRes.body.devOtp },
        headers: {},
        useMemory: true,
        memoryStore,
        useFirebase: false,
        db: null,
      },
      verifyRes
    );
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.user.emailVerified).toBe(true);
  });

  it('allows admin login only for verified admin accounts on the admin endpoint', async () => {
    const bcrypt = await import('bcryptjs');
    const adminPassword = 'AdminPass123';
    const userPassword = 'UserPass123';
    const memoryStore = {
      users: [
        {
          id: 'admin-1',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'admin',
          password: await bcrypt.hash(adminPassword, 10),
          emailVerified: true,
        },
        {
          id: 'user-1',
          email: 'user@test.com',
          name: 'User',
          role: 'user',
          password: await bcrypt.hash(userPassword, 10),
          emailVerified: true,
        },
      ],
      products: [],
      orders: [],
    };

    const adminLoginReq = {
      body: { email: 'admin@test.com', password: adminPassword },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const adminLoginRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/admin/login', 'post'), adminLoginReq, adminLoginRes);

    expect(adminLoginRes.statusCode).toBe(200);
    expect(adminLoginRes.body.user.role).toBe('admin');
    expect(typeof adminLoginRes.body.token).toBe('string');

    const userLoginReq = {
      body: { email: 'user@test.com', password: userPassword },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const userLoginRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/admin/login', 'post'), userLoginReq, userLoginRes);

    expect(userLoginRes.statusCode).toBe(401);
    expect(userLoginRes.body.error).toBe('Invalid admin credentials');
  });

  it('creates the first admin through the admin signup endpoint and blocks later admin signups', async () => {
    const memoryStore = {
      users: [],
      products: [],
      orders: [],
    };

    const firstAdminReq = {
      body: { email: 'owner@test.com', password: 'OwnerPass123', name: 'Owner' },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const firstAdminRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/admin/signup', 'post'), firstAdminReq, firstAdminRes);

    expect(firstAdminRes.statusCode).toBe(201);
    expect(firstAdminRes.body.user.role).toBe('admin');
    expect(typeof firstAdminRes.body.token).toBe('string');
    expect(memoryStore.users).toHaveLength(1);

    const secondAdminReq = {
      body: { email: 'second@test.com', password: 'SecondPass123', name: 'Second' },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
    };
    const secondAdminRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/admin/signup', 'post'), secondAdminReq, secondAdminRes);

    expect(secondAdminRes.statusCode).toBe(403);
    expect(secondAdminRes.body.errorObj.code).toBe('ADMIN_EXISTS');
    expect(memoryStore.users).toHaveLength(1);
  });
});
