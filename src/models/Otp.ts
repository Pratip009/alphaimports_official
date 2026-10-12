import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: 'signup' | 'reset_password';
  pendingName?: string;
  pendingPassword?: string;
  expiresAt: Date;
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
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, purpose: 1 });

const Otp = (() => {
  if (mongoose.models && mongoose.models.Otp) {
    return mongoose.models.Otp as mongoose.Model<IOtp>;
  }
  return mongoose.model<IOtp>('Otp', OtpSchema);
})();

export default Otp;