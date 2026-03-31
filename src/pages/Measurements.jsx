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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, SearchIcon, Ruler, Settings, FileText } from "lucide-react";
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
        title="Edit Measurement"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving} loading={saving}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Input
            label="Measurement Label"
            placeholder="e.g., Summer Suit, Winter Collection"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />

          <Tabs defaultValue="dimensions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="dimensions" className="flex items-center gap-2">
                <Ruler className="h-4 w-4" /> Dimensions
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Style
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Additional
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dimensions">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-1">
                {STEP_1_FIELDS.map((f) => (
                  <Input
                    key={f.key}
                    label={f.label}
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="style">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-1">
                {STEP_2_GROUPS.map((g) => (
                  <div key={g.key} className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {g.title}
                    </Label>
                    <Select
                      value={form[g.key] || "__none"}
                      onValueChange={(v) => setForm((prev) => ({ ...prev, [g.key]: v === "__none" ? "" : v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${g.title}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {g.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="additional">
              <div className="space-y-6 p-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {STEP_3_GROUPS.map((g) => (
                    <div key={g.key} className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {g.title}
                      </Label>
                      <Select
                        value={form[g.key] || "__none"}
                        onValueChange={(v) => setForm((prev) => ({ ...prev, [g.key]: v === "__none" ? "" : v }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`Select ${g.title}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">None</SelectItem>
                          {g.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Additional Notes
                  </Label>
                  <Textarea
                    placeholder="Enter any special instructions..."
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
