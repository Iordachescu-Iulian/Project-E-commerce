import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { AuthError } from '@/lib/auth';
import { jsonError } from '@/lib/security';

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return jsonError(error.status, error.message);
  }

  if (error instanceof ZodError) {
    return jsonError(400, error.issues[0]?.message ?? 'Invalid input.');
  }

  if (error instanceof Error) {
    if (error.message.includes('Cross-origin') || error.message.includes('Origin')) {
      return jsonError(403, error.message);
    }
  }

  console.error(error);
  return jsonError(500, 'Unexpected server error.');
}
