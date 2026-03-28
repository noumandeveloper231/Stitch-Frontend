import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { formatApiError } from "../utils/errors";
import { DeleteModel } from "@/components/DeleteModel";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import DateRangeFilter from "@/components/DateRangeFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Field } from "@/components/ui/field";

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

function valuesToForm(values) {
  const v = values || {};
  return Object.fromEntries(measurementValueKeys.map((k) => [k, v[k] ?? ""]));
}

export default function Measurements() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState(null);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      const { data } = await api.get("/customers", { params: { limit: 100 } });
      setCustomers(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const fetchPage = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (debouncedQ) params.q = debouncedQ;
        if (filterCustomer) params.customerId = filterCustomer;
        if (createdFrom) params.from = createdFrom;
        if (createdTo) params.to = createdTo;
        const { data } = await api.get("/measurements", { params });
        setRows(data.data);
        setMeta(data.meta);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, filterCustomer, createdFrom, createdTo],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);


  const openEdit = (row) => {
    setEditing(row);
    setForm({
      customerId: row.customerId?._id || row.customerId || "",
      label: row.label || "",
      ...valuesToForm(row.values),
    });
    setStep(1);
  };

  const saveEdit = async () => {
    if (!editing?._id) return;
    const values = formToValues(form);
    setSaving(true);
    try {
      await api.put(`/measurements/${editing._id}`, {
        label: form.label.trim(),
        values,
      });
      toast.success("Measurement updated");
      setEditing(null);
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!measurementToDelete?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/measurements/${measurementToDelete._id}`);
      toast.success("Deleted");
      setDeleteModalOpen(false);
      setMeasurementToDelete(null);
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "customer",
      header: "Customer",
      cell: ({ row }) => row.original.customerId?.name || "—",
    },
    { key: "label", header: "Label" },
    {
      key: "values",
      header: "Summary",
      cell: ({ row }) => {
        const m = row.original;
        const v = m.values || {};
        const parts = ["chest", "kameezLength", "shoulder"]
          .map((k) => (v[k] ? `${k}: ${v[k]}` : null))
          .filter(Boolean);
        return parts.length ? parts.join(" · ") : "—";
      },
    },
    {
      key: "created",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      width: "160px",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
            Edit
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => remove(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

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
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-normal transition ${selected
                ? "border-[var(--sf-accent)] bg-[var(--sf-accent)]/10 text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
            >
              <span>{option}</span>
              <span
                className={`h-5 w-5 rounded-full border ${selected
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
        title="Measurements"
        buttons={
          <Link to="/measurements/new">
            <Button>
              <PlusIcon />
              Add measurement
            </Button>
          </Link>
        }
        description="Capture and manage customer measurements with multi-step forms."
      />
      <div className="rounded-lg border border-zinc-200/80 bg-white p-4 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-3">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</Label>
            <InputGroup>
              <InputGroupInput
                placeholder="Search customer or measurement..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <Field className="flex-1">
            <DateRangeFilter
              from={createdFrom}
              to={createdTo}
              onFromChange={setCreatedFrom}
              onToChange={setCreatedTo}
              onApply={() => fetchPage(1)}
              onReset={() => {
                setCreatedFrom("");
                setCreatedTo("");
              }}
              dateRangeLabel="Created"
            />
          </Field>
          <div className="flex-1">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Customer</Label>
            <Select value={filterCustomer || "__all"} onValueChange={(v) => setFilterCustomer(v === "__all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          isLoading={loading}
          emptyMessage="No measurements"
          fixedHeight={false}
        />
      </div>


      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit measurement"
        footer={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${step >= n
                      ? "bg-[var(--sf-accent)] text-white"
                      : "bg-zinc-100 text-zinc-500"
                      }`}
                  >
                    {n}
                  </div>
                  {n < 3 && (
                    <div
                      className={`h-1 w-12 rounded-full ${step > n ? "bg-[var(--sf-accent)]" : "bg-zinc-200"
                        }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              {step > 1 ? (
                <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Label (optional)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
          {step === 1 && (
            <div className="max-h-[50vh] space-y-3 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-3">
                {STEP_1_FIELDS.map((field) => (
                  <Input
                    type="number"
                    key={field.key}
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
              <Button type="button" variant="secondary" onClick={() => setForm((f) => ({ ...f, notes: "" }))}>
                Clear
              </Button>
            </div>
          )}
          {step === 2 && (
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {STEP_2_GROUPS.map(renderOptionGroup)}
            </div>
          )}
          {step === 3 && (
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {STEP_3_GROUPS.map(renderOptionGroup)}
            </div>
          )}
        </div>
      </Modal>

      <DeleteModel
        title="Delete measurement"
        description="This action cannot be undone. Do you want to permanently delete this measurement?"
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open && !deleting) setMeasurementToDelete(null);
        }}
        onDelete={remove}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
