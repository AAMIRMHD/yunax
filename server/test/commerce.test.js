import { describe, expect, it } from 'vitest';
import {
  calculateOrderPricing,
  canCancelOrder,
  canDeleteOrder,
  isStatusTransitionAllowed,
} from '../src/lib/commerce.js';

describe('commerce rules', () => {
  it('calculates shipping, tax, and eta for a serviceable pincode', () => {
    const result = calculateOrderPricing({
      items: [
        { priceCents: 150000, quantity: 1 },
        { priceCents: 50000, quantity: 2 },
      ],
      shippingAddress: { pincode: '673016' },
    });

    expect(result.shipping.serviceable).toBe(true);
    expect(result.subtotalCents).toBe(250000);
    expect(result.totalCents).toBeGreaterThanOrEqual(result.subtotalCents);
    expect(result.taxCents).toBeGreaterThan(0);
    expect(result.eta.label).toBeTruthy();
  });

  it('allows only valid lifecycle transitions', () => {
    expect(isStatusTransitionAllowed({ currentStatus: 'placed', nextStatus: 'packed', isAdmin: true, paymentStatus: 'pending' })).toBe(true);
    expect(isStatusTransitionAllowed({ currentStatus: 'placed', nextStatus: 'delivered', isAdmin: true, paymentStatus: 'pending' })).toBe(false);
    expect(isStatusTransitionAllowed({ currentStatus: 'shipped', nextStatus: 'cancelled', isAdmin: false, paymentStatus: 'pending' })).toBe(false);
  });

  it('keeps cancellation and deletion rules strict', () => {
    expect(canCancelOrder({ status: 'placed' })).toBe(true);
    expect(canCancelOrder({ status: 'shipped' })).toBe(false);
    expect(canDeleteOrder({ status: 'cancelled' })).toBe(true);
    expect(canDeleteOrder({ status: 'packed' })).toBe(false);
  });
});
