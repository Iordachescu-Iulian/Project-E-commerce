'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { errorClass, inputClass, labelClass, successClass } from '@/components/ui/form';

const initialForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  county: '',
  postalCode: '',
  country: 'Romania',
  isDefault: false,
};

export function AddressForm({ hasAddresses }: { hasAddresses: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(field: keyof typeof initialForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          line2: form.line2 || undefined,
          county: form.county || undefined,
          isDefault: hasAddresses ? form.isDefault : true,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Could not save the address.');
        return;
      }

      setForm(initialForm);
      setSuccess('Address saved.');
      router.refresh();
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error ? <p className={errorClass}>{error}</p> : null}
      {success ? <p className={successClass}>{success}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-name" className={labelClass}>
            Recipient name
          </label>
          <input
            id="address-name"
            required
            value={form.fullName}
            onChange={(event) => update('fullName', event.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="address-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="address-phone"
            required
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            className={inputClass}
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address-line1" className={labelClass}>
          Street address
        </label>
        <input
          id="address-line1"
          required
          value={form.line1}
          onChange={(event) => update('line1', event.target.value)}
          className={inputClass}
          autoComplete="address-line1"
        />
      </div>

      <div>
        <label htmlFor="address-line2" className={labelClass}>
          Apartment, floor, details (optional)
        </label>
        <input
          id="address-line2"
          value={form.line2}
          onChange={(event) => update('line2', event.target.value)}
          className={inputClass}
          autoComplete="address-line2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-city" className={labelClass}>
            City
          </label>
          <input
            id="address-city"
            required
            value={form.city}
            onChange={(event) => update('city', event.target.value)}
            className={inputClass}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label htmlFor="address-county" className={labelClass}>
            County (optional)
          </label>
          <input
            id="address-county"
            value={form.county}
            onChange={(event) => update('county', event.target.value)}
            className={inputClass}
            autoComplete="address-level1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="address-postal" className={labelClass}>
            Postal code
          </label>
          <input
            id="address-postal"
            required
            value={form.postalCode}
            onChange={(event) => update('postalCode', event.target.value)}
            className={inputClass}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label htmlFor="address-country" className={labelClass}>
            Country
          </label>
          <input
            id="address-country"
            required
            value={form.country}
            onChange={(event) => update('country', event.target.value)}
            className={inputClass}
            autoComplete="country-name"
          />
        </div>
      </div>

      {hasAddresses ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(event) => update('isDefault', event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-base accent-accent"
          />
          Make this my default delivery address
        </label>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save delivery address'}
      </Button>
    </form>
  );
}
