export default function PageHeader({ title, buttons = null, description, actions = null }) {
  return (
    <div className="flex flex-col gap-3 border-zinc-200/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {buttons ? <div className="flex shrink-0 items-center gap-2">{buttons}</div> : null}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
