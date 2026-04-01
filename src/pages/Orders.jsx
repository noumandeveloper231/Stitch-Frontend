import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SearchIcon, Eye, Loader2, CheckCircle2, Pencil, Trash2, FileCodeIcon, PlusIcon } from "lucide-react";
import { api, downloadOrderInvoicePdf } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Badge from "@/components/ui/badge";
import Modal, { ModalActions } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES } from "../config/constants";
import { formatApiError } from "../utils/errors";
import { DeleteModel } from "@/components/DeleteModel";
import PageHeader from "@/components/PageHeader";
import DateRangeFilter from "@/components/DateRangeFilter";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Field } from "@/components/ui/field";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Orders() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("orderId") || "";

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [deliveryFrom, setDeliveryFrom] = useState("");
  const [deliveryTo, setDeliveryTo] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({
    status: "pending",
    price: "",
    deliveryDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [statusSuccessId, setStatusUpdatingSuccessId] = useState(null);

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
        if (status) params.status = status;
        if (createdFrom) params.createdFrom = createdFrom;
        if (createdTo) params.createdTo = createdTo;
        if (deliveryFrom) params.deliveryFrom = deliveryFrom;
        if (deliveryTo) params.deliveryTo = deliveryTo;
        const { data } = await api.get("/orders", { params });
        setRows(data.data);
        setMeta(data.meta);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, status, createdFrom, createdTo, deliveryFrom, deliveryTo],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const openEdit = (order) => {
    setEditModal(order);
    setForm({
      status: order.status,
      price: String(order.price ?? ""),
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toISOString().slice(0, 10)
        : "",
      notes: order.notes || "",
    });
  };

  const setDeliveryDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setForm({ ...form, deliveryDate: d.toISOString().slice(0, 10) });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await api.put(`/orders/${editModal._id}`, {
        status: form.status,
        price: parseFloat(form.price) || 0,
        deliveryDate: form.deliveryDate || null,
        notes: form.notes.trim(),
      });
      toast.success("Order updated");
      setEditModal(null);
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const oldStatus = rows.find(r => r._id === orderId)?.status;
    setStatusUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setRows(prev => prev.map(r => r._id === orderId ? { ...r, status: newStatus } : r));
      setStatusUpdatingSuccessId(orderId);
      setTimeout(() => setStatusUpdatingSuccessId(null), 2000);
      toast.success("Status updated");
    } catch (e) {
      toast.error(formatApiError(e));
      // Revert status on failure
      setRows(prev => prev.map(r => r._id === orderId ? { ...r, status: oldStatus } : r));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handlePdf = async (id) => {
    setPdfLoadingId(id);
    try {
      await downloadOrderInvoicePdf(id);
      toast.success("Invoice downloaded");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setPdfLoadingId(null);
    }
  };

  const remove = async () => {
    if (!orderToDelete?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/orders/${orderToDelete._id}`);
      toast.success("Deleted");
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: "orderNumber",
      header: "Order #",
      cell: ({ row }) => <span className="font-mono text-xs text-zinc-500">#{row.original._id.slice(-6).toUpperCase()}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const name = row.original.customerId?.name || "—";
        if (!debouncedQ) return name;
        const escapedQ = escapeRegex(debouncedQ);
        const parts = name.split(new RegExp(`(${escapedQ})`, "gi"));
        return (
          <span>
            {parts.map((part, i) =>
              part.toLowerCase() === debouncedQ.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200 p-0 rounded-sm">{part}</mark>
              ) : (
                part
              )
            )}
          </span>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      cell: ({ row }) => `Rs ${(row.original.price ?? 0).toLocaleString()}`,
    },
    {
      key: "remaining",
      header: "Remaining",
      cell: ({ row }) => (
        <span className={row.original.remaining > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
          Rs {(row.original.remaining ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => {
        const status = row.original.paymentStatus || "unpaid";
        return (
          <Badge className="capitalize text-[10px]" status={status}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original;
        const isUpdating = statusUpdatingId === order._id;
        const isSuccess = statusSuccessId === order._id;

        return (
          <div className="flex items-center gap-2">
            <Select
              value={order.status}
              disabled={isUpdating}
              onValueChange={(value) => handleStatusChange(order._id, value)}
            >
              <SelectTrigger className="h-8 capitalize ">
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
            {isUpdating && <Loader2 size={14} className="animate-spin text-zinc-400" />}
            {isSuccess && <CheckCircle2 size={14} className="text-green-500" />}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <div className="text-xs text-zinc-500">
          <p>{new Date(row.original.createdAt).toLocaleDateString()}</p>
          <p className="text-[10px] opacity-70">
            {new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: "deliveryDate",
      header: "Delivery",
      cell: ({ row }) =>
        row.original.deliveryDate ? new Date(row.original.deliveryDate).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-4">
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-[var(--sf-accent)] hover:underline"
            onClick={() => navigate(`/orders/${row.original._id}?tab=details`)}
            title="View Details"
          >
            <Eye size={16} className="inline-block" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:underline"
            onClick={() => openEdit(row.original)}
            title="Edit"
          >
            <Pencil size={16} className="inline-block" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:underline disabled:opacity-50"
            disabled={pdfLoadingId === row.original._id}
            onClick={() => handlePdf(row.original._id)}
          >
            <FileCodeIcon size={16} className="inline-block" />
          </button>
          {isAdmin && (
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
              onClick={() => {
                setOrderToDelete(row.original);
                setDeleteModalOpen(true);
              }}
              title="Delete"
            >
              <Trash2 size={16} className="inline-block" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        buttons={
          <Link to="/orders/new">
            <Button>
              <PlusIcon />
              Add Order
            </Button>
          </Link>
        }
        description="Track orders, update statuses, and manage deliveries."
      />
      <div className="rounded-lg border border-zinc-200/80 bg-white p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-end gap-4">
            <Field className="w-64">
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
                label="Created"
              />
            </Field>
            <Field className="w-64">
              <DateRangeFilter
                label="Delivery"
                from={deliveryFrom}
                to={deliveryTo}
                onFromChange={setDeliveryFrom}
                onToChange={setDeliveryTo}
                onApply={() => fetchPage(1)}
                onReset={() => {
                  setDeliveryFrom("");
                  setDeliveryTo("");
                }}
              />
            </Field>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-3">
              <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</Label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Search customer or order..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)} />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="flex-1">
              <Label className="text-xs font-medium uppercase text-zinc-500">Status</Label>
              <Select value={status || "__all"} onValueChange={(value) => setStatus(value === "__all" ? "" : value)}>
                <SelectTrigger className="capitalize">
                  <SelectValue placeholder="Choose Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="capitalize" value="__all">All</SelectItem>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem className="capitalize" key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          isLoading={loading}
          emptyMessage="No orders"
          fixedHeight={false}
          getRowProps={(row) => {
            const props = {};

            if (highlightId && String(row.original?._id) === String(highlightId)) {
              props.className = "bg-amber-50/90 ring-1 ring-inset ring-amber-200/60";
            }
            return props;
          }}
        />
      </div>


      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Edit order"
        footer={
          <ModalActions
            onCancel={() => setEditModal(null)}
            onConfirm={saveEdit}
            loading={saving}
            confirmLabel="Save"
          />
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            Measurement snapshot is preserved. Remaining balance is recalculated from price and payments.
          </p>
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
          <Input
            label="Customer Price (Rs)"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-zinc-700">Delivery date</Label>
              <div className="flex gap-1">
                {[3, 7, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDeliveryDays(days)}
                    className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 transition-colors hover:bg-zinc-200"
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
            />
          </div>
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>

      <DeleteModel
        title="Delete order"
        description="This action cannot be undone. Do you want to permanently delete this order?"
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open && !deleting) setOrderToDelete(null);
        }}
        onDelete={remove}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
