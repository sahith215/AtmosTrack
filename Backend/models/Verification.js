import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    code: { type: String, required: true },      // 6‑digit OTP as string
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const Verification =
  mongoose.models.Verification || mongoose.model('Verification', verificationSchema);

export default Verification;
