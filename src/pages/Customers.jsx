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
import { Pencil, SearchIcon, Trash2, Globe } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DeleteModel } from "@/components/DeleteModel";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_CODES } from "../config/constants";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "", countryCode: "+92" };

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
  const [countryQ, setCountryQ] = useState("");

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
    setCountryQ("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setCountryQ("");
    
    // Attempt to split country code from phone
    let countryCode = "+92";
    let phone = row.phone || "";
    for (const c of COUNTRY_CODES) {
      if (phone.startsWith(c.code)) {
        countryCode = c.code;
        phone = phone.slice(c.code.length);
        break;
      }
    }

    setForm({
      name: row.name || "",
      phone: phone,
      countryCode: countryCode,
      email: row.email || "",
      address: row.address || "",
      notes: row.notes || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const save = async () => {
    const err = {};
    const selectedCountry = COUNTRY_CODES.find(c => c.code === form.countryCode);
    const requiredLength = selectedCountry?.length || 10;
    const cleanPhone = form.phone.trim().replace(/\D/g, "");

    if (!form.name.trim()) err.name = "Required";
    if (!cleanPhone) {
      err.phone = "Required";
    } else if (cleanPhone.length !== requiredLength) {
      err.phone = `Must be exactly ${requiredLength} digits for ${selectedCountry?.name}`;
    }
    
    setFormErrors(err);
    if (Object.keys(err).length) return;

    const fullPhone = `${form.countryCode}${cleanPhone}`;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: fullPhone,
        email: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
      };

      if (editing) {
        await api.put(`/customers/${editing._id}`, payload);
        toast.success("Customer updated");
      } else {
        await api.post("/customers", payload);
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
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={formErrors.name}
            placeholder="e.g. John Doe"
          />

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700">Phone Number</Label>
            <div className="flex gap-2">
              <div className="w-32">
                <Select
                  value={form.countryCode}
                  onValueChange={(v) => setForm((f) => ({ ...f, countryCode: v }))}
                >
                  <SelectTrigger className="flex items-center gap-2 px-2">
                    <SelectValue>
                      {(() => {
                        const c = COUNTRY_CODES.find((x) => x.code === form.countryCode);
                        return c ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://flagcdn.com/w20/${c.iso}.png`}
                              alt={c.iso}
                              className="h-3 w-5 object-cover rounded-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
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
                  <SelectContent className='max-h-[250px] overflow-auto'>
                    <div className="sticky top-0 z-10 bg-white p-2 border-b">
                      <input
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                        placeholder="Search code or country..."
                        value={countryQ}
                        onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) => setCountryQ(e.target.value)}
                      />
                    </div>
                    {COUNTRY_CODES.filter((c) =>
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
                    {COUNTRY_CODES.filter((c) =>
                      c.code.includes(countryQ) ||
                      c.name.toLowerCase().includes(countryQ.toLowerCase())
                    ).length === 0 && (
                      <p className="p-2 text-center text-xs text-zinc-500">No country found</p>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <input
                  type="tel"
                  className={`flex h-10 w-full rounded-md border ${
                    formErrors.phone ? "border-red-500" : "border-zinc-200"
                  } bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  value={form.phone}
                  maxLength={COUNTRY_CODES.find(c => c.code === form.countryCode)?.length || 15}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="300 1234567"
                />
              </div>
            </div>
            {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="customer@example.com"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Street, City"
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Special instructions..."
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
