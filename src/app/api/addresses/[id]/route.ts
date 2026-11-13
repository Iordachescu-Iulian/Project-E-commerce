import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { handleRouteError, readJson } from '@/lib/http';
import { assertSameOrigin } from '@/lib/security';
import { addressUpdateSchema } from '@/lib/validation';
import { deleteAddress, updateAddress } from '@/server/services/addresses';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const parsed = addressUpdateSchema.safeParse(await readJson(req));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid address.' },
        { status: 400 },
      );
    }

    const address = await updateAddress(user.id, params.id, parsed.data);

    if (!address) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const deleted = await deleteAddress(user.id, params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
