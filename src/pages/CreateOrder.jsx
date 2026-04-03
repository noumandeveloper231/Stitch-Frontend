import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { ORDER_STATUSES, STITCHING_STYLES } from "../config/constants";
import { formatApiError } from "../utils/errors";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { formatPhoneNumber } from "@/lib/utils";
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
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [latest, setLatest] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stitchingTypes, setStitchingTypes] = useState([]);
  const [loadingStitchingTypes, setLoadingStitchingTypes] = useState(true);
  const [stitchingTypeId, setStitchingTypeId] = useState("");
  const [stitchingStyle, setStitchingStyle] = useState(STITCHING_STYLES[0]);
  const lastDatePickerInteractionRef = useRef(0);
  const [form, setForm] = useState({
    status: "pending",
    items: [
      { name: "Cutting", cost: "" },
      { name: "Button", cost: "" },
      { name: "Collar", cost: "" },
      { name: "Nulki", cost: "" },
      { name: "Kameez", cost: "" },
      { name: "Shalwar", cost: "" },
    ],
    price: "",
    advance: "",
    deliveryDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    })(),
    notes: "",
  });

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await api.get("/customers", { params: { limit: 1000 } });
      setCustomers(data.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadStitchingTypes = useCallback(async () => {
    setLoadingStitchingTypes(true);
    try {
      const { data } = await api.get("/stitching-types", {
        params: { limit: 200, isActive: true },
      });
      setStitchingTypes(data.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoadingStitchingTypes(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    loadStitchingTypes();
  }, [loadStitchingTypes]);

  useEffect(() => {
    const presetCustomerId =
      searchParams.get("customerId") ||
      searchParams.get("customerid") ||
      searchParams.get("customerID") ||
      searchParams.get("customerd");
    if (!presetCustomerId) return;
    const exists = customers.some((c) => String(c._id) === String(presetCustomerId));
    if (exists) setCustomerId(String(presetCustomerId));
  }, [customers, searchParams]);

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

  const selectedStitchingType = useMemo(
    () => stitchingTypes.find((t) => String(t._id) === String(stitchingTypeId)),
    [stitchingTypeId, stitchingTypes],
  );

  const computedStylePrice = selectedStitchingType
    ? stitchingStyle === "double"
      ? Number(selectedStitchingType.doublePrice || 0)
      : Number(selectedStitchingType.singlePrice || 0)
    : null;

  const displayedRate = computedStylePrice ?? (form.price ? Number(form.price) : 0);
  const styleLabel = stitchingStyle === "double" ? "Double stitch" : "Single stitch";
  useEffect(() => {
    if (!selectedStitchingType) return;
    if (computedStylePrice === null || computedStylePrice === undefined) return;
    setForm((f) => ({ ...f, price: String(computedStylePrice) }));
  }, [computedStylePrice, selectedStitchingType]);


  const calculateTotalCost = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  };

  const setDeliveryDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setForm({ ...form, deliveryDate: d.toISOString().slice(0, 10) });
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
    const price = parseFloat(form.price) || 0;
    const advance = parseFloat(form.advance) || 0;
    if (advance > price) {
      toast.error("Advance cannot be greater than Price.");
      return;
    }

    const filteredItems = form.items
      .filter((it) => it.name.trim() !== "")
      .map((it) => ({ name: it.name.trim(), cost: parseFloat(it.cost) || 0 }));

    setSubmitting(true);
    try {
      await api.post("/orders", {
        customerId,
        status: form.status,
        items: filteredItems,
        price,
      advance,
      deliveryDate: form.deliveryDate || null,
      notes: form.notes.trim(),
      stitchingTypeId: stitchingTypeId || undefined,
      stitchingStyle: stitchingTypeId ? stitchingStyle : undefined,
    });
      toast.success("Order created");
      navigate("/orders");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { name: "", cost: "" }],
    }));
  };

  const removeItem = (index) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((f) => {
      const next = [...f.items];
      next[index] = { ...next[index], [field]: value };
      return { ...f, items: next };
    });
  };

  const totalCost = calculateTotalCost(form.items);
  const priceVal = parseFloat(form.price) || 0;
  const advanceVal = parseFloat(form.advance) || 0;
  const remainingVal = Math.max(0, priceVal - advanceVal);
  const profitVal = priceVal - totalCost;

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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
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
                      {c.name} - {formatPhoneNumber(c.phone)}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-zinc-700">Stitching setup</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  value={stitchingTypeId || "__none"}
                  onValueChange={(value) => setStitchingTypeId(value === "__none" ? "" : value)}
                  disabled={loadingStitchingTypes}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingStitchingTypes
                          ? "Loading garments…"
                          : "Choose garment type..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select garment type…</SelectItem>
                    {stitchingTypes.map((type) => (
                      <SelectItem key={type._id} value={type._id}>
                        <div className="space-y-0.5 text-left">
                          <span className="font-medium text-zinc-900">{type.name}</span>
                          <span className="text-[11px] text-zinc-500">
                            Single Rs {Number(type.singlePrice || 0).toLocaleString()} · Double Rs{" "}
                            {Number(type.doublePrice || 0).toLocaleString()}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stitchingStyle} onValueChange={setStitchingStyle}>
                  <SelectTrigger className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STITCHING_STYLES.map((style) => (
                      <SelectItem key={style} value={style} className="capitalize">
                        {style === "double" ? "Double stitch" : "Single stitch"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-zinc-500">
                {selectedStitchingType
                  ? `Selected rate: Rs ${displayedRate.toLocaleString()} (${selectedStitchingType.name} · ${styleLabel})`
                  : "Choose a garment to auto-apply the defined Single/Double stitch rate."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-zinc-700">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Customer Price (Rs)"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
              <Input
                label="Advance Payment (Rs)"
                type="number"
                min="0"
                step="0.01"
                value={form.advance}
                onChange={(e) => setForm((f) => ({ ...f, advance: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Remaining Balance</p>
                <p className={`text-lg font-bold ${remainingVal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs {remainingVal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Projected Profit</p>
                <p className={`text-lg font-bold ${profitVal >= 0 ? 'text-zinc-900' : 'text-red-600'}`}>
                  Rs {profitVal.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-zinc-700">Delivery Date</Label>
                <div className="flex gap-1">
                  {[3, 7, 30].map((days) => {
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    const dateStr = d.toISOString().slice(0, 10);
                    const isActive = form.deliveryDate === dateStr;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setDeliveryDays(days)}
                        className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                          isActive
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        +{days}d
                      </button>
                    );
                  })}
                </div>
              </div>
              <Input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                onFocus={() => {
                  lastDatePickerInteractionRef.current = Date.now();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-700">Notes</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional instructions..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-zinc-700">Cost Breakdown</Label>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                Add Item
              </Button>
            </div>
            <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-1">
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                      type="number"
                      placeholder="Cost"
                      value={item.cost}
                      onChange={(e) => updateItem(idx, "cost", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                <span className="text-sm font-medium text-zinc-600">Total Cost:</span>
                <span className="text-lg font-bold text-zinc-900">Rs {totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate("/orders")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
