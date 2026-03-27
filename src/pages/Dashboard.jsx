import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { api } from "../api/client";
import Spinner from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import DateRangeFilter from "../components/DateRangeFilter";
import { formatApiError } from "../utils/errors";
import { STATUS_CHART_COLORS } from "../config/constants";

function StatCard({ title, value, hint }) {
  return (
    <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md">
      <p className="text-sm font-medium text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data: res } = await api.get("/analytics/dashboard", { params });
      setData(res.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, []);

  const handleReset = async () => {
    setFrom("");
    setTo("");
    setLoading(true);
    try {
      const { data: res } = await api.get("/analytics/dashboard");
      setData(res.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  const pieData = Object.entries(data?.ordersByStatus || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const maxDay = Math.max(1, ...(data?.ordersPerDay?.map((d) => d.count) || [1]));

  return (
    <div className="space-y-8">
      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => load()}
        onReset={handleReset}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Customers (all time)"
          value={data?.totals?.customers ?? "—"}
        />
        <StatCard
          title="Orders in range"
          value={data?.totals?.ordersInRange ?? "—"}
          hint={
            data?.range
              ? `${data.range.from.slice(0, 10)} → ${data.range.to.slice(0, 10)}`
              : null
          }
        />
        <StatCard
          title="Revenue in range"
          value={`Rs ${(data?.totals?.revenueInRange ?? 0).toLocaleString()}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-zinc-900">Monthly revenue</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Sum of order totals by calendar month</p>
          <div className="mt-4 h-64 w-full min-w-0">
            {(data?.revenueByMonth || []).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#71717a" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#71717a" tickFormatter={(v) => `Rs ${v}`} />
                  <Tooltip
                    formatter={(value) => [`Rs ${Number(value).toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--sf-accent)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--sf-accent)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No revenue data in this range.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-zinc-900">Orders by status</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Within selected date range</p>
          <div className="mt-4 h-64 w-full min-w-0">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_CHART_COLORS[entry.name] || "#a1a1aa"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(value) => <span className="capitalize">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No orders in this range.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <h2 className="text-sm font-semibold text-zinc-900">Orders per day</h2>
        <div className="mt-4 flex h-36 items-end gap-0.5 overflow-x-auto pb-6">
          {(data?.ordersPerDay || []).map((d) => (
            <div key={d.date} className="flex min-w-[20px] flex-1 flex-col items-center gap-1">
              <div
                className="w-full max-w-[24px] rounded-t bg-[var(--sf-accent)]/75 transition-all hover:bg-[var(--sf-accent)]"
                style={{
                  height: `${(d.count / maxDay) * 100}%`,
                  minHeight: d.count ? "4px" : "0",
                }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="text-[10px] text-zinc-400">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
        {!data?.ordersPerDay?.length && (
          <p className="text-sm text-zinc-500">No orders in this range.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">Recent orders</h2>
            <Link
              to="/orders"
              className="text-xs font-medium text-[var(--sf-accent)] hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100">
            {(data?.recentOrders || []).map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div>
                  <p className="font-medium text-zinc-900">{o.customerId?.name || "—"}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(o.createdAt).toLocaleString()} · Rs{" "}
                    {(o.totalAmount ?? 0).toLocaleString()}
                  </p>
                </div>
                <Badge status={o.status}>{o.status}</Badge>
              </li>
            ))}
          </ul>
          {!data?.recentOrders?.length && (
            <p className="text-sm text-zinc-500">No recent orders.</p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">Top customers</h2>
            <span className="text-xs text-zinc-500">By spend in range</span>
          </div>
          <ul className="divide-y divide-zinc-100">
            {(data?.topCustomers || []).map((c, i) => (
              <li
                key={String(c.customerId)}
                className="flex items-center justify-between gap-2 py-3 first:pt-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900">{c.name}</p>
                    <p className="text-xs text-zinc-500">
                      {c.orderCount} orders
                      {c.phone ? ` · ${c.phone}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-900">
                  Rs {(c.totalSpent ?? 0).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          {!data?.topCustomers?.length && (
            <p className="text-sm text-zinc-500">No customer spend in this range.</p>
          )}
        </div>
      </div>

    </div>
  );
}
