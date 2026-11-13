'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { errorClass } from '@/components/ui/form';

export interface AddressListItem {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function AddressList({ addresses }: { addresses: AddressListItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setDefault(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? 'Could not update the address.');
        return;
      }

      router.refresh();
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);

    try {
      const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? 'Could not delete the address.');
        return;
      }

      router.refresh();
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (addresses.length === 0) {
    return <p className="text-sm text-muted">No delivery address saved yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className={errorClass}>{error}</p> : null}

      {addresses.map((address) => (
        <article
          key={address.id}
          className="rounded-lg border border-white/10 bg-base p-4 text-sm text-muted"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">
                {address.fullName}
                {address.isDefault ? (
                  <span className="ml-2 rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    Default
                  </span>
                ) : null}
              </p>
              <p className="mt-1">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
              </p>
              <p>
                {address.city}
                {address.county ? `, ${address.county}` : ''} {address.postalCode},{' '}
                {address.country}
              </p>
              <p className="mt-1">{address.phone}</p>
            </div>

            <div className="flex gap-2">
              {!address.isDefault ? (
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setDefault(address.id)}
                  disabled={busyId === address.id}
                >
                  Set default
                </Button>
              ) : null}
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() => remove(address.id)}
                disabled={busyId === address.id}
              >
                Delete
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
