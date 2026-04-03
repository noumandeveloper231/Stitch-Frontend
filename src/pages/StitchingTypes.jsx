import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api } from "../api/client";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal, { ModalActions } from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/errors";

const initialForm = {
  name: "",
  singlePrice: "",
  doublePrice: "",
  notes: "",
  isActive: true,
};

export default function StitchingTypes() {
  const { can } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/stitching-types", { params: { limit: 200 } });
      setTypes(data.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const openModal = (type = null) => {
    setEditing(type);
    setForm(
      type
        ? {
            name: type.name,
            singlePrice: String(type.singlePrice ?? ""),
            doublePrice: String(type.doublePrice ?? ""),
            notes: type.notes || "",
            isActive: Boolean(type.isActive),
          }
        : initialForm,
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Garment name is required");
      return;
    }
    if (Number(form.singlePrice) < 0 || Number(form.doublePrice) < 0) {
      toast.error("Prices must be zero or positive");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        singlePrice: Number(form.singlePrice) || 0,
        doublePrice: Number(form.doublePrice) || 0,
        notes: form.notes.trim(),
        isActive: Boolean(form.isActive),
      };
      if (editing) {
        await api.put(`/stitching-types/${editing._id}`, payload);
        toast.success("Stitching type updated");
      } else {
        await api.post("/stitching-types", payload);
        toast.success("Stitching type created");
      }
      closeModal();
      fetchTypes();
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!type) return;
    if (!confirm(`Delete ${type.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/stitching-types/${type._id}`);
      toast.success("Deleted");
      fetchTypes();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "name", header: "Garment Type", meta: { label: "Garment" } },
      {
        accessorKey: "singlePrice",
        header: "Single Stitch (Rs)",
        cell: ({ row }) => `Rs ${(row.original.singlePrice ?? 0).toLocaleString()}`,
      },
      {
        accessorKey: "doublePrice",
        header: "Double Stitch (Rs)",
        cell: ({ row }) => `Rs ${(row.original.doublePrice ?? 0).toLocaleString()}`,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="text-xs font-semibold uppercase text-emerald-600">Active</span>
          ) : (
            <span className="text-xs font-semibold uppercase text-zinc-500">Inactive</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        filter: false,
        cell: ({ row }) => {
          if (!can("Stitching Types", "manage") && !can("Stitching Types", "create")) {
            return null;
          }
          return (
            <div className="flex gap-2">
              {(can("Stitching Types", "manage") || can("Stitching Types", "create")) && (
                <button
                  type="button"
                  onClick={() => openModal(row.original)}
                  className="text-xs font-medium text-[var(--sf-accent)] hover:underline"
                >
                  Edit
                </button>
              )}
              {can("Stitching Types", "delete") && (
                <button
                  type="button"
                  onClick={() => handleDelete(row.original)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [can],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stitching Types"
        description="Define garments and their single/double stitching price points so the system can auto-apply them when creating orders."
        buttons={
          can("Stitching Types", "create") ? (
            <Button onClick={() => openModal()} className="flex items-center gap-2">
              <Plus size={14} />
              Add stitch configuration
            </Button>
          ) : null
        }
      />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <DataTable
          columns={columns}
          rows={types}
          isLoading={loading}
          emptyMessage="No stitching types configured."
          fixedHeight={false}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${editing.name}` : "New Stitching Type"}
        footer={
          <ModalActions
            onCancel={closeModal}
            onConfirm={handleSave}
            loading={saving}
            confirmLabel={editing ? "Save changes" : "Create"}
          />
        }
      >
        <div className="space-y-4">
          <Input
            label="Garment name"
            placeholder="e.g. Shalwar Kameez"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Single stitch (Rs)"
              type="number"
              min="0"
              value={form.singlePrice}
              onChange={(e) => setForm((f) => ({ ...f, singlePrice: e.target.value }))}
            />
            <Input
              label="Double stitch (Rs)"
              type="number"
              min="0"
              value={form.doublePrice}
              onChange={(e) => setForm((f) => ({ ...f, doublePrice: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Active</label>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: !!checked }))}
              />
              <span className="text-sm text-zinc-600">
                Toggle to disable this configuration without deleting it.
              </span>
            </div>
          </div>
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional description"
          />
        </div>
      </Modal>
    </div>
  );
}
