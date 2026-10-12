/**
 * POST /api/shipping/validate-address
 * Validates and normalizes a shipping address via ShipEngine.
 *
 * Body: { "address": { "street1": "...", "city": "...", "state": "CA", "postalCode": "90012", "country": "US" } }
 * Response: { "valid": true, "normalized": { ... }, "messages": [] }
 */

import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { validateShipEngineAddress } from '@/services/shipengine.service';
import { withAuth } from '@/middleware/auth.middleware';

async function handler(req: NextRequest) {
  try {
    const { address } = await req.json();

    if (!address?.street1 || !address?.postalCode) {
      return apiError('address.street1 and address.postalCode are required', 400);
    }

    const result = await validateShipEngineAddress(address);
    return apiSuccess(result);
  } catch (err: any) {
    console.error('[shipping/validate-address]', err);
    return apiError(err.message ?? 'Address validation failed', 500);
  }
}

export const POST = withAuth(handler);