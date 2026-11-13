import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AddressForm } from '@/components/account/AddressForm';
import { AddressList } from '@/components/account/AddressList';
import { LogoutButton } from '@/components/account/LogoutButton';
import { Container } from '@/components/ui/Container';
import { getSessionUser } from '@/lib/auth';
import { listAddresses } from '@/server/services/addresses';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your account',
};

export default async function AccountPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const addresses = await listAddresses(user.id);

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Account</p>
          <h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'ADMIN' ? (
            <span className="rounded-full border border-secondary/40 bg-secondary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-ink">
              Administrator
            </span>
          ) : null}
          <LogoutButton />
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="text-xl font-bold text-ink">Delivery addresses</h2>
          <p className="mt-1 text-sm text-muted">
            The default address is preselected at checkout.
          </p>
          <div className="mt-5">
            <AddressList addresses={addresses} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-6">
          <h2 className="text-xl font-bold text-ink">Add a delivery address</h2>
          <p className="mt-1 text-sm text-muted">
            You can save more than one address and change the default later.
          </p>
          <div className="mt-5">
            <AddressForm hasAddresses={addresses.length > 0} />
          </div>
        </section>
      </div>
    </Container>
  );
}
