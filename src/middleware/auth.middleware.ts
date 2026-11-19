import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromCookie, JWTPayload } from '@/lib/jwt';

export type AuthenticatedRequest = NextRequest & {
  user: JWTPayload;
};

type RouteHandler = (
  req: AuthenticatedRequest,
  context: any
) => Promise<Response>;

export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: any
  ): Promise<Response> => {
    try {
      const token = extractTokenFromCookie(req);

      if (!token) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);
      (req as AuthenticatedRequest).user = payload;
      return handler(req as AuthenticatedRequest, context);
    } catch (err) {
      console.error('Auth verification failed:', err);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Like withAuth, but refuses guest-checkout sessions. Use for anything that
 * belongs to a real account (profile, memos, reviews, comments...). Cart,
 * checkout, payment, orders and wishlist stay on plain withAuth so people
 * can shop without signing up.
 */
export function withMember(handler: RouteHandler) {
  return withAuth(async (req: AuthenticatedRequest, context: any): Promise<Response> => {
    if (req.user.guest) {
      return NextResponse.json(
        { success: false, message: 'Please sign in to your account to do this.' },
        { status: 401 }
      );
    }
    return handler(req, context);
  });
}

export function withAdmin(handler: RouteHandler) {
  return withAuth(
    async (
      req: AuthenticatedRequest,
      context: any
    ): Promise<Response> => {
      if (req.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, message: 'Admin access required' },
          { status: 403 }
        );
      }
      return handler(req, context);
    }
  );
}

export function withOptionalAuth(
  handler: (
    req: NextRequest & { user?: JWTPayload },
    context: any
  ) => Promise<Response>
) {
  return async (
    req: NextRequest,
    context: any
  ): Promise<Response> => {
    try {
      const token = extractTokenFromCookie(req);
      if (token) {
        const payload = verifyToken(token);
        (req as NextRequest & { user?: JWTPayload }).user = payload;
      }
    } catch (err) {
      console.error('Optional auth verification failed:', err);
    }

    return handler(req as NextRequest & { user?: JWTPayload }, context);
  };
}