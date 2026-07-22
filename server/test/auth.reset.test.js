import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';

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

describe('auth forgot/reset password OTP flow', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MEMORY_MODE = 'true';
    process.env.JWT_SECRET = 'test-secret';
    process.env.EXPOSE_DEV_OTP = 'true';
    const mod = await import('../src/routes/auth.js');
    authRouter = mod.default;
  });

  it('can request a password reset, verify OTP, and reset the password', async () => {
    const originalPassword = 'OldPassword123';
    const newPassword = 'NewPassword123';
    const email = 'user-reset-otp@test.com';

    const memoryStore = {
      users: [
        {
          id: 'user-reset-id',
          email,
          name: 'Reset User',
          role: 'user',
          password: await bcrypt.hash(originalPassword, 10),
          emailVerified: true,
        },
      ],
      products: [],
      orders: [],
    };

    // 1. Send forgot password request (generates OTP)
    const forgotReq = {
      body: { email },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
      ip: '127.0.0.1',
      app: { get: () => {} },
    };
    const forgotRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/forgot-password', 'post'), forgotReq, forgotRes);

    expect(forgotRes.statusCode).toBe(200);
    expect(forgotRes.body.ok).toBe(true);
    expect(forgotRes.body.devOtp).toMatch(/^\d{6}$/);

    const devOtp = forgotRes.body.devOtp;

    // 2. Verify OTP (generates reset token JWT)
    const verifyReq = {
      body: { email, otp: devOtp },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
      ip: '127.0.0.1',
      app: { get: () => {} },
    };
    const verifyRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/verify-reset-otp', 'post'), verifyReq, verifyRes);

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.ok).toBe(true);
    expect(verifyRes.body.resetToken).toBeDefined();

    const resetToken = verifyRes.body.resetToken;

    // 3. Submit password reset with the JWT reset token
    const resetReq = {
      body: { token: resetToken, password: newPassword, confirmPassword: newPassword },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
      ip: '127.0.0.1',
      app: { get: () => {} },
    };
    const resetRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/reset-password', 'post'), resetReq, resetRes);

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body.ok).toBe(true);

    // Verify password was updated by comparing hashes
    const userInDb = memoryStore.users[0];
    const matchOld = await bcrypt.compare(originalPassword, userInDb.password);
    const matchNew = await bcrypt.compare(newPassword, userInDb.password);
    expect(matchOld).toBe(false);
    expect(matchNew).toBe(true);
  });

  it('rejects password resets with expired or invalid OTPs', async () => {
    const memoryStore = {
      users: [
        {
          id: 'user-reset-id',
          email: 'user-reset@test.com',
          name: 'Reset User',
          role: 'user',
          password: 'hashed-password',
          emailVerified: true,
          passwordResetTokenHash: 'somehash',
          passwordResetExpiresAt: Date.now() - 1000, // expired
        },
      ],
      products: [],
      orders: [],
    };

    const verifyReq = {
      body: { email: 'user-reset@test.com', otp: '123456' },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
      ip: '127.0.0.1',
      app: { get: () => {} },
    };
    const verifyRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/verify-reset-otp', 'post'), verifyReq, verifyRes);

    expect(verifyRes.statusCode).toBe(400);
    expect(verifyRes.body.error).toBe('Invalid or expired reset code.');
  });

  it('rejects forgot password requests for unregistered emails', async () => {
    const memoryStore = {
      users: [],
      products: [],
      orders: [],
    };

    const forgotReq = {
      body: { email: 'nonexistent@test.com' },
      headers: {},
      useMemory: true,
      memoryStore,
      useFirebase: false,
      db: null,
      ip: '127.0.0.1',
      app: { get: () => {} },
    };
    const forgotRes = createMockRes();
    await runHandlers(getRouteHandlers(authRouter, '/forgot-password', 'post'), forgotReq, forgotRes);

    expect(forgotRes.statusCode).toBe(404);
    expect(forgotRes.body.errorObj.code).toBe('USER_NOT_FOUND');
    expect(forgotRes.body.error).toBe('The email is not registered.');
  });
});
