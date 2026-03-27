import Button from "./ui/Button";

/**
 * Shared from/to date controls with Apply and Reset.
 * Pass optional `children` for extra controls (e.g. Orders date field + status).
 */
export default function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onReset,
  children,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[var(--sf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-[var(--sf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]/20"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onApply}>
          Apply
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
