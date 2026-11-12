export type PriceValue = number | string | { toString(): string };

const euroFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Formats a number, numeric string or Prisma Decimal as a euro price.
 */
export function formatPrice(value: PriceValue): string {
  const amount = typeof value === 'number' ? value : Number(value.toString());
  return euroFormatter.format(Number.isFinite(amount) ? amount : 0);
}
