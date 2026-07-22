const DEFAULT_GST_RATE = Number(process.env.GST_RATE || 0.18);
const DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS = Number(process.env.FREE_SHIPPING_THRESHOLD_CENTS || 500000);
const DEFAULT_STANDARD_SHIPPING_CENTS = Number(process.env.STANDARD_SHIPPING_CENTS || 19900);
const DEFAULT_REMOTE_SHIPPING_CENTS = Number(process.env.REMOTE_SHIPPING_CENTS || 34900);
const DEFAULT_LOCAL_SHIPPING_CENTS = Number(process.env.LOCAL_SHIPPING_CENTS || 9900);

const parseCsv = (value = '') =>
  String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const SERVICEABLE_PINCODES = new Set(parseCsv(process.env.SERVICEABLE_PINCODES));
const SERVICEABLE_PREFIXES = parseCsv(process.env.SERVICEABLE_PINCODE_PREFIXES);
const BLOCKED_PINCODES = new Set(parseCsv(process.env.NON_SERVICEABLE_PINCODES));
const BLOCKED_PREFIXES = parseCsv(process.env.NON_SERVICEABLE_PINCODE_PREFIXES);
const LOCAL_PREFIXES = parseCsv(process.env.LOCAL_PINCODE_PREFIXES || '67');
const REGIONAL_PREFIXES = parseCsv(process.env.REGIONAL_PINCODE_PREFIXES || '5,6,7,8');
const REMOTE_PREFIXES = parseCsv(process.env.REMOTE_PINCODE_PREFIXES || '79,80,81,82,83,90,91,92,93,94,95,96,97,98,99');

export const ORDER_STATUSES = ['pending', 'placed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const ETA_BY_ZONE = {
  local: { minDays: 2, maxDays: 3, label: '2-3 business days' },
  regional: { minDays: 3, maxDays: 5, label: '3-5 business days' },
  national: { minDays: 4, maxDays: 6, label: '4-6 business days' },
  remote: { minDays: 5, maxDays: 8, label: '5-8 business days' },
};

export const normalizePincode = (value = '') => String(value || '').replace(/\D/g, '').slice(0, 6);

export const isServiceablePincode = (value = '') => {
  const pincode = normalizePincode(value);
  if (!/^\d{6}$/.test(pincode)) return false;
  if (BLOCKED_PINCODES.has(pincode)) return false;
  if (BLOCKED_PREFIXES.some((prefix) => pincode.startsWith(prefix))) return false;
  if (SERVICEABLE_PINCODES.size > 0) return SERVICEABLE_PINCODES.has(pincode);
  if (SERVICEABLE_PREFIXES.length > 0) return SERVICEABLE_PREFIXES.some((prefix) => pincode.startsWith(prefix));
  return true;
};

export const getShippingZone = (value = '') => {
  const pincode = normalizePincode(value);
  if (REMOTE_PREFIXES.some((prefix) => pincode.startsWith(prefix))) return 'remote';
  if (LOCAL_PREFIXES.some((prefix) => pincode.startsWith(prefix))) return 'local';
  if (REGIONAL_PREFIXES.some((prefix) => pincode.startsWith(prefix))) return 'regional';
  return 'national';
};

