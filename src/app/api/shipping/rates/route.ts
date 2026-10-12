/**
 * POST /api/shipping/rates
 * Returns live shipping rates from all ShipEngine-connected carriers.
 *
 * Body:
 * {
 *   "origin":      { "street1": "...", "city": "New York", "state": "NY", "postalCode": "10001", "country": "US" },
 *   "destination": { "street1": "...", "city": "Los Angeles", "state": "CA", "postalCode": "90012", "country": "US" },
 *   "package":     { "weightLbs": 0.5, "lengthIn": 6, "widthIn": 4, "heightIn": 2, "declaredValueUsd": 500 }
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "rates": [...sorted cheapest first], "count": 8 }
 * }
 */

import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { getShipEngineRates } from '@/services/shipengine.service';
import { withAuth } from '@/middleware/auth.middleware';

async function handler(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, package: pkg } = body;

    if (!origin?.postalCode || !destination?.postalCode) {
      return apiError('origin.postalCode and destination.postalCode are required', 400);
    }
    if (!pkg?.weightLbs) {
      return apiError('package.weightLbs is required', 400);
    }

    const rates = await getShipEngineRates(origin, destination, pkg);

    return apiSuccess({ rates, count: rates.length });
  } catch (err: any) {
    console.error('[shipping/rates]', err);
    return apiError(err.message ?? 'Failed to fetch shipping rates', 500);
  }
}

// Only authenticated users (at checkout) can fetch rates
export const POST = withAuth(handler);