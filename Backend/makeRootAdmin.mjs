// Backend/makeRootAdmin.mjs
// Idempotent seed script — safe to run multiple times.
// Creates the root admin if missing, or resets password + role if already present.
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';

const ADMIN_EMAIL    = 'sahith305@gmail.com';
const ADMIN_PASSWORD = 'ATMOS-ROOT-Σ▲TH-93-XIII-Ω-9F2C-OBLITERATE';
const ADMIN_NAME     = 'Sahith (Root Admin)';

const uri = process.env.MONGODB_URI;
console.log('MONGODB_URI in script:', uri ? '✅ loaded' : '❌ MISSING');

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    console.log('🔐 Password hashed with bcrypt (salt rounds: 12)');

    const user = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          role:          'admin',
          passwordHash,
          authProvider:  'email',
          emailVerified: true,   // admins never need OTP verification
          isActive:      true,
          tokenVersion:  0,
          lastLogin:     null,
        },
        $setOnInsert: {
          name: ADMIN_NAME,
        },
      },
      { upsert: true, new: true }
    );

    const action = user.createdAt?.getTime() === user.updatedAt?.getTime()
      ? 'CREATED'
      : 'UPDATED';

    console.log(`✅ Root admin ${action}:`);
    console.log(`   Email : ${user.email}`);
    console.log(`   Role  : ${user.role}`);
    console.log(`   Verified: ${user.emailVerified}`);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
