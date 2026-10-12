/**
 * POST /api/shipping/purchase-label
 * Admin-only. Purchases a ShipEngine label from a rate ID.
 *
 * Body: { "rateId": "se-rate-xxxxxxxxxxxxxxxx" }
 * Response: { "labelId": "se-xxx", "trackingNumber": "1Z...", "labelUrl": "https://..." }
 *
 * Rate IDs come from POST /api/shipping/rates — store the chosen rate's rateId
 * on the order at checkout so it can be used here to buy the label.
 */

import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { purchaseLabelFromRate } from '@/services/shipengine.service';
import { withAdmin } from '@/middleware/auth.middleware';

async function handler(req: NextRequest) {
  try {
    const { rateId } = await req.json();

    if (!rateId?.trim()) {
      return apiError('rateId is required', 400);
    }

    const label = await purchaseLabelFromRate(rateId.trim());
    return apiSuccess(label);
  } catch (err: any) {
    console.error('[shipping/purchase-label]', err);
    return apiError(err.message ?? 'Failed to purchase label', 500);
  }
}

export const POST = withAdmin(handler);