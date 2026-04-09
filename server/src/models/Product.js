import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    priceCents: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    category: { type: String, index: true },
    stock: { type: Number, default: 0 },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
