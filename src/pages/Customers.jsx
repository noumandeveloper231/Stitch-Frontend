import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal, { ModalActions } from "@/components/ui/modal";
import { formatApiError } from "../utils/errors";
import { Pencil, SearchIcon, Trash2 } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DeleteModel } from "@/components/DeleteModel";
import PageHeader from "@/components/PageHeader";

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

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

  const remove = async () => {
    if (!customerToDelete?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${customerToDelete._id}`);
      toast.success("Deleted");
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchPage(meta.page);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { accessorKey: "name", header: "Name", meta: { label: "Name" } },
    { accessorKey: "phone", header: "Phone", meta: { label: "Phone" } },
    { accessorKey: "email", header: "Email", meta: { label: "Email" } },
    {
      id: "actions",
      header: "Actions",
      filter: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-[var(--sf-accent)] hover:underline"
            onClick={() => openEdit(row.original)}
            title="Edit"
          >
            <Pencil size={16} className="inline-block" />
          </button>
          {isAdmin && (
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
              onClick={() => {
                setCustomerToDelete(row.original);
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
        title="Customers"
        description="Manage customer profiles, contact details, and notes."
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon size={16} className="inline-block" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search name, phone, email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </InputGroup>
        </div>
        <Button onClick={openCreate}>Add customer</Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        isLoading={loading}
        emptyMessage="No customers"
        // addPagination={false}
        // enableSelection={false}
        fixedHeight={false}
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

      <DeleteModel
        title="Delete customer"
        description={
          customerToDelete?.name
            ? `This will permanently delete ${customerToDelete.name}. This action cannot be undone.`
            : "This action cannot be undone."
        }
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open && !deleting) setCustomerToDelete(null);
        }}
        onDelete={remove}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
