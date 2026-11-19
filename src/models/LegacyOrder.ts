import mongoose, { Document, Schema } from 'mongoose';

/**
 * Read-only order history imported from the old Alpha Imports (osCommerce)
 * website. Kept in its own collection on purpose: these orders reference
 * old product ids, have no PayPal/ShipEngine state, and must never be
 * touched by the live order pipeline (stock reservation, payment capture,
 * stale-order cleanup, label purchase...).
 *
 * Written only by scripts/migrate-legacy-customers.mjs.
 */
export interface ILegacyOrderAddress {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface ILegacyOrderItem {
  legacyProductId?: number;
  model?: string;
  name: string;
  /** Unit price actually charged (osCommerce `final_price`). */
  price: number;
  quantity: number;
  options?: Array<{ name: string; value: string }>;
}

export interface ILegacyOrderTotal {
  /** osCommerce total module, e.g. ot_subtotal, ot_shipping, ot_coupon, ot_total. */
  code: string;
  title: string;
  value: number;
}

export interface ILegacyOrderStatusEntry {
  date: Date | null;
  statusId: number;
  status: string;
  /** Only comments the customer was notified about on the old site. */
  comment?: string;
}

export interface ILegacyOrder extends Document {
  legacyOrderId: number;
  legacyCustomerId: number;
  /** The migrated account this order belongs to (null if none could be matched). */
  user: mongoose.Types.ObjectId | null;
  email: string;
  customerName: string;
  phone?: string;
  delivery: ILegacyOrderAddress;
  billing?: ILegacyOrderAddress;
  paymentMethod?: string;
  customerComment?: string;
  items: ILegacyOrderItem[];
  totals: ILegacyOrderTotal[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  statusId: number;
  status: string;
  statusHistory: ILegacyOrderStatusEntry[];
  tracking: Array<{ carrier: string; number: string }>;
  purchasedAt: Date | null;
  lastModifiedAt?: Date | null;
  importedAt: Date;
}

const AddressSchema = new Schema<ILegacyOrderAddress>(
  {
    name: String,
    company: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const LegacyOrderSchema = new Schema<ILegacyOrder>(
  {
    legacyOrderId: { type: Number, required: true },
    legacyCustomerId: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, lowercase: true, trim: true },
    customerName: String,
    phone: String,
    delivery: AddressSchema,
    billing: AddressSchema,
    paymentMethod: String,
    customerComment: String,
    items: [
      new Schema<ILegacyOrderItem>(
        {
          legacyProductId: Number,
          model: String,
          name: String,
          price: Number,
          quantity: Number,
          options: [{ _id: false, name: String, value: String }],
        },
        { _id: false }
      ),
    ],
    totals: [{ _id: false, code: String, title: String, value: Number }],
    subtotal: Number,
    shipping: Number,
    total: Number,
    currency: String,
    statusId: Number,
    status: String,
    statusHistory: [
      { _id: false, date: Date, statusId: Number, status: String, comment: String },
    ],
    tracking: [{ _id: false, carrier: String, number: String }],
    purchasedAt: Date,
    lastModifiedAt: Date,
    importedAt: Date,
  },
  { collection: 'legacyorders' }
);

LegacyOrderSchema.index({ legacyOrderId: 1 }, { unique: true });
LegacyOrderSchema.index({ user: 1, purchasedAt: -1 });
LegacyOrderSchema.index({ email: 1 });

const LegacyOrder = (() => {
  if (mongoose.models && mongoose.models.LegacyOrder) {
    return mongoose.models.LegacyOrder as mongoose.Model<ILegacyOrder>;
  }
  return mongoose.model<ILegacyOrder>('LegacyOrder', LegacyOrderSchema);
})();

export default LegacyOrder;
