import { NextResponse } from 'next/server';

import { handleRouteError, readJson } from '@/lib/http';
import { verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security';
import { createSession } from '@/lib/session';
import { loginSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    const parsed = loginSchema.safeParse(await readJson(req));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid login details.' },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;
    const account = await prisma.user.findUnique({ where: { email } });

    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    }

    const user = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
    };

    await createSession(user);

    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
