import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },   // must be String
  token: { type: String },                  // if you kept it
  expiresAt: { type: Date, required: true },
});


const PasswordReset =
  mongoose.models.PasswordReset ||
  mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
