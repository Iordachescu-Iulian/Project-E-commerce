import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { RegisterForm } from '@/components/auth/RegisterForm';
import { Container } from '@/components/ui/Container';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create account',
};

export default async function RegisterPage() {
  const user = await getSessionUser();

  if (user) {
    redirect('/account');
  }

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Account</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Save delivery addresses and keep your cart between visits. Passwords are hashed with
          bcrypt on the server.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-accent hover:text-accent/80">
            Sign in
          </Link>
        </p>
      </div>
    </Container>
  );
}
