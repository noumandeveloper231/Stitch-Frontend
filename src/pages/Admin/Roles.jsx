import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import Modal from "@/components/ui/modal";
import { formatApiError } from "../../utils/errors";
import { PERMISSION_MODULES } from "../../config/permissions";
import { 
  ShieldCheck, 
  Pencil, 
  Trash2, 
  Save, 
  Info,
  Shield,
} from "lucide-react";

const MODULES = PERMISSION_MODULES;

const ACTIONS = [
  { key: "show", label: "View (Read-only)" },
  { key: "create", label: "Create" },
  { key: "delete", label: "Delete" },
  { key: "manage", label: "Manage (Full Access)" },
];

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    permissions: {},
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data } = await api.get("/roles");
      setRoles(data.data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (role = null) => {
    setEditingRole(role);
    if (role) {
      const perms = {};
      MODULES.forEach((m) => {
        perms[m] = {
          show: role.permissions?.[m]?.show || false,
          create: role.permissions?.[m]?.create || false,
          delete: role.permissions?.[m]?.delete || false,
          manage: role.permissions?.[m]?.manage || false,
        };
      });
      setFormData({
        title: role.title,
        permissions: perms,
      });
    } else {
      const perms = {};
      MODULES.forEach((m) => {
        perms[m] = { show: false, create: false, delete: false, manage: false };
      });
      setFormData({
        title: "",
        permissions: perms,
      });
    }
    setShowModal(true);
  };

  const togglePermission = (module, action) => {
    setFormData((prev) => {
      const next = { ...prev };
      const current = next.permissions[module][action];
      next.permissions[module][action] = !current;
      
      // If manage is enabled, enable all others
      if (action === "manage" && !current) {
        next.permissions[module].show = true;
        next.permissions[module].create = true;
        next.permissions[module].delete = true;
      }
      
      return next;
    });
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!formData.title.trim()) return toast.error("Role title is required");

    setSubmitting(true);
    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole._id}`, formData);
        toast.success("Role updated");
      } else {
        await api.post("/roles", formData);
        toast.success("Role created");
      }
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/roles/${id}`);
      toast.success("Role deleted");
      fetchRoles();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Role Management</h1>
          <p className="text-sm text-zinc-500">Define access roles and granular permissions for every module.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>Create New Role</span>
        </Button>
      </div>

      <div className="mt-8">
        <DataTable
          columns={[
            {
              accessorKey: "title",
              header: "Role",
              meta: { label: "Role" },
              cell: ({ row }) => (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--sf-accent-soft)] flex items-center justify-center border border-zinc-100">
                    <Shield size={18} className="text-[var(--sf-accent)]" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900">{row.original.title}</div>
                    <div className="text-xs text-zinc-500">Custom access level</div>
                  </div>
                </div>
              ),
            },
            {
              id: "modules",
              header: "Enabled Modules",
              meta: { label: "Enabled Modules" },
              cell: ({ row }) => {
                const enabledModules = MODULES.filter((m) => row.original.permissions?.[m]?.show);
                if (!enabledModules.length) return <span className="text-xs text-zinc-400 italic">No modules assigned</span>;
                return (
                  <div className="flex flex-wrap gap-2">
                    {enabledModules.slice(0, 4).map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded bg-zinc-100 text-xs text-zinc-700">
                        {m}
                      </span>
                    ))}
                    {enabledModules.length > 4 && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-xs text-zinc-700">
                        +{enabledModules.length - 4} more
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              id: "actions",
              header: "Actions",
              filter: false,
              cell: ({ row }) => (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleOpenModal(row.original)}
                    className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-[var(--sf-accent)] transition-colors"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(row.original._id)}
                    className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={roles}
          isLoading={loading}
          emptyMessage='No roles defined. Click "Create New Role" to get started.'
          enableSelection={false}
          fixedHeight={false}
        />
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRole ? `Edit Role: ${formData.title}` : "Create New Access Role"}
        contentClassName="w-[95vw] max-w-6xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Discard Changes
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Save size={18} className="group-hover:scale-110 transition-transform" />
              <span>{submitting ? "Saving..." : editingRole ? "Update Role" : "Create Role"}</span>
            </Button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-zinc-500 mb-6">Configure access levels across all platform modules</p>
          <div className="max-w-md mb-8">
            <Input
              label="Role Title"
              placeholder="e.g. Production manager, Accountant"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 uppercase tracking-widest pb-2 border-b-2 border-zinc-100">
              <ShieldCheck size={18} className="text-[var(--sf-accent)]" />
              Permissions Matrix
            </div>

            <DataTable
              columns={[
                { accessorKey: "module", header: "Module Name", meta: { label: "Module Name" } },
                ...ACTIONS.map((action) => ({
                  id: action.key,
                  header: action.label,
                  meta: { label: action.label },
                  cell: ({ row }) => (
                    <div className="flex justify-center">
                      <Checkbox
                        checked={Boolean(formData.permissions?.[row.original.module]?.[action.key])}
                        onCheckedChange={() => togglePermission(row.original.module, action.key)}
                        className="h-5 w-5"
                      />
                    </div>
                  ),
                })),
              ]}
              rows={MODULES.map((module) => ({ module }))}
              enableSelection={false}
              addPagination={false}
              fixedHeight={false}
            />
          </div>

          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs leading-relaxed">
            <Info size={16} className="mt-0.5 shrink-0" />
            <div>
              <strong>Pro Tip:</strong> Enabling <strong>"Manage"</strong> automatically grants all other permissions for that module. Granular permissions (Show, Create, Delete) allow you to restrict actions while still providing access.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
