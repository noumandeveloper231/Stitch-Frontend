import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
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
import { PlusIcon, SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Field } from "@/components/ui/field";

export default function Measurements() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
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

  const openDelete = (measurement) => {
    setMeasurementToDelete(measurement);
    setDeleteModalOpen(true);
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/measurements/editor?edit=${row.original._id}`)}
          >
            Edit
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => openDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Measurements"
        buttons={
          <Link to="/measurements/editor">
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
