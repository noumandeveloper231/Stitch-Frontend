import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import { formatApiError } from "../utils/errors";

const STEP_1_FIELDS = [
  { key: "kameezLength", label: "Kameez Length" },
  { key: "shoulder", label: "Shoulder" },
  { key: "chest", label: "Chest" },
  { key: "loosing", label: "Loosing" },
  { key: "neck", label: "Neck" },
  { key: "armhole", label: "Armhole" },
  { key: "sleeve", label: "Sleeve" },
  { key: "cuffLength", label: "Cuff Length" },
  { key: "cuffWidth", label: "Cuff Width" },
  { key: "sleeveOpening", label: "Sleeve Opening" },
  { key: "hem", label: "Hem" },
  { key: "patiWidth", label: "Pati Width" },
  { key: "patiLength", label: "Pati Length" },
  { key: "shalwarWaist", label: "Shalwar Waist" },
  { key: "shalwarWidth", label: "Shalwar Width" },
  { key: "shalwarLength", label: "Shalwar Length" },
  { key: "legOpening", label: "Leg Opening" },
];

const STEP_2_GROUPS = [
  { key: "daman", title: "Daman", options: ["Round Daman", "Square Daman"] },
  {
    key: "cuffStyle",
    title: "Cuff",
    options: ["Simple Cuff", "Simple Round Cuff", "Simple Sleeve"],
  },
  { key: "silkThread", title: "Silk Thread", options: ["Silk Thread"] },
  {
    key: "stitching",
    title: "Stitching",
    options: ["Single Stitching", "Double Stitching", "Triple Stitching"],
  },
  {
    key: "buttons",
    title: "Buttons",
    options: ["Normal Button", "Fancy Button", "Tich Button"],
  },
  {
    key: "buttonhole",
    title: "Buttonhole",
    options: ["Normal Buttonhole", "Threaded Buttonhole"],
  },
];

const STEP_3_GROUPS = [
  { key: "designerSuit", title: "Designer Suit", options: ["Designer Suit"] },
  { key: "collar", title: "Collar", options: ["Ben", "Half Ben", "Collar", "French Collar"] },
  { key: "frontPocket", title: "Front Pocket", options: ["Front Pocket"] },
  { key: "sidePocket", title: "Side Pockets", options: ["Single Side Pocket", "Double Side Pocket"] },
  { key: "sleevePleat", title: "Sleeve Pleat", options: ["Sleeve Pleat", "No Pleat"] },
  { key: "hiddenPlacket", title: "Hidden Placket", options: ["Hidden Placket"] },
  {
    key: "shalwarType",
    title: "Shalwar Type",
    options: ["Normal Shalwar", "Trouser Shalwar", "Balochi Shalwar"],
  },
  { key: "nettedLegOpening", title: "Netted Leg Opening", options: ["Netted Leg Opening"] },
];

const measurementValueKeys = [
  ...STEP_1_FIELDS.map((f) => f.key),
  ...STEP_2_GROUPS.map((g) => g.key),
  ...STEP_3_GROUPS.map((g) => g.key),
  "notes",
];

const emptyForm = {
  customerId: "",
  label: "",
  ...Object.fromEntries(measurementValueKeys.map((k) => [k, ""])),
};

function formToValues(f) {
  const values = {};
  for (const key of measurementValueKeys) {
    const value = typeof f[key] === "string" ? f[key].trim() : f[key];
    if (value) values[key] = value;
  }
  return values;
}

