import crypto from 'crypto';
import mongoose from 'mongoose';
import User, { IUser } from '@/models/User';
import Cart from '@/models/Cart';
import Order from '@/models/Order';
import Product from '@/models/Product';

/**
 * Guest checkout.
 *
 * Shopping without an account works by giving the visitor a lightweight
 * guest session the first time they add something to their cart. A guest is
 * a User document with `isGuest: true`, a placeholder email and no password,
 * so every existing cart / order / PayPal code path (all keyed by user id)
 * works unchanged. The customer's real email is collected at checkout and
 * stored on the order (`Order.guestEmail`).
 *
 * When the visitor later signs in, sets a password or signs up, the guest's
 * cart is moved into the real account, along with any guest orders placed
 * with that account's email address.
 */

export const GUEST_EMAIL_DOMAIN = 'guest.alphaimports.invalid';

export async function createGuestUser(): Promise<IUser> {
  const id = crypto.randomBytes(12).toString('hex');
  return User.create({
    name: 'Guest',
    email: `guest-${id}@${GUEST_EMAIL_DOMAIN}`,
    role: 'user',
    isGuest: true,
    authProviders: [],
    emailVerified: false,
  });
}

/** Adds the guest's cart lines into the member's cart (capped at stock), then deletes the guest cart. */
async function mergeCarts(guestId: mongoose.Types.ObjectId | string, memberId: mongoose.Types.ObjectId | string) {
  const guestCart = await Cart.findOne({ user: guestId });
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await Cart.deleteOne({ _id: guestCart._id });
    return;
  }
  let memberCart = await Cart.findOne({ user: memberId });
  if (!memberCart) memberCart = new Cart({ user: memberId, items: [] });

  for (const g of guestCart.items as Array<{ product: mongoose.Types.ObjectId; quantity: number; price: number }>) {
    const product = await Product.findOne({ _id: g.product, isActive: true })
      .select('stock reservedForMemo price')
      .lean() as { stock: number; reservedForMemo?: number; price: number } | null;
    if (!product) continue;
    const available = Math.max(0, product.stock - (product.reservedForMemo || 0));
    const existing = (memberCart.items as typeof guestCart.items).find(
      (m: { product: mongoose.Types.ObjectId }) => m.product.toString() === g.product.toString()
    ) as { quantity: number } | undefined;
    if (existing) {
      existing.quantity = Math.min(available, Math.max(existing.quantity, g.quantity));
    } else if (available > 0) {
      memberCart.items.push({ product: g.product, quantity: Math.min(available, g.quantity), price: product.price });
    }
  }
  memberCart.items = (memberCart.items as Array<{ quantity: number }>).filter((i) => i.quantity >= 1) as typeof memberCart.items;
  await memberCart.save();
  await Cart.deleteOne({ _id: guestCart._id });
}

/**
 * Moves orders a guest placed with `email` into the member's account so they
 * show up in "My Orders". Only orders owned by guest sessions are moved.
 */
export async function claimGuestOrdersByEmail(member: { _id: mongoose.Types.ObjectId | string; email: string }) {
  const email = member.email.toLowerCase();
  const candidates = await Order.find({ guestEmail: email }).select('user').lean();
  if (!candidates.length) return 0;
  const guestIds = await User.find({
    _id: { $in: candidates.map((o) => o.user) },
    isGuest: true,
  }).distinct('_id');
  if (!guestIds.length) return 0;
  const r = await Order.updateMany(
    { guestEmail: email, user: { $in: guestIds } },
    { $set: { user: member._id, guestEmail: null } }
  );
  return r.modifiedCount;
}

/**
 * Called whenever a real account signs in while a guest session is active
 * (login, set-password link, signup, Google). Never throws — a failed merge
 * must not block signing in.
 */
export async function mergeGuestIntoMember(
  guestId: string | null | undefined,
  member: { _id: mongoose.Types.ObjectId | string; email: string }
) {
  try {
    if (guestId && guestId !== member._id.toString()) {
      const guest = await User.findOne({ _id: guestId, isGuest: true }).select('_id').lean();
      if (guest) {
        await mergeCarts(guest._id, member._id);
        // Orders the guest placed under this member's email move over; any
        // placed with a different email stay with the guest record.
        await Order.updateMany(
          { user: guest._id, guestEmail: member.email.toLowerCase() },
          { $set: { user: member._id, guestEmail: null } }
        );
        const remaining = await Order.countDocuments({ user: guest._id });
        if (remaining === 0) await User.deleteOne({ _id: guest._id, isGuest: true });
      }
    }
    await claimGuestOrdersByEmail(member);
  } catch (err) {
    console.error('[mergeGuestIntoMember]', err);
  }
}

/** Deletes guest sessions that never placed an order (cart included). */
export async function deleteStaleGuests(olderThanDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  let deleted = 0;
  for (;;) {
    const batch = await User.find({ isGuest: true, updatedAt: { $lt: cutoff } }).select('_id').limit(500).lean();
    if (!batch.length) break;
    const ids = batch.map((u) => u._id);
    const withOrders = new Set((await Order.distinct('user', { user: { $in: ids } })).map(String));
    const toDelete = ids.filter((id) => !withOrders.has(String(id)));
    if (toDelete.length) {
      await Cart.deleteMany({ user: { $in: toDelete } });
      const r = await User.deleteMany({ _id: { $in: toDelete }, isGuest: true });
      deleted += r.deletedCount;
    }
    if (toDelete.length < batch.length) {
      // Guests with orders are kept; touch them so the loop moves past them.
      await User.updateMany(
        { _id: { $in: ids.filter((id) => withOrders.has(String(id))) } },
        { $set: { updatedAt: new Date() } }
      );
    }
    if (batch.length < 500) break;
  }
  return deleted;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', CA: 'Canada', GB: 'United Kingdom', AU: 'Australia', IN: 'India',
};

/**
 * Turns a guest checkout into a real account (no password yet) when the
 * guest asks for one. Only works if this guest session placed an order with
 * that email, and only if no account uses the email already. The account is
 * flagged `needsPasswordSetup`, so it can't be used until the emailed link
 * is opened — which proves the address belongs to them.
 */
export async function createAccountFromGuestOrder(guestId: string, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const order = await Order.findOne({ user: guestId, guestEmail: normalized, paymentStatus: 'completed' })
    .sort({ createdAt: -1 })
    .lean();
  if (!order) return false;
  const a = order.shippingAddress;
  try {
    await User.create({
      name: (a?.fullName || 'Customer').slice(0, 100),
      email: normalized,
      role: 'user',
      authProviders: [],
      needsPasswordSetup: true,
      emailVerified: false,
      phone: (a?.phone || '').slice(0, 20),
      address: {
        line1: a?.addressLine1 || '',
        line2: a?.addressLine2 || '',
        city: a?.city || '',
        state: a?.state || '',
        postalCode: a?.postalCode || '',
        country: COUNTRY_NAMES[a?.country || ''] || a?.country || '',
      },
    });
    return true;
  } catch (err: any) {
    // Someone (maybe they, in another tab) created it a moment ago — fine.
    if (err?.code === 11000) return true;
    throw err;
  }
}
