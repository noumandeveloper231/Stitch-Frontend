import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, downloadOrderInvoicePdf } from "../api/client";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/ui/DataTable";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal, { ModalActions } from "../components/ui/Modal";
import DateRangeFilter from "../components/DateRangeFilter";
import { ORDER_STATUSES } from "../config/constants";
import { formatApiError } from "../utils/errors";

export default function Orders() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("orderId") || "";

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateField, setDateField] = useState("createdAt");
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({
    status: "pending",
    totalAmount: "",
    advance: "",
    deliveryDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const fetchPage = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10, dateField };
        if (status) params.status = status;
        if (from) params.from = from;
        if (to) params.to = to;
        const { data } = await api.get("/orders", { params });
        setRows(data.data);
        setMeta(data.meta);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    },
    [status, from, to, dateField],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const openEdit = (order) => {
    setEditModal(order);
    setForm({
      status: order.status,
      totalAmount: String(order.totalAmount ?? ""),
      advance: String(order.advance ?? ""),
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toISOString().slice(0, 10)
        : "",
      notes: order.notes || "",
    });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await api.put(`/orders/${editModal._id}`, {
        status: form.status,
        totalAmount: parseFloat(form.totalAmount) || 0,
        advance: parseFloat(form.advance) || 0,
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

  const remove = async (row) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await api.delete(`/orders/${row._id}`);
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
      render: (o) => o.customerId?.name || "—",
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (o) => `Rs ${(o.totalAmount ?? 0).toLocaleString()}`,
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <Badge status={o.status}>{o.status}</Badge>,
    },
    {
      key: "deliveryDate",
      header: "Delivery",
      render: (o) =>
        o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "",
      width: "260px",
      render: (o) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-sm font-medium text-[var(--sf-accent)] hover:underline"
            onClick={() => openEdit(o)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-sm font-medium text-zinc-600 hover:underline disabled:opacity-50"
            disabled={pdfLoadingId === o._id}
            onClick={() => handlePdf(o._id)}
          >
            {pdfLoadingId === o._id ? "PDF…" : "PDF"}
          </button>
          {isAdmin && (
            <button
              type="button"
              className="text-sm font-medium text-red-600 hover:underline"
              onClick={() => remove(o)}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onApply={() => fetchPage(1)}
        onReset={() => {
          setFrom("");
          setTo("");
          setStatus("");
          setDateField("createdAt");
        }}
      >
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          label="Date field"
          value={dateField}
          onChange={(e) => setDateField(e.target.value)}
        >
          <option value="createdAt">Created</option>
          <option value="deliveryDate">Delivery</option>
        </Select>
      </DateRangeFilter>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={loading}
        emptyMessage="No orders"
        rowClassName={(o) =>
          highlightId && String(o._id) === String(highlightId)
            ? "bg-amber-50/90 ring-1 ring-inset ring-amber-200/60"
            : ""
        }
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
            Measurement snapshot is preserved. Remaining balance is recalculated from total and
            advance.
          </p>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total (Rs)"
              type="number"
              min="0"
              step="0.01"
              value={form.totalAmount}
              onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
            />
            <Input
              label="Advance (Rs)"
              type="number"
              min="0"
              step="0.01"
              value={form.advance}
              onChange={(e) => setForm((f) => ({ ...f, advance: e.target.value }))}
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
        </div>
      </Modal>
    </div>
  );
}
