import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { ORDER_STATUSES } from "../config/constants";
import { formatApiError } from "../utils/errors";

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [latest, setLatest] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    status: "pending",
    totalAmount: "",
    advance: "",
    remaining: "",
    deliveryDate: "",
    notes: "",
  });

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await api.get("/customers", { params: { limit: 100 } });
      setCustomers(data.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!customerId) {
      setLatest(null);
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/measurements/latest/${customerId}`);
        setLatest(data.data);
      } catch {
        setLatest(null);
      }
    })();
  }, [customerId]);

  const syncRemaining = (total, adv) => {
    const t = parseFloat(total) || 0;
    const a = parseFloat(adv) || 0;
    return String(Math.max(0, t - a));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    const totalAmount = parseFloat(form.totalAmount) || 0;
    const advance = parseFloat(form.advance) || 0;
    const remaining =
      form.remaining === ""
        ? Math.max(0, totalAmount - advance)
        : parseFloat(form.remaining) || 0;

    setSubmitting(true);
    try {
      await api.post("/orders", {
        customerId,
        status: form.status,
        totalAmount,
        advance,
        remaining,
        deliveryDate: form.deliveryDate || null,
        notes: form.notes.trim(),
      });
      toast.success("Order created");
      navigate("/orders");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <Select
          label="Customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          disabled={loadingCustomers}
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {c.phone ? ` · ${c.phone}` : ""}
            </option>
          ))}
        </Select>

        {customerId && (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-800">Latest measurement</p>
            {latest ? (
              <div className="mt-2 text-zinc-600">
                {latest.label && <p className="text-xs text-zinc-500">Label: {latest.label}</p>}
                <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-xs ring-1 ring-zinc-200">
                  {JSON.stringify(latest.values || {}, null, 2)}
                </pre>
                <p className="mt-2 text-xs text-zinc-500">
                  This snapshot will be attached automatically when you create the order.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-zinc-500">No measurements on file for this customer.</p>
            )}
          </div>
        )}

        <Select
          label="Initial status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Total (Rs)"
            type="number"
            min="0"
            step="0.01"
            value={form.totalAmount}
            onChange={(e) => {
              const totalAmount = e.target.value;
              setForm((f) => ({
                ...f,
                totalAmount,
                remaining: syncRemaining(totalAmount, f.advance),
              }));
            }}
          />
          <Input
            label="Advance (Rs)"
            type="number"
            min="0"
            step="0.01"
            value={form.advance}
            onChange={(e) => {
              const advance = e.target.value;
              setForm((f) => ({
                ...f,
                advance,
                remaining: syncRemaining(f.totalAmount, advance),
              }));
            }}
          />
          <Input
            label="Remaining (Rs)"
            type="number"
            min="0"
            step="0.01"
            value={form.remaining}
            onChange={(e) => setForm((f) => ({ ...f, remaining: e.target.value }))}
          />
        </div>

        <Input
          label="Delivery date"
          type="date"
          value={form.deliveryDate}
          onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
        />

        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create order"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/orders")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
