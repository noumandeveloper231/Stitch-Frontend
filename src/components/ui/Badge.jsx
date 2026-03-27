import { STATUS_BADGE } from "../../config/constants";

export default function Badge({ status, children }) {
  const cls = status
    ? STATUS_BADGE[status] || STATUS_BADGE.pending
    : "bg-zinc-100 text-zinc-700 ring-zinc-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${cls}`}
    >
      {children}
    </span>
  );
}
