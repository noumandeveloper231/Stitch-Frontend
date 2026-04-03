import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, SearchIcon, UploadIcon } from "lucide-react";
import { api } from "@/api/client";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Modal, { ModalActions } from "@/components/ui/modal";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { DeleteModel } from "@/components/DeleteModel";
import DateRangeFilter from "@/components/DateRangeFilter";
import { formatApiError } from "../utils/errors";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read receipt file"));
    reader.readAsDataURL(file);
  });
}

export default function Expenses() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    expenseNumber: "",
    date: "",
    categoryId: "",
    subcategoryId: "",
    title: "",
    amount: "",
    receipt: { url: "", publicId: "", originalName: "" },
    receiptFile: null,
    notes: "",
  });

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

  const loadSubcategories = useCallback(async (categoryId = "") => {
    try {
      const { data } = await api.get("/expense-subcategories", {
        params: { page: 1, limit: 500, sort: "name", order: "asc", categoryId: categoryId || undefined },
      });
      setSubcategories(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadSubcategories("");
  }, [loadCategories, loadSubcategories]);

  useEffect(() => {
    if (!categoryFilter) return;
    if (subcategoryFilter && !subcategories.some((item) => item._id === subcategoryFilter)) {
      setSubcategoryFilter("");
    }
  }, [categoryFilter, subcategoryFilter, subcategories]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q: debouncedQ,
        dateFrom,
        dateTo,
        amountMin: amountMin === "" ? undefined : Number(amountMin),
        amountMax: amountMax === "" ? undefined : Number(amountMax),
        categoryId: categoryFilter,
        subcategoryId: subcategoryFilter,
        page: 1,
        limit: 500,
        sort: "date",
        order: "desc",
      };
      const { data } = await api.get("/expenses", { params });
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, dateFrom, dateTo, amountMin, amountMax, categoryFilter, subcategoryFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = async () => {
    setEditing(null);
    setSaving(false);
    try {
      const { data } = await api.get("/expenses/next-number");
      const nextNumber = data?.data?.expenseNumber || "";
      setForm({
        expenseNumber: nextNumber,
        date: new Date().toISOString().slice(0, 10),
        categoryId: "",
        subcategoryId: "",
        title: "",
        amount: "",
        receipt: { url: "", publicId: "", originalName: "" },
        receiptFile: null,
        notes: "",
      });
      setModalOpen(true);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const openEdit = async (row) => {
    setEditing(row);
    setForm({
      expenseNumber: row?.expenseNumber || "",
      date: row?.date ? String(row.date).slice(0, 10) : "",
      categoryId: row?.categoryId?._id || "",
      subcategoryId: row?.subcategoryId?._id || "",
      title: row?.title || "",
      amount: String(row?.amount ?? ""),
      receipt: row?.receipt || { url: "", publicId: "", originalName: "" },
      receiptFile: null,
      notes: row?.notes || "",
    });
    await loadSubcategories(row?.categoryId?._id || "");
    setModalOpen(true);
  };

  const onChangeCategory = async (value) => {
    const nextCategoryId = value === "__none" ? "" : value;
    setForm((prev) => ({ ...prev, categoryId: nextCategoryId, subcategoryId: "" }));
    await loadSubcategories(nextCategoryId);
  };

  const uploadReceiptIfNeeded = async () => {
    if (!form.receiptFile) return form.receipt;
    const fileData = await readFileAsDataUrl(form.receiptFile);
    const { data } = await api.post("/expenses/upload-receipt", {
      fileData,
      originalName: form.receiptFile.name,
    });
    return data?.data || { url: "", publicId: "", originalName: "" };
  };

  const onSave = async () => {
    if (!form.date) return toast.error("Date is required");
    if (!form.categoryId) return toast.error("Category is required");
    if (!form.subcategoryId) return toast.error("Subcategory is required");
    if (!form.title.trim()) return toast.error("Expense title is required");
    if (form.amount === "" || Number(form.amount) < 0) return toast.error("Amount is required");

    setSaving(true);
    try {
      const receipt = await uploadReceiptIfNeeded();
      const payload = {
        date: form.date,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId,
        title: form.title.trim(),
        amount: Number(form.amount),
        receipt,
        notes: form.notes.trim(),
      };
      if (editing?._id) {
        await api.put(`/expenses/${editing._id}`, payload);
        toast.success("Expense updated");
      } else {
        await api.post("/expenses", payload);
        toast.success("Expense created");
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
      await api.delete(`/expenses/${deleteTarget._id}`);
      toast.success("Expense deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await fetchRows();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const formSubcategories = useMemo(
    () => subcategories.filter((item) => String(item?.categoryId?._id || item?.categoryId) === String(form.categoryId)),
    [subcategories, form.categoryId],
  );

  const filteredSubcategoriesForToolbar = useMemo(() => {
    if (!categoryFilter) return subcategories;
    return subcategories.filter(
      (item) => String(item?.categoryId?._id || item?.categoryId) === String(categoryFilter),
    );
  }, [subcategories, categoryFilter]);

  const expenseNumberSuffix = useMemo(
    () => (form.expenseNumber || "").replace(/^EXP-?/i, ""),
    [form.expenseNumber],
  );

  const columns = useMemo(
    () => [
      { key: "expenseNumber", header: "Expense Number" },
      {
        key: "date",
        header: "Date",
        cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
      },
      {
        key: "category",
        header: "Category",
        cell: ({ row }) => row.original?.categoryId?.name || "—",
      },
      {
        key: "subcategory",
        header: "Subcategory",
        cell: ({ row }) => row.original?.subcategoryId?.name || "—",
      },
      { key: "title", header: "Expense Title" },
      {
        key: "amount",
        header: "Amount",
        cell: ({ row }) => `Rs ${Number(row.original?.amount || 0).toLocaleString()}`,
      },
      {
        key: "receipt",
        header: "Receipt",
        cell: ({ row }) =>
          row.original?.receipt?.url ? (
            <a
              href={row.original.receipt.url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--sf-accent)] hover:underline"
            >
              View
            </a>
          ) : (
            "—"
          ),
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
    [openEdit],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track all business expenses with category and subcategory classification."
        buttons={
          <Button onClick={openCreate}>
            <PlusIcon />
            Add Expense
          </Button>
        }
      />

      <div className="rounded-lg border border-zinc-200/80 bg-white p-4 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</Label>
            <InputGroup>
              <InputGroupInput
                placeholder="Search expense number, title, notes, category..."
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onApply={() => fetchRows()}
            onReset={() => {
              setDateFrom("");
              setDateTo("");
            }}
            label="Expense Date"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Amount Min"
            type="number"
            min="0"
            step="0.01"
            value={amountMin}
            onChange={(event) => setAmountMin(event.target.value)}
            placeholder="0"
          />
          <Input
            label="Amount Max"
            type="number"
            min="0"
            step="0.01"
            value={amountMax}
            onChange={(event) => setAmountMax(event.target.value)}
            placeholder="0"
          />
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Category</Label>
            <Select
              value={categoryFilter || "__all"}
              onValueChange={async (value) => {
                const next = value === "__all" ? "" : value;
                setCategoryFilter(next);
                setSubcategoryFilter("");
                await loadSubcategories(next);
              }}
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
          <div>
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Subcategory</Label>
            <Select
              value={subcategoryFilter || "__all"}
              onValueChange={(value) => setSubcategoryFilter(value === "__all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All subcategories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All subcategories</SelectItem>
                {filteredSubcategoriesForToolbar.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name}
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
          emptyMessage="No expenses"
          fixedHeight={false}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Expense" : "Add Expense"}
        contentClassName="w-[95vw] max-w-3xl"
        footer={
          <ModalActions
            onCancel={() => setModalOpen(false)}
            onConfirm={onSave}
            loading={saving}
            confirmLabel={editing ? "Update" : "Create"}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700">Expense Number</Label>
            <InputGroup>
              <InputGroupAddon>#EXP-</InputGroupAddon>
              <InputGroupInput value={expenseNumberSuffix} readOnly />
            </InputGroup>
          </div>
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          />
          <div>
            <Label className="text-sm font-medium text-zinc-700">Category</Label>
            <Select value={form.categoryId || "__none"} onValueChange={onChangeCategory}>
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
          <div>
            <Label className="text-sm font-medium text-zinc-700">Subcategory</Label>
            <Select
              value={form.subcategoryId || "__none"}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, subcategoryId: value === "__none" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sub category name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Select sub category name</SelectItem>
                {formSubcategories.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            label="Expense Title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Enter expense title"
            className="md:col-span-2"
          />
          <Input
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="0"
          />
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700">Receipt</Label>
            <div className="flex items-center gap-3 rounded-lg border border-[#cdcdcd] px-3 py-2 shadow">
              <UploadIcon className="h-4 w-4 text-zinc-500" />
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, receiptFile: event.target.files?.[0] || null }))
                }
                className="w-full text-sm"
              />
            </div>
            {form.receipt?.url ? (
              <a
                href={form.receipt.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--sf-accent)] hover:underline"
              >
                Existing receipt
              </a>
            ) : null}
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-zinc-700">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Add expense notes..."
            />
          </div>
        </div>
      </Modal>

      <DeleteModel
        title="Delete expense"
        description="This expense will be removed permanently."
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
