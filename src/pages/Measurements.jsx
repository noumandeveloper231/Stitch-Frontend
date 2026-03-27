import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import DataTable from "../components/ui/DataTable";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
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

function valuesToForm(values) {
  const v = values || {};
  return Object.fromEntries(measurementValueKeys.map((k) => [k, v[k] ?? ""]));
}

export default function Measurements() {
  const [customers, setCustomers] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

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

  const fetchPage = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (filterCustomer) params.customerId = filterCustomer;
        const { data } = await api.get("/measurements", { params });
        setRows(data.data);
        setMeta(data.meta);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    },
    [filterCustomer],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, customerId: filterCustomer || "" });
    setStep(1);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      customerId: row.customerId?._id || row.customerId || "",
      label: row.label || "",
      ...valuesToForm(row.values),
    });
    setStep(1);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.customerId) {
      toast.error("Select a customer");
      return;
    }
    const values = formToValues(form);
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/measurements/${editing._id}`, {
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
      setModalOpen(false);
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this measurement?")) return;
    try {
      await api.delete(`/measurements/${row._id}`);
      toast.success("Deleted");
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (m) => m.customerId?.name || "—",
    },
    { key: "label", header: "Label" },
    {
      key: "values",
      header: "Summary",
      render: (m) => {
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
      render: (m) => new Date(m.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      width: "160px",
      render: (m) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-sm font-medium text-[var(--sf-accent)] hover:underline"
            onClick={() => openEdit(m)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-sm font-medium text-red-600 hover:underline"
            onClick={() => remove(m)}
          >
            Delete
          </button>
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
            <button
              key={option}
              type="button"
              onClick={() => setForm((f) => ({ ...f, [group.key]: option }))}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
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
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Select
          label="Filter by customer"
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          className="max-w-md"
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Button onClick={openCreate}>Add measurement</Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={loading}
        emptyMessage="No measurements"
      />

      {meta.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            disabled={meta.page <= 1}
            onClick={() => fetchPage(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-2 text-sm text-zinc-600">
            Page {meta.page} of {meta.pages}
          </span>
          <Button
            variant="secondary"
            disabled={meta.page >= meta.pages}
            onClick={() => fetchPage(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit measurement" : "New measurement"}
        footer={
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                      step >= n
                        ? "bg-[var(--sf-accent)] text-white"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {n}
                  </div>
                  {n < 3 && (
                    <div
                      className={`h-1 w-12 rounded-full ${
                        step > n ? "bg-[var(--sf-accent)]" : "bg-zinc-200"
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
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="button" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <Select
              label="Customer"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
            >
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
          <Input
            label="Label (optional)"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
          {step === 1 && (
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                {STEP_1_FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={form[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                ))}
              </div>
              <Input
                label="Extra notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
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
    </div>
  );
}
