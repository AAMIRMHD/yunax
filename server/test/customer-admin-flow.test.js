import { beforeAll, describe, expect, it } from 'vitest';

let authRouter;
let productRouter;
let orderRouter;
let adminUsersRouter;
let supportRouter;

const unique = Date.now();
const memoryStore = { users: [], products: [], orders: [], contacts: [] };
const address = {
  fullName: 'Flow Customer',
  phone: '9876543210',
  line1: '123 Test Street',
  city: 'Kozhikode',
  state: 'Kerala',
  pincode: '673016',
};

const createMockRes = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
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
});

const getRouteHandlers = (router, path, method) => {
  const layer = router.stack.find((entry) => entry.route && entry.route.path === path && entry.route.methods[method]);
  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  return layer.route.stack.map((entry) => entry.handle);
};

const runHandlers = async (handlers, req, res = createMockRes()) => {
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

const reqFor = ({ body = {}, params = {}, query = {}, token = '' } = {}) => ({
  body,
  params,
  query,
  headers: token ? { authorization: `Bearer ${token}` } : {},
  useMemory: true,
  memoryStore,
  useFirebase: false,
  db: null,
});

const callRoute = (router, path, method, options) => runHandlers(getRouteHandlers(router, path, method), reqFor(options));

describe('customer and admin flow integration', () => {
  let adminToken;
  let customerToken;
  let product;
  let codOrder;
  let bankOrder;
  let createdUser;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MEMORY_MODE = 'true';
    process.env.JWT_SECRET = 'flow-test-secret';

    authRouter = (await import('../src/routes/auth.js')).default;
    productRouter = (await import('../src/routes/products.js')).default;
    orderRouter = (await import('../src/routes/orders.js')).default;
    adminUsersRouter = (await import('../src/routes/adminUsers.js')).default;
    supportRouter = (await import('../src/routes/support.js')).default;
  });

  it('signs up admins and customers, verifies OTP, and blocks unverified login', async () => {
    const adminSignup = await callRoute(authRouter, '/admin/signup', 'post', {
      body: { email: `admin-${unique}@test.com`, password: 'AdminPass123', name: 'Flow Admin' },
    });
    expect(adminSignup.statusCode).toBe(201);
    adminToken = adminSignup.body.token;
    expect(adminSignup.body.user.role).toBe('admin');

    const customerEmail = `customer-${unique}@test.com`;
    const customerSignup = await callRoute(authRouter, '/signup', 'post', {
      body: { email: customerEmail, password: 'CustomerPass123', name: 'Flow Customer' },
    });
    expect(customerSignup.statusCode).toBe(201);
    expect(customerSignup.body.requiresVerification).toBe(true);
    expect(customerSignup.body.verification.devOtp).toMatch(/^\d{6}$/);

    const blockedLogin = await callRoute(authRouter, '/login', 'post', {
      body: { email: customerEmail, password: 'CustomerPass123' },
    });
    expect(blockedLogin.statusCode).toBe(403);

    const verified = await callRoute(authRouter, '/verify-otp', 'post', {
      body: { email: customerEmail, otp: customerSignup.body.verification.devOtp },
    });
    expect(verified.statusCode).toBe(200);
    customerToken = verified.body.token;
    expect(verified.body.user.emailVerified).toBe(true);

    const customerLogin = await callRoute(authRouter, '/login', 'post', {
      body: { email: customerEmail, password: 'CustomerPass123' },
    });
    expect(customerLogin.statusCode).toBe(200);
  });

  it('lets admin add, browse, edit, and stock-manage products', async () => {
    const created = await callRoute(productRouter, '/', 'post', {
      token: adminToken,
      body: {
        name: 'Flow Test Laptop',
        slug: `flow-test-laptop-${unique}`,
        category: 'Laptops',
        priceCents: 12500000,
        stock: 5,
        brand: 'YunaX',
        description: 'Integration flow product',
        images: ['/products/new/flow-test.avif'],
        highlights: ['QA ready'],
        specs: { CPU: 'Test CPU' },
        featured: true,
      },
    });
    expect(created.statusCode).toBe(201);
    product = created.body;
    expect(product.stock).toBe(5);

    const list = await callRoute(productRouter, '/', 'get', { query: { q: 'Flow Test Laptop' } });
    expect(list.statusCode).toBe(200);
    expect(list.body.items || list.body).toHaveLength(1);

    const updated = await callRoute(productRouter, '/:id', 'put', {
      token: adminToken,
      params: { id: product.id || product._id },
      body: { ...product, stock: 7, priceCents: 13000000 },
    });
    expect(updated.statusCode).toBe(200);
    product = updated.body;
    expect(product.stock).toBe(7);
  });

  it('quotes serviceable and non-serviceable pincodes', async () => {
    const items = [{ productId: product.id || product._id, slug: product.slug, quantity: 1 }];

    const serviceable = await callRoute(orderRouter, '/quote', 'post', {
      body: { items, shippingAddress: address },
    });
    expect(serviceable.statusCode).toBe(200);
    expect(serviceable.body.shipping.serviceable).toBe(true);

    const blocked = await callRoute(orderRouter, '/quote', 'post', {
      body: { items, shippingAddress: { ...address, pincode: '123' } },
    });
    expect(blocked.statusCode).toBe(200);
    expect(blocked.body.shipping.serviceable).toBe(false);

    const blockedOrder = await callRoute(orderRouter, '/', 'post', {
      token: customerToken,
      body: { items, paymentMethod: 'cod', shippingAddress: { ...address, pincode: '123' } },
    });
    expect(blockedOrder.statusCode).toBe(400);
  });

  it('places COD and bank transfer orders, shows history and invoices, and adjusts stock', async () => {
    const items = [{ productId: product.id || product._id, slug: product.slug, quantity: 1 }];

    const cod = await callRoute(orderRouter, '/', 'post', {
      token: customerToken,
      body: {
        items,
        paymentMethod: 'cod',
        shippingAddress: address,
        billingDetails: {
          isBusiness: true,
          companyName: 'Flow Pvt Ltd',
          gstNumber: '29ABCDE1234F1Z5',
          sameAsShipping: true,
        },
      },
    });
    expect(cod.statusCode).toBe(201);
    codOrder = cod.body;
    expect(codOrder.status).toBe('placed');
    expect(codOrder.invoiceNumber).toBeTruthy();
    expect(codOrder.billingDetails.gstNumber).toBe('29ABCDE1234F1Z5');

    const afterCodStock = await callRoute(productRouter, '/id/:id', 'get', {
      params: { id: product.id || product._id },
    });
    expect(afterCodStock.body.stock).toBe(6);

    const bank = await callRoute(orderRouter, '/', 'post', {
      token: customerToken,
      body: { items, paymentMethod: 'bank_transfer', shippingAddress: address },
    });
    expect(bank.statusCode).toBe(201);
    bankOrder = bank.body;
    expect(bankOrder.paymentMethod).toBe('bank_transfer');

    const history = await callRoute(orderRouter, '/', 'get', { token: customerToken });
    expect(history.statusCode).toBe(200);
    expect(history.body.map((order) => order.id || order._id)).toContain(codOrder.id || codOrder._id);

    const invoice = await callRoute(orderRouter, '/:id/invoice', 'get', {
      token: customerToken,
      params: { id: codOrder.id || codOrder._id },
    });
    expect(invoice.statusCode).toBe(200);
    expect(invoice.body.invoiceNumber).toBe(codOrder.invoiceNumber);
    expect(invoice.body.items).toHaveLength(1);
  });

  it('moves fulfillment statuses and enforces cancellation/refund rules', async () => {
    const orderId = codOrder.id || codOrder._id;

    const packed = await callRoute(orderRouter, '/:id/status', 'patch', {
      token: adminToken,
      params: { id: orderId },
      body: { status: 'packed', note: 'Packed by QA' },
    });
    expect(packed.statusCode).toBe(200);
    expect(packed.body.status).toBe('packed');

    const shipped = await callRoute(orderRouter, '/:id/status', 'patch', {
      token: adminToken,
      params: { id: orderId },
      body: { status: 'shipped', note: 'Shipped by QA' },
    });
    expect(shipped.statusCode).toBe(200);
    expect(shipped.body.status).toBe('shipped');

    const lateCancel = await callRoute(orderRouter, '/:id/cancel', 'patch', {
      token: customerToken,
      params: { id: orderId },
    });
    expect(lateCancel.statusCode).toBe(400);

    const delivered = await callRoute(orderRouter, '/:id/status', 'patch', {
      token: adminToken,
      params: { id: orderId },
      body: { status: 'delivered', note: 'Delivered by QA' },
    });
    expect(delivered.statusCode).toBe(200);
    expect(delivered.body.status).toBe('delivered');

    const refunded = await callRoute(orderRouter, '/:id/status', 'patch', {
      token: adminToken,
      params: { id: orderId },
      body: { status: 'refunded', note: 'Refunded by QA' },
    });
    expect(refunded.statusCode).toBe(200);
    expect(refunded.body.status).toBe('refunded');

    const cancelled = await callRoute(orderRouter, '/:id/cancel', 'patch', {
      token: customerToken,
      params: { id: bankOrder.id || bankOrder._id },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');

    const restoredStock = await callRoute(productRouter, '/id/:id', 'get', {
      params: { id: product.id || product._id },
    });
    expect(restoredStock.body.stock).toBe(7);
  });

  it('covers admin users and support messages', async () => {
    const userRes = await callRoute(adminUsersRouter, '/', 'post', {
      token: adminToken,
      body: {
        email: `managed-${unique}@test.com`,
        password: 'ManagedPass123',
        name: 'Managed User',
        role: 'user',
      },
    });
    expect(userRes.statusCode).toBe(201);
    createdUser = userRes.body;
    expect(createdUser.emailVerified).toBe(true);

    const usersAfterCreate = await callRoute(adminUsersRouter, '/', 'get', { token: adminToken });
    expect(usersAfterCreate.statusCode).toBe(200);
    expect(usersAfterCreate.body.map((user) => user.email)).toContain(createdUser.email);

    const createdUserLogin = await callRoute(authRouter, '/login', 'post', {
      body: { email: createdUser.email, password: 'ManagedPass123' },
    });
    expect(createdUserLogin.statusCode).toBe(200);

    const updatedUser = await callRoute(adminUsersRouter, '/:id', 'put', {
      token: adminToken,
      params: { id: createdUser.id || createdUser._id },
      body: { email: createdUser.email, name: 'Managed User Updated', role: 'user' },
    });
    expect(updatedUser.statusCode).toBe(200);
    expect(updatedUser.body.name).toBe('Managed User Updated');

    const contact = await callRoute(supportRouter, '/contact', 'post', {
      body: {
        name: 'Support Customer',
        email: `customer-${unique}@test.com`,
        phone: '9876543210',
        subject: 'Order help',
        message: 'Please help me with my recent test order.',
      },
    });
    expect(contact.statusCode).toBe(201);

    const messages = await callRoute(supportRouter, '/messages', 'get', { token: adminToken });
    expect(messages.statusCode).toBe(200);
    expect(messages.body[0].subject).toBe('Order help');

    const deletedUser = await callRoute(adminUsersRouter, '/:id', 'delete', {
      token: adminToken,
      params: { id: createdUser.id || createdUser._id },
    });
    expect(deletedUser.statusCode).toBe(200);
  });

  it('lets admin delete products after flow verification', async () => {
    const deleted = await callRoute(productRouter, '/:id', 'delete', {
      token: adminToken,
      params: { id: product.id || product._id },
    });
    expect(deleted.statusCode).toBe(200);

    const missing = await callRoute(productRouter, '/id/:id', 'get', {
      params: { id: product.id || product._id },
    });
    expect(missing.statusCode).toBe(404);
  });
});