export default function CreateMeasurement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingMeasurement, setLoadingMeasurement] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await api.get("/customers", { params: { limit: 100 } });
      setCustomers(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const customerIdParam = useMemo(
    () =>
      searchParams.get("customerId") ||
      searchParams.get("customerid") ||
      searchParams.get("customerID") ||
      searchParams.get("customerd"),
    [searchParams],
  );

  useEffect(() => {
    const presetCustomerId = customerIdParam;
    if (!presetCustomerId) return;
    const exists = customers.some((c) => String(c._id) === String(presetCustomerId));
    if (!exists) return;
    setForm((prev) => ({ ...prev, customerId: String(presetCustomerId) }));
  }, [customerIdParam, customers]);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    let cancelled = false;
    (async () => {
      setLoadingMeasurement(true);
      try {
        const { data } = await api.get(`/measurements/${editId}`);
        if (cancelled) return;
        const m = data?.data;
        setForm({
          customerId: m?.customerId?._id || m?.customerId || "",
          label: m?.label || "",
          ...Object.fromEntries(measurementValueKeys.map((k) => [k, m?.values?.[k] ?? ""])),
        });
      } catch (e) {
        toast.error(formatApiError(e));
        navigate("/measurements");
      } finally {
        if (!cancelled) setLoadingMeasurement(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, isEditMode, navigate]);

  const save = async () => {
    if (!form.customerId) {
      toast.error("Select a customer");
      return;
    }
    const values = formToValues(form);
    setSaving(true);
    try {
      if (isEditMode && editId) {
        await api.put(`/measurements/${editId}`, {
          label: form.label.trim(),
          values,
        });
        toast.success("Measurement updated");
      } else {
        await api.post("/measurements", {
          customerId: form.customerId,
          label: form.label.trim(),
          values,
        });
        toast.success("Measurement saved");
      }
      navigate("/measurements");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const renderOptionGroup = (group) => (
    <div key={group.key} className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-base font-semibold text-zinc-900">{group.title}</p>
      <div className="space-y-2">
        {group.options.map((option) => {
          const selected = form[group.key] === option;
          return (
            <Button
              key={option}
              type="button"
              variant="outline"
              onClick={() => setForm((f) => ({ ...f, [group.key]: option }))}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-normal transition ${
                selected
                  ? "border-[var(--sf-accent)] bg-[var(--sf-accent)]/10 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span>{option}</span>
              <span
                className={`h-5 w-5 rounded-full border ${
                  selected
                    ? "border-[var(--sf-accent)] bg-[var(--sf-accent)]"
                    : "border-zinc-400 bg-transparent"
                }`}
              />
            </Button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditMode ? "Edit Measurement" : "Add Measurement"}
        description={isEditMode ? "Update measurement values in a step-by-step flow." : "Capture measurement values in a step-by-step flow."}
      />

      <div className="relative space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-zinc-700">Customer</Label>
          <Select
            value={form.customerId || "__none"}
            onValueChange={(value) =>
              setForm((f) => ({ ...f, customerId: value === "__none" ? "" : value }))
            }
            disabled={loadingCustomers || isEditMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">Select customer</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Label (optional)"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        />

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  step >= n ? "bg-[var(--sf-accent)] text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {n}
              </div>
              {n < 3 && (
                <div className={`h-1 w-12 rounded-full ${step > n ? "bg-[var(--sf-accent)]" : "bg-zinc-200"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-3">
              {STEP_1_FIELDS.map((field) => (
                <Input
                  key={field.key}
                  type="number"
                  label={field.label}
                  value={form[field.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                />
              ))}
            </div>
            <Textarea
              placeholder="Extra notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
        )}

        {step === 2 && (
          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-2">
            {STEP_2_GROUPS.map(renderOptionGroup)}
          </div>
        )}

        {step === 3 && (
          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-2">
            {STEP_3_GROUPS.map(renderOptionGroup)}
          </div>
        )}

        <div className="sticky bottom-0 left-0 right-0 flex justify-end gap-2 border-t border-zinc-200 bg-white p-4 rounded-b-2xl">
          {step > 1 ? (
            <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => navigate("/measurements")}>
              Cancel
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={save} disabled={saving || loadingMeasurement}>
              {saving ? "Saving..." : isEditMode ? "Save Changes" : "Save"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
