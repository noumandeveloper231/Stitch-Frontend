import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, SearchIcon } from "lucide-react";
import { api } from "@/api/client";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Modal, { ModalActions } from "@/components/ui/modal";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Input from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DeleteModel } from "@/components/DeleteModel";
import { formatApiError } from "../utils/errors";

export default function ExpenseSubcategories() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ categoryId: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/expense-categories", {
        params: { page: 1, limit: 200, sort: "name", order: "asc" },
      });
      setCategories(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/expense-subcategories", {
        params: {
          q: debouncedQ,
          categoryId: categoryFilter,
          page: 1,
          limit: 300,
          sort: "name",
          order: "asc",
        },
      });
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, categoryFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: "", name: "" });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      categoryId: row?.categoryId?._id || "",
      name: row?.name || "",
    });
    setModalOpen(true);
  };

  const onSave = async () => {
    if (!form.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = { categoryId: form.categoryId, name: form.name.trim() };
      if (editing?._id) {
        await api.put(`/expense-subcategories/${editing._id}`, payload);
        toast.success("Subcategory updated");
      } else {
        await api.post("/expense-subcategories", payload);
        toast.success("Subcategory created");
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
      await api.delete(`/expense-subcategories/${deleteTarget._id}`);
      toast.success("Subcategory deleted");
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
      {
        key: "category",
        header: "Category",
        cell: ({ row }) => row.original?.categoryId?.name || "—",
      },
      { key: "name", header: "Subcategory Name" },
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
        title="Expense Subcategories"
        description="Create and manage subcategories under each expense category."
        buttons={
          <Button onClick={openCreate}>
            <PlusIcon />
            Add Subcategory
          </Button>
        }
      />

      <div className="rounded-lg border border-zinc-200/80 bg-white p-4 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</Label>
            <InputGroup>
              <InputGroupInput
                placeholder="Search subcategory..."
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Category</Label>
            <Select
              value={categoryFilter || "__all"}
              onValueChange={(value) => setCategoryFilter(value === "__all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
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
          emptyMessage="No expense subcategories"
          fixedHeight={false}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Expense Subcategory" : "Add Expense Subcategory"}
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={onSave}
            loading={saving}
            confirmLabel={editing ? "Update" : "Create"}
          />
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Category</Label>
            <Select
              value={form.categoryId || "__none"}
              onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value === "__none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Select category name</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Enter sub category name"
          />
        </div>
      </Modal>

      <DeleteModel
        title="Delete subcategory"
        description="This subcategory will be removed permanently."
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
