import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { formatApiError } from "../../utils/errors";
import { DataTable } from "@/components/DataTable";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_CODES } from "../../config/constants";
import { formatPhoneNumber } from "@/lib/utils";
import {
  UserPlus,
  Pencil,
  Trash2,
  Copy,
  Check,
  Search,
  User as UserIcon,
  Globe,
} from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+92",
    roleId: "",
  });
  const [countryQ, setCountryQ] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        api.get("/users"),
        api.get("/roles"),
      ]);
      setUsers(uRes.data.data);
      setRoles(rRes.data.data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        countryCode: "+92",
        roleId: user.role?._id || user.role || "",
      });
      const incomingPhone = user.phone || "";
      let countryCode = "+92";
      let phone = incomingPhone;
      for (const c of COUNTRY_CODES) {
        if (incomingPhone.startsWith(c.code)) {
          countryCode = c.code;
          phone = incomingPhone.slice(c.code.length);
          break;
        }
      }
      setFormData((prev) => ({ ...prev, countryCode, phone }));
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        countryCode: "+92",
        roleId: roles[0]?._id || "",
      });
    }
    setFormErrors({});
    setCountryQ("");
    setTempPassword("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === formData.countryCode);
    const requiredLength = selectedCountry?.length || 10;
    const cleanPhone = formData.phone.trim().replace(/\D/g, "");

    if (!formData.name.trim()) err.name = "Required";
    if (!formData.email.trim()) err.email = "Required";
    if (!formData.roleId) err.roleId = "Required";
    if (!cleanPhone) {
      err.phone = "Required";
    } else if (cleanPhone.length !== requiredLength) {
      err.phone = `Must be exactly ${requiredLength} digits for ${selectedCountry?.name}`;
    }

    setFormErrors(err);
    if (Object.keys(err).length) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: `${formData.countryCode}${cleanPhone}`,
      };
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, payload);
        toast.success("User updated");
      } else {
        const { data } = await api.post("/users", payload);
        toast.success("User created");
        if (data.tempPassword) {
          setTempPassword(data.tempPassword);
        }
      }
      if (!tempPassword) {
        setShowModal(false);
        fetchData();
      } else {
        fetchData(); // Refresh list but keep modal open to show password
      }
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Password copied!");
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (selectedRoleFilter === "all" || (u.role?._id || u.role) === selectedRoleFilter)
  );

  const columns = [
    {
      accessorKey: "name",
      header: "User",
      meta: { label: "User" },
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
              {u.profilePicture ? (
                <img src={u.profilePicture} alt={u.name} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={20} className="text-zinc-400" />
              )}
            </div>
            <div>
              <div className="font-semibold text-zinc-900">{u.name}</div>
              <div className="text-xs text-zinc-500">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      meta: { label: "Role" },
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800">
          {row.original.role?.title || "No Role"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      meta: { label: "Contact" },
      cell: ({ row }) => formatPhoneNumber(row.original.phone),
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
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">User Management</h1>
          <p className="text-sm text-zinc-500">Add and manage application users and their access roles.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <UserPlus size={16} />
          <span>Add User</span>
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <InputGroup>
          <InputGroupInput
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
          <InputGroupAddon>
            <Search size={18} className="text-zinc-400" />
          </InputGroupAddon>
        </InputGroup>
        <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
          <SelectTrigger className="bg-white w-full md:w-56">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role._id} value={role._id}>
                {role.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={filteredUsers}
          isLoading={loading}
          emptyMessage="No users found."
          enableSelection={false}
          fixedHeight={false}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {tempPassword ? (
                <div className="rounded-xl bg-[var(--sf-accent-soft)] p-6 text-center">
                  <p className="text-sm font-medium text-zinc-600 mb-2">Temporary Password (Shown Once)</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl font-mono font-bold tracking-wider text-[var(--sf-accent)] bg-white px-4 py-2 rounded-lg border border-zinc-200 shadow-sm">
                      {tempPassword}
                    </span>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="p-3 bg-white rounded-lg border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
                    >
                      {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-zinc-600" />}
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500 italic">
                    Please copy this password and share it with the user. They will be asked to change it upon first login.
                  </p>
                  <Button
                    type="button"
                    className="mt-6 w-full"
                    variant="outline"
                    onClick={() => { setShowModal(false); fetchData(); }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    label="Full Name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    error={formErrors.name}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    error={formErrors.email}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-zinc-700">Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="w-32">
                        <Select
                          value={formData.countryCode}
                          onValueChange={(v) => setFormData((f) => ({ ...f, countryCode: v }))}
                        >
                          <SelectTrigger className="flex items-center gap-2 px-2">
                            <SelectValue>
                              {(() => {
                                const c = COUNTRY_CODES.find((x) => x.code === formData.countryCode);
                                return c ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={`https://flagcdn.com/w20/${c.iso}.png`}
                                      alt={c.iso}
                                      className="h-3 w-5 object-cover rounded-sm"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                    <span className="text-xs">{c.code}</span>
                                  </div>
                                ) : (
                                  <Globe size={14} />
                                );
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-auto">
                            <div className="sticky top-0 z-10 bg-white p-2 border-b">
                              <input
                                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                                placeholder="Search code or country..."
                                value={countryQ}
                                onKeyDown={(e) => e.stopPropagation()}
                                onChange={(e) => setCountryQ(e.target.value)}
                              />
                            </div>
                            {COUNTRY_CODES.filter(
                              (c) =>
                                c.code.includes(countryQ) ||
                                c.name.toLowerCase().includes(countryQ.toLowerCase())
                            ).map((c) => (
                              <SelectItem key={c.iso} value={c.code}>
                                <div className="flex items-center gap-3">
                                  <img
                                    src={`https://flagcdn.com/w20/${c.iso}.png`}
                                    alt={c.iso}
                                    className="h-3 w-5 object-cover rounded-sm"
                                  />
                                  <span className="text-sm font-medium">{c.code}</span>
                                  <span className="text-xs text-zinc-400">{c.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="tel"
                          className={`flex h-10 w-full rounded-md border ${formErrors.phone ? "border-red-500" : "border-zinc-200"
                            } bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                          value={formData.phone}
                          maxLength={COUNTRY_CODES.find((c) => c.code === formData.countryCode)?.length || 15}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))
                          }
                          placeholder="300 1234567"
                        />
                      </div>
                    </div>
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Access Role</label>
                    <Select
                      value={formData.roleId}
                      onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                    >
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r._id} value={r._id} className="capitalize">
                            {(r.title || "").toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.roleId && <p className="text-xs text-red-500 mt-1">{formErrors.roleId}</p>}
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Processing..." : editingUser ? "Save Changes" : "Create User"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
