import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, default: '' },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    slug: { type: String, default: '' },
    name: String,
    priceCents: Number,
    quantity: Number,
    image: String,
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    line1: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    isBusiness: { type: Boolean, default: false },
    companyName: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    sameAsShipping: { type: Boolean, default: true },
    address: { type: addressSchema, default: () => ({}) },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [itemSchema],
    subtotalCents: { type: Number, default: 0 },
    shippingCents: { type: Number, default: 0 },
    discountCents: { type: Number, default: 0 },
    taxCents: { type: Number, default: 0 },
    totalCents: Number,
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'placed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'], default: 'placed' },
    paymentMethod: { type: String, enum: ['razorpay', 'cod', 'bank_transfer'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    taxMode: { type: String, enum: ['inclusive', 'exclusive'], default: 'inclusive' },
    gstRate: { type: Number, default: 0.18 },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    shippingAddress: { type: addressSchema, default: () => ({}) },
    billingDetails: { type: billingSchema, default: () => ({}) },
    shippingZone: { type: String, default: 'national' },
    shippingLabel: { type: String, default: '' },
    shippingServiceable: { type: Boolean, default: true },
    estimatedDeliveryMinDays: { type: Number, default: 0 },
    estimatedDeliveryMaxDays: { type: Number, default: 0 },
    invoiceNumber: { type: String, default: '' },
    invoiceIssuedAt: { type: Date, default: Date.now },
    refundReason: { type: String, default: '' },
    refundedAt: { type: Date, default: null },
    statusTimeline: { type: [timelineSchema], default: [] },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
