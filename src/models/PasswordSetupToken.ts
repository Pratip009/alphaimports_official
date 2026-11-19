import mongoose, { Document, Schema } from 'mongoose';

/**
 * One-time "set your password" links.
 *
 * Only a SHA-256 hash of the token is stored, so a database leak can't be
 * turned into working links. A token is single-use (`usedAt`), expires
 * (`expiresAt`), and every older unused token for the same user is retired
 * when a password is set.
 *
 * Records are kept for a while after they expire (TTL on `deleteAt`) so an
 * expired link can still say "this link has expired — send me a new one"
 * with the right email pre-filled, instead of a dead end.
 */
export type PasswordSetupPurpose = 'login_prompt' | 'announcement' | 'request' | 'guest_claim';

export interface IPasswordSetupToken extends Document {
  user: mongoose.Types.ObjectId;
  email: string;
  tokenHash: string;
  purpose: PasswordSetupPurpose;
  expiresAt: Date;
  usedAt?: Date | null;
  deleteAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordSetupTokenSchema = new Schema<IPasswordSetupToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    purpose: {
      type: String,
      enum: ['login_prompt', 'announcement', 'request', 'guest_claim'],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    deleteAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

PasswordSetupTokenSchema.index({ email: 1, createdAt: -1 });

const PasswordSetupToken = (() => {
  if (mongoose.models && mongoose.models.PasswordSetupToken) {
    return mongoose.models.PasswordSetupToken as mongoose.Model<IPasswordSetupToken>;
  }
  return mongoose.model<IPasswordSetupToken>('PasswordSetupToken', PasswordSetupTokenSchema);
})();

export default PasswordSetupToken;