export const calculateOrderPricing = ({ items = [], shippingAddress = {} }) => {
  const subtotalCents = items.reduce((sum, item) => sum + Math.max(0, Number(item.priceCents || 0)) * Math.max(1, Number(item.quantity || 1)), 0);
  const pincode = normalizePincode(shippingAddress.pincode);
  const serviceable = isServiceablePincode(pincode);
  const zone = getShippingZone(pincode);
  const baseShippingCents =
    zone === 'local'
      ? DEFAULT_LOCAL_SHIPPING_CENTS
      : zone === 'remote'
        ? DEFAULT_REMOTE_SHIPPING_CENTS
        : DEFAULT_STANDARD_SHIPPING_CENTS;
  const isFreeShipping = subtotalCents >= DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS;
  const shippingDiscountCents = isFreeShipping ? baseShippingCents : 0;
  const shippingCents = serviceable ? Math.max(0, baseShippingCents - shippingDiscountCents) : 0;
  const totalCents = subtotalCents + shippingCents;
  const taxCents = Math.round((totalCents * DEFAULT_GST_RATE) / (1 + DEFAULT_GST_RATE));
  const eta = ETA_BY_ZONE[zone] || ETA_BY_ZONE.national;

  return {
    currency: 'INR',
    subtotalCents,
    shippingCents,
    shippingDiscountCents,
    discountCents: shippingDiscountCents,
    totalCents,
    taxCents,
    gstRate: DEFAULT_GST_RATE,
    taxMode: 'inclusive',
    shipping: {
      serviceable,
      zone,
      freeThresholdCents: DEFAULT_FREE_SHIPPING_THRESHOLD_CENTS,
      isFreeShipping,
      label: isFreeShipping ? 'Free shipping applied' : `${eta.label} delivery`,
    },
    eta,
  };
};

export const normalizeBillingDetails = (billingDetails = {}, shippingAddress = {}) => {
  const sameAsShipping = billingDetails?.sameAsShipping !== false;
  const rawAddress = sameAsShipping ? shippingAddress : (billingDetails?.address || {});

  return {
    isBusiness: Boolean(billingDetails?.isBusiness),
    companyName: String(billingDetails?.companyName || '').trim(),
    gstNumber: String(billingDetails?.gstNumber || '').trim().toUpperCase(),
    sameAsShipping,
    address: {
      fullName: String(rawAddress.fullName || '').trim(),
      phone: String(rawAddress.phone || '').trim(),
      line1: String(rawAddress.line1 || '').trim(),
      city: String(rawAddress.city || '').trim(),
      state: String(rawAddress.state || '').trim(),
      pincode: normalizePincode(rawAddress.pincode),
    },
  };
};

export const createInvoiceNumber = (orderId = '') => {
  const date = new Date();
  const stamp = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
  const suffix = String(orderId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'ORDER';
  return `YUNAX-${stamp}-${suffix}`;
};

export const getNextPaymentStatus = ({ currentStatus = '', nextStatus = '', paymentStatus = '' }) => {
  const next = String(nextStatus || '').toLowerCase();
  const currentPayment = String(paymentStatus || '').toLowerCase();
  if (next === 'refunded') return 'refunded';
  if (next === 'cancelled' && currentPayment === 'paid') return 'refunded';
  if (next === 'failed') return currentPayment === 'paid' ? currentPayment : 'failed';
  return currentPayment || (String(currentStatus || '').toLowerCase() === 'pending' ? 'pending' : 'pending');
};

export const canCancelOrder = (order = {}) => ['pending', 'placed', 'packed'].includes(String(order.status || '').toLowerCase());

export const canDeleteOrder = (order = {}) => ['cancelled', 'delivered', 'failed', 'refunded'].includes(String(order.status || '').toLowerCase());

export const isStatusTransitionAllowed = ({ currentStatus = '', nextStatus = '', isAdmin = false, paymentStatus = '' }) => {
  const current = String(currentStatus || '').toLowerCase();
  const next = String(nextStatus || '').toLowerCase();
  if (!ORDER_STATUSES.includes(next)) return false;
  if (current === next) return true;
  if (!current) return next === 'pending' || next === 'placed';
  if (!isAdmin) {
    return next === 'cancelled' && canCancelOrder({ status: current });
  }

  const transitions = {
    pending: ['placed', 'failed', 'cancelled'],
    placed: ['packed', 'cancelled', 'failed'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: paymentStatus === 'paid' ? ['refunded'] : [],
    refunded: [],
    failed: [],
  };

  return (transitions[current] || []).includes(next);
};

export const buildStatusTimelineEntry = (status, note = '') => ({
  status: String(status || '').toLowerCase(),
  note: String(note || '').trim(),
  at: Date.now(),
});
