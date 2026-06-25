import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

function TrendBadge({ direction, value }) {
  const Icon = direction === "up" ? TrendingUp
    : direction === "down" ? TrendingDown
    : Minus;

  const color = direction === "up" ? "text-emerald-600 bg-emerald-50"
    : direction === "down" ? "text-red-600 bg-red-50"
    : "text-zinc-500 bg-zinc-50";

  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium", color)}>
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

function Sparkline({ data, color = "#0ea5e9" }) {
  if (!data || data.length < 2) return null;
  return (
    <div className="mt-2 h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${color.replace("#", "")})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg,
  borderColor = "border-l-blue-500",
  trend,
  trendValue,
  chart,
  chartColor,
  className,
}) {
  const bg = iconBg || iconColor.replace("text-", "bg-").replace(/(\d)00$/, "100");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md border-l-4",
        borderColor,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", bg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
        {trend && trendValue && (
          <TrendBadge direction={trend} value={trendValue} />
        )}
      </div>

      <p className="mt-3 text-xs font-medium text-zinc-500">{title}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>

      {subtitle && (
        <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
      )}

      {chart && <Sparkline data={chart} color={chartColor} />}
    </div>
  );
}

const columnClasses = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

export default function KPICards({ items = [], columns = 4, className }) {
  if (!items.length) return null;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", columnClasses[columns] || "lg:grid-cols-4", className)}>
      {items.map((item, i) => (
        <KPICard key={i} {...item} />
      ))}
    </div>
  );
}
