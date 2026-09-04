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
  Users as UsersIcon,
  Pencil,
  Trash2,
  Search,
  User as UserIcon,
  Globe,
} from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import KPICards from "@/components/KPICards";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+92",
    status: "active",
  });
  const [countryQ, setCountryQ] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data.data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee = null) => {
    setEditingEmployee(employee);
    if (employee) {
      const incomingPhone = employee.phone || "";
      let countryCode = "+92";
      let phone = incomingPhone;
      for (const c of COUNTRY_CODES) {
        if (incomingPhone.startsWith(c.code)) {
          countryCode = c.code;
          phone = incomingPhone.slice(c.code.length);
          break;
        }
      }
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone,
        countryCode,
        status: employee.status || "active",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        countryCode: "+92",
        status: "active",
      });
    }
    setFormErrors({});
    setCountryQ("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = {};
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === formData.countryCode);
    const requiredLength = selectedCountry?.length || 10;
    const cleanPhone = formData.phone.trim().replace(/\D/g, "");

    if (!formData.firstName.trim()) err.firstName = "Required";
    if (!formData.lastName.trim()) err.lastName = "Required";
    if (!formData.email.trim()) err.email = "Required";
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
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: `${formData.countryCode}${cleanPhone}`,
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, payload);
        toast.success("Employee updated");
        setShowModal(false);
      } else {
        await api.post("/employees", payload);
        toast.success("Employee created. Invitation email sent.");
        setShowModal(false);
      }
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success("Employee deleted");
      fetchData();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName} ${e.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const columns = [
    {
      accessorKey: "name",
      header: "Employee",
      meta: { label: "Employee" },
      cell: ({ row }) => {
        const e = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
              {e.profilePicture ? (
                <img src={e.profilePicture} alt={`${e.firstName} ${e.lastName}`} className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={20} className="text-zinc-400" />
              )}
            </div>
            <div>
              <div className="font-semibold text-zinc-900">
                {e.firstName} {e.lastName}
              </div>
              <div className="text-xs text-zinc-500">{e.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      meta: { label: "Contact" },
      cell: ({ row }) => formatPhoneNumber(row.original.phone),
    },
    {
      id: "status",
      header: "Status",
      meta: { label: "Status" },
      cell: ({ row }) => {
        const s = row.original.status;
        const color =
          s === "active"
            ? "bg-emerald-100 text-emerald-800"
            : s === "inactive"
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800";
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
            {s}
          </span>
        );
      },
    },
    {
      id: "invitationStatus",
      header: "Invitation",
      meta: { label: "Invitation" },
      cell: ({ row }) => {
        const s = row.original.invitationStatus;
        const color =
          s === "active"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800";
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
            {s === "active" ? "Active" : "Invited"}
          </span>
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
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Employee Management</h1>
          <p className="text-sm text-zinc-500">Add and manage employees and their access.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <UserPlus size={16} />
          <span>Add Employee</span>
        </Button>
      </div>

      {employees.length > 0 && (
        <div className="mt-6">
          <KPICards
            columns={4}
            items={[
              {
                title: "Total Employees",
                value: employees.length,
                icon: UsersIcon,
                iconColor: "text-indigo-600",
                borderColor: "border-l-indigo-500",
              },
              {
                title: "Active",
                value: employees.filter((e) => e.status === "active").length,
                icon: UsersIcon,
                iconColor: "text-emerald-600",
                borderColor: "border-l-emerald-500",
              },
              {
                title: "Invited",
                value: employees.filter((e) => e.invitationStatus === "invited").length,
                icon: UsersIcon,
                iconColor: "text-amber-600",
                borderColor: "border-l-amber-500",
              },
            ]}
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <InputGroup>
          <InputGroupInput
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon>
            <Search size={18} className="text-zinc-400" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={filteredEmployees}
          isLoading={loading}
          emptyMessage="No employees found."
          enableSelection={false}
          fixedHeight={false}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="First Name"
                placeholder="e.g. John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                error={formErrors.firstName}
              />
              <Input
                label="Last Name"
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                error={formErrors.lastName}
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
                                  onError={(e) => { e.target.style.display = "none"; }}
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
                            c.name.toLowerCase().includes(countryQ.toLowerCase()),
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

              {editingEmployee && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                  {submitting
                    ? "Processing..."
                    : editingEmployee
                      ? "Save Changes"
                      : "Create Employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
