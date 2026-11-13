export type StockState = 'in-stock' | 'low-stock' | 'out-of-stock';

export const LOW_STOCK_THRESHOLD = 10;

/**
 * Maps a stock count to a display state. Missing, negative and non-finite
 * values are treated as sold out rather than as "in stock".
 */
export function getStockState(stock: number): StockState {
  if (!Number.isFinite(stock) || stock <= 0) {
    return 'out-of-stock';
  }

  return stock <= LOW_STOCK_THRESHOLD ? 'low-stock' : 'in-stock';
}

export function getStockLabel(stock: number): string {
  const state = getStockState(stock);

  if (state === 'out-of-stock') {
    return 'Sold out';
  }

  if (state === 'low-stock') {
    return `Only ${Math.floor(stock)} left`;
  }

  return 'In stock';
}

const stateClasses: Record<StockState, string> = {
  'in-stock': 'border-accent/30 bg-accent/10 text-accent',
  'low-stock': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'out-of-stock': 'border-rose-400/30 bg-rose-400/10 text-rose-300',
};

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export function StockBadge({ stock, className = '' }: StockBadgeProps) {
  const state = getStockState(stock);

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${stateClasses[state]} ${className}`}
    >
      {getStockLabel(stock)}
    </span>
  );
}
