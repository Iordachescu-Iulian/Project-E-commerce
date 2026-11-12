import Link from 'next/link';

import { Container } from '@/components/ui/Container';
import type { SessionUser } from '@/types';

const linkClass = 'rounded text-sm text-muted transition-colors hover:text-ink';

export function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b border-white/10 bg-surface/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-black tracking-[0.28em] text-ink transition-colors hover:text-accent"
        >
          HEXORA
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-4 sm:gap-6">
          <Link href="/catalog" className={linkClass}>
            Catalog
          </Link>

          {user ? (
            <Link href="/account" className={linkClass}>
              Account
            </Link>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-base transition-colors hover:bg-accent/90"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}
