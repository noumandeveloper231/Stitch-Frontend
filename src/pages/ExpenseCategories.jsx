import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchIcon, PlusIcon } from "lucide-react";
import { api } from "@/api/client";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal, { ModalActions } from "@/components/ui/modal";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DeleteModel } from "@/components/DeleteModel";
import { formatApiError } from "../utils/errors";

export default function ExpenseCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/expense-categories", {
        params: { q: debouncedQ, page: 1, limit: 200, sort: "name", order: "asc" },
      });
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "" });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row?.name || "" });
    setModalOpen(true);
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing?._id) {
        await api.put(`/expense-categories/${editing._id}`, { name: form.name.trim() });
        toast.success("Category updated");
      } else {
        await api.post("/expense-categories", { name: form.name.trim() });
        toast.success("Category created");
      }
      setModalOpen(false);
      setEditing(null);
      await fetchRows();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget?._id) return;
    setDeleting(true);
    try {
      await api.delete(`/expense-categories/${deleteTarget._id}`);
      toast.success("Category deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchRows();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", header: "Category Name" },
      {
        key: "createdAt",
        header: "Created",
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        key: "actions",
        header: "Actions",
        filter: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => openEdit(row.original)}>
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDeleteTarget(row.original);
                setDeleteOpen(true);
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Categories"
        description="Create and manage expense category names."
        buttons={
          <Button onClick={openCreate}>
            <PlusIcon />
            Add Category
          </Button>
        }
      />

      <div className="rounded-lg border border-zinc-200/80 bg-white p-4 space-y-6">
        <div className="max-w-md">
          <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</Label>
          <InputGroup>
            <InputGroupInput
              placeholder="Search category name..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          isLoading={loading}
          emptyMessage="No expense categories"
          fixedHeight={false}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Expense Category" : "Add Expense Category"}
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={onSave}
            loading={saving}
            confirmLabel={editing ? "Update" : "Create"}
          />
        }
      >
        <Input
          label="Expense Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Enter expense category name"
        />
      </Modal>

      <DeleteModel
        title="Delete category"
        description="This category will be removed permanently."
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open && !deleting) setDeleteTarget(null);
        }}
        onDelete={onDelete}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  );
}
