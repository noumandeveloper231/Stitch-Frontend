import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../api/client";
import { formatApiError } from "../utils/errors";

const POLL_MS = 5 * 60 * 1000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setAlerts(data.data || []);
    } catch (e) {
      console.warn(formatApiError(e));
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const count = alerts.length;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchAlerts();
        }}
        className="relative rounded-xl p-2.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--sf-accent)] px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-200 bg-white py-2 shadow-xl">
          <div className="border-b border-zinc-100 px-3 pb-2">
            <p className="text-sm font-semibold text-zinc-900">Alerts</p>
            <p className="text-xs text-zinc-500">Delivery & pending orders</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading && !alerts.length && (
              <p className="px-3 py-4 text-xs text-zinc-500">Loading…</p>
            )}
            {!loading && !alerts.length && (
              <p className="px-3 py-4 text-xs text-zinc-500">You&apos;re all caught up.</p>
            )}
            {alerts.map((a, i) => (
              <button
                key={`${a.orderId}-${i}`}
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate(`/orders?orderId=${a.orderId}`);
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-zinc-50 px-3 py-2.5 text-left last:border-0 hover:bg-zinc-50"
              >
                <span className="text-xs font-semibold text-zinc-900">{a.title}</span>
                <span className="text-xs text-zinc-600">{a.message}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
