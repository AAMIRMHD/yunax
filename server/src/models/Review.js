import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: String, default: '' },
    slug: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);

reviewSchema.index({ slug: 1, userId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
