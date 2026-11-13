import { NextResponse } from 'next/server';

import { handleRouteError } from '@/lib/http';
import { assertSameOrigin } from '@/lib/security';
import { destroySession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
