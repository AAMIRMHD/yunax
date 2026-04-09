import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    priceCents: Number,
    quantity: Number,
    image: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [itemSchema],
    totalCents: Number,
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
