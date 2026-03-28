import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { ORDER_STATUSES } from "../config/constants";
import { formatApiError } from "../utils/errors";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MEASUREMENT_LABELS = {
  kameezLength: "Kameez Length",
  shoulder: "Shoulder",
  chest: "Chest",
  loosing: "Loosing",
  neck: "Neck",
  armhole: "Armhole",
  sleeve: "Sleeve",
  cuffLength: "Cuff Length",
  cuffWidth: "Cuff Width",
  sleeveOpening: "Sleeve Opening",
  hem: "Hem",
  patiWidth: "Pati Width",
  patiLength: "Pati Length",
  shalwarWaist: "Shalwar Waist",
  shalwarWidth: "Shalwar Width",
  shalwarLength: "Shalwar Length",
  legOpening: "Leg Opening",
  daman: "Daman",
  cuffStyle: "Cuff Style",
  silkThread: "Silk Thread",
  stitching: "Stitching",
  buttons: "Buttons",
  buttonhole: "Buttonhole",
  designerSuit: "Designer Suit",
  collar: "Collar",
  frontPocket: "Front Pocket",
  sidePocket: "Side Pocket",
  sleevePleat: "Sleeve Pleat",
  hiddenPlacket: "Hidden Placket",
  shalwarType: "Shalwar Type",
  nettedLegOpening: "Netted Leg Opening",
  notes: "Notes",
};

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [latest, setLatest] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const lastDatePickerInteractionRef = useRef(0);
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
    const justInteractedWithDatePicker =
      Date.now() - lastDatePickerInteractionRef.current < 300;
    if (justInteractedWithDatePicker) return;
    if (!customerId) {
      toast.error("Select a customer");
      return;
    }
    const totalAmount = parseFloat(form.totalAmount) || 0;
    const advance = parseFloat(form.advance) || 0;
    if (advance > totalAmount) {
      toast.error("Advance cannot be greater than Total.");
      return;
    }
    const remaining = Math.max(0, totalAmount - advance);

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

  const latestEntries = Object.entries(latest?.values || {}).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  });

  return (
    <div className="mx-auto space-y-6">
      <PageHeader
        title="Create Order"
        description="Create a new order from a customer and measurement snapshot."
      />
      <form
        onSubmit={submit}
        className="relative space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700">Customer</Label>
          <Select
            value={customerId || "__none"}
            onValueChange={(value) => setCustomerId(value === "__none" ? "" : value)}
            disabled={loadingCustomers}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Select customer...</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                  {c.phone ? ` · ${c.phone}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {customerId && (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
            <p className="font-medium text-zinc-800">Latest measurement</p>
            {latest ? (
              <div className="mt-2 text-zinc-600">
                {latest.label && <p className="text-xs text-zinc-500">Label: {latest.label}</p>}
                {latestEntries.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {latestEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 ring-1 ring-zinc-100"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                          {MEASUREMENT_LABELS[key] || key}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-800">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-zinc-500">No measurement values in this snapshot.</p>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  This snapshot will be attached automatically when you create the order.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-zinc-500">No measurements on file for this customer.</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700">Initial status</Label>
          <Select
            value={form.status}
            onValueChange={(value) => setForm((f) => ({ ...f, status: value }))}
          >
            <SelectTrigger className="capitalize">
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem className="capitalize" key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            readOnly
            disabled
          />
        </div>
        {parseFloat(form.advance || "0") > parseFloat(form.totalAmount || "0") && (
          <p className="text-sm text-red-600">Advance cannot be greater than Total.</p>
        )}

        <Input
          label="Delivery date"
          type="date"
          value={form.deliveryDate}
          onDatePickerInteraction={() => {
            lastDatePickerInteractionRef.current = Date.now();
          }}
          onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
        />

        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />

        <div className="sticky bottom-0 left-0 right-0 flex gap-3 border-t border-zinc-200 bg-white p-4 rounded-b-2xl">
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
