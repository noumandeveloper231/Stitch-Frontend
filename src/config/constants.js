export const ORDER_STATUSES = [
  "pending",
  "cutting",
  "stitching",
  "ready",
  "delivered",
];

export const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-900 ring-amber-200",
  cutting: "bg-sky-100 text-sky-900 ring-sky-200",
  stitching: "bg-violet-100 text-violet-900 ring-violet-200",
  ready: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  delivered: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

/** Hex colors for Recharts (pie / legend) */
export const STATUS_CHART_COLORS = {
  pending: "#f59e0b",
  cutting: "#0ea5e9",
  stitching: "#8b5cf6",
  ready: "#10b981",
  delivered: "#71717a",
};
