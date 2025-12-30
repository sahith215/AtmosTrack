// config/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not set');
    }

    const conn = await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected:', conn.connection.name);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
