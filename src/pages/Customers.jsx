import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/ui/DataTable";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal, { ModalActions } from "../components/ui/Modal";
import { formatApiError } from "../utils/errors";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "" };

export default function Customers() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const v = searchParams.get("q");
    if (v) setQ(v);
  }, [searchParams]);

  const fetchPage = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get("/customers", {
        params: { q: debouncedQ, page, limit: 10 },
      });
      setRows(data.data);
      setMeta(data.meta);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
      notes: row.notes || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const save = async () => {
    const err = {};
    if (!form.name.trim()) err.name = "Required";
    setFormErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing._id}`, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        });
        toast.success("Customer updated");
      } else {
        await api.post("/customers", {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        });
        toast.success("Customer added");
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
    if (!window.confirm(`Delete ${row.name}?`)) return;
    try {
      await api.delete(`/customers/${row._id}`);
      toast.success("Deleted");
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    {
      key: "actions",
      header: "",
      width: "180px",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-sm font-medium text-[var(--sf-accent)] hover:underline"
            onClick={() => openEdit(row)}
          >
            Edit
          </button>
          {isAdmin && (
            <button
              type="button"
              className="text-sm font-medium text-red-600 hover:underline"
              onClick={() => remove(row)}
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <input
            type="search"
            placeholder="Search name, phone, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-[var(--sf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent)]/20"
          />
        </div>
        <Button onClick={openCreate}>Add customer</Button>
      </div>

      <DataTable columns={columns} rows={rows} isLoading={loading} emptyMessage="No customers" />

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
        title={editing ? "Edit customer" : "New customer"}
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={save}
            loading={saving}
            confirmLabel={editing ? "Save" : "Create"}
          />
        }
      >
        <div className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
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
