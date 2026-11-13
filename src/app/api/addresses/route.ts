import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { handleRouteError, readJson } from '@/lib/http';
import { assertSameOrigin } from '@/lib/security';
import { addressSchema } from '@/lib/validation';
import { createAddress, listAddresses } from '@/server/services/addresses';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ addresses: await listAddresses(user.id) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const parsed = addressSchema.safeParse(await readJson(req));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid address.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { address: await createAddress(user.id, parsed.data) },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
