import { NextResponse } from 'next/server';

import { handleRouteError, readJson } from '@/lib/http';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/security';
import { createSession } from '@/lib/session';
import { registerSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);

    const parsed = registerSchema.safeParse(await readJson(req));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid registration details.' },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await createSession(user);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
