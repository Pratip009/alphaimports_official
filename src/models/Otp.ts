import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: 'signup' | 'reset_password';
  pendingName?: string;
  pendingPassword?: string;
  /** TTL: when MongoDB deletes the record (retention, not code validity). */
  expiresAt: Date;
  /** When the code itself stops working. Older records have none — use expiresAt. */
  codeExpiresAt?: Date;
  /** Replaced by a newer code. Kept (until expiresAt) so rate limits can count it. */
  superseded?: boolean;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      select: false,
    },
    purpose: {
      type: String,
      enum: ['signup', 'reset_password'],
      required: true,
    },
    pendingName: { type: String },
    pendingPassword: { type: String, select: false },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    codeExpiresAt: { type: Date },
    superseded: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, purpose: 1 });
OtpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

const Otp = (() => {
  if (mongoose.models && mongoose.models.Otp) {
    return mongoose.models.Otp as mongoose.Model<IOtp>;
  }
  return mongoose.model<IOtp>('Otp', OtpSchema);
})();

export default Otp;