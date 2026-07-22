import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: {
      type: [
        {
          id: { type: String, required: true },
          fullName: { type: String, default: '' },
          phone: { type: String, default: '' },
          line1: { type: String, default: '' },
          city: { type: String, default: '' },
          state: { type: String, default: '' },
          pincode: { type: String, default: '' },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    wishlist: {
      type: [
        {
          productId: { type: String, default: '' },
          slug: { type: String, required: true },
          name: { type: String, default: '' },
          priceCents: { type: Number, default: 0 },
          category: { type: String, default: '' },
          image: { type: String, default: '' },
          addedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    emailVerified: { type: Boolean, default: false },
    otpCodeHash: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: '' },
    passwordResetExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
