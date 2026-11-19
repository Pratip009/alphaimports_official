import { NextRequest } from 'next/server';
import { withMember } from '@/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requestReturn, MemoError } from '@/services/memo.service';

export const POST = withMember(
  async (req: NextRequest & { user: { userId: string } }, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const memo = await requestReturn(id, req.user.userId);
      return successResponse(memo, 200);
    } catch (err) {
      if (err instanceof MemoError) return errorResponse(err.message, err.status);
      console.error('POST /api/memos/[id]/return error:', err);
      return errorResponse('Failed to request return', 500);
    }
  }
);
