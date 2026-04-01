import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /**
     * Bcrypt-hashed password. NOT required for OAuth users (authProvider: 'google').
     */
    passwordHash: {
      type: String,
      required: false,
      default: null,
    },
    /**
     * How this account was created. 'email' = password-based, 'google' = OAuth.
     */
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    role: {
      type: String,
      enum: ['admin', 'operator', 'viewer'],
      default: 'viewer',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    /**
     * Incremented whenever role changes or account is force-logged-out.
     * JWTs carrying a lower tokenVersion are immediately rejected.
     */
    tokenVersion: {
      type: Number,
      default: 0,
    },
    /**
     * If false, the user is deactivated — all their JWTs are instantly invalidated.
     */
    isActive: {
      type: Boolean,
      default: true,
    },
    /**
     * True if the user was created via Google and hasn't selected a role yet.
     */
    needsRoleSelection: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  { timestamps: true }
);

// Indexes for admin queries (role filter, verified filter)
userSchema.index({ role: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);

export default User;
