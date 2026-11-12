import { NextResponse } from 'next/server';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Rejects a mutating browser request whose Origin does not match the request
 * host. Requests without an Origin header (curl, server-to-server) are allowed
 * here and must be authenticated by the route itself.
 */
export function assertSameOrigin(req: Request): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return;
  }

  const origin = req.headers.get('origin');

  if (!origin) {
    return;
  }

  let originHost: string;

  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error('Invalid Origin header');
  }

  const expectedHost = req.headers.get('host') ?? new URL(req.url).host;

  if (originHost !== expectedHost) {
    throw new Error('Cross-origin request blocked');
  }
}

export function jsonError(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
