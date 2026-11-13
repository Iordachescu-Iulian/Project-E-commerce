import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/auth/LoginForm';
import { Container } from '@/components/ui/Container';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Log in',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getSessionUser();

  if (user) {
    redirect('/account');
  }

  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Account</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Sign in to manage your delivery addresses and keep your cart after logout.
        </p>

        <div className="mt-6">
          <LoginForm next={searchParams.next} />
        </div>

        <p className="mt-6 rounded-md border border-white/10 bg-base p-3 text-xs leading-relaxed text-muted">
          Demo customer: <span className="text-ink">demo@hexora.test</span> /{' '}
          <span className="text-ink">Demo1234!</span>
          <br />
          Administrator: <span className="text-ink">admin@hexora.test</span> /{' '}
          <span className="text-ink">Admin1234!</span>
        </p>

        <p className="mt-6 text-center text-sm text-muted">
          Need an account?{' '}
          <Link href="/register" className="font-semibold text-accent hover:text-accent/80">
            Register
          </Link>
        </p>
      </div>
    </Container>
  );
}
