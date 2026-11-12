export type PriceValue = number | string | { toString(): string };

const euroFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

const INVALID_PRICE = '—';

function toFiniteNumber(value: PriceValue): number | null {
  try {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    const raw = value.toString().trim();

    if (raw === '') {
      return null;
    }

    const amount = Number(raw);
    return Number.isFinite(amount) ? amount : null;
  } catch {
    return null;
  }
}

/**
 * Formats a number, numeric string or Prisma Decimal as a euro price.
 * Returns an em dash for non-finite or malformed values instead of silently
 * displaying zero.
 */
export function formatPrice(value: PriceValue): string {
  const amount = toFiniteNumber(value);
  return amount === null ? INVALID_PRICE : euroFormatter.format(amount);
}
