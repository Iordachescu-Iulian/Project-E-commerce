export interface SearchBoxProps {
  action?: string;
  defaultValue?: string;
  hidden?: Record<string, string | undefined>;
}

export function SearchBox({
  action = '/catalog',
  defaultValue = '',
  hidden = {},
}: SearchBoxProps) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex w-full items-center gap-2"
    >
      {Object.entries(hidden).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null,
      )}

      <label htmlFor="catalog-search" className="sr-only">
        Search games by name
      </label>
      <input
        id="catalog-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search games by name…"
        className="min-w-0 flex-1 rounded-md border border-white/15 bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-base transition-colors hover:bg-accent/90"
      >
        Search
      </button>
    </form>
  );
}
