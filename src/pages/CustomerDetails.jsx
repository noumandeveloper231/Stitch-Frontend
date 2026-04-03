import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Eye,
  FileCodeIcon,
  GripVertical,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { api, downloadOrderInvoicePdf } from "../api/client";
import { formatApiError } from "../utils/errors";
import { useAuth } from "../context/AuthContext";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import Modal, { ModalActions } from "@/components/ui/modal";
import Input from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { DeleteModel } from "@/components/DeleteModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, STATUS_BADGE } from "../config/constants";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatPhoneNumber } from "@/lib/utils";

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function orderNumberFromId(id) {
  if (!id) return "—";
  return `#${String(id).slice(-6).toUpperCase()}`;
}

function getMeasurementSummary(values = {}) {
  const v = values || {};
  const parts = ["chest", "kameezLength", "shoulder"]
    .map((k) => (v[k] ? `${k}: ${v[k]}` : null))
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

const MEASUREMENT_LABELS = {
  kameezLength: "Kameez Length",
  shoulder: "Shoulder",
  chest: "Chest",
  loosing: "Loosing",
  neck: "Neck",
  armhole: "Armhole",
  sleeve: "Sleeve",
  cuffLength: "Cuff Length",
  cuffWidth: "Cuff Width",
  sleeveOpening: "Sleeve Opening",
  hem: "Hem",
  patiWidth: "Pati Width",
  patiLength: "Pati Length",
  shalwarWaist: "Shalwar Waist",
  shalwarWidth: "Shalwar Width",
  shalwarLength: "Shalwar Length",
  legOpening: "Leg Opening",
  daman: "Daman",
  cuffStyle: "Cuff Style",
  silkThread: "Silk Thread",
  stitching: "Stitching",
  buttons: "Buttons",
  buttonhole: "Buttonhole",
  designerSuit: "Designer Suit",
  collar: "Collar",
  frontPocket: "Front Pocket",
  sidePocket: "Side Pocket",
  sleevePleat: "Sleeve Pleat",
  hiddenPlacket: "Hidden Placket",
  shalwarType: "Shalwar Type",
  nettedLegOpening: "Netted Leg Opening",
  notes: "Notes",
};

function paymentId(orderId, index) {
  return `${orderId || "order"}-${index}`;
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can, isAdmin } = useAuth();
  const validTabs = ["details", "notes", "payments", "measurements", "orders"];
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(initialTab) ? initialTab : "details",
  );

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [measurements, setMeasurements] = useState([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteSort, setNoteSort] = useState("recent");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    subject: "",
    note: "",
    priority: "medium",
    pinned: false,
  });
  const [overviewColumns, setOverviewColumns] = useState({
    left: ["customerInfo", "recentNotes"],
    right: ["recentPayments", "recentOrders"],
  });

  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  const [editOrderModalOpen, setEditOrderModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    status: "pending",
    price: "",
    deliveryDate: "",
    notes: "",
  });
  const [savingOrder, setSavingOrder] = useState(false);

  const [deleteOrderOpen, setDeleteOrderOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}`);
      setCustomer(data.data);
    } catch (e) {
      toast.error(formatApiError(e));
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data } = await api.get("/orders", {
        params: { customerId: id, page: 1, limit: 100 },
      });
      setOrders(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setOrdersLoading(false);
    }
  }, [id]);

  const fetchMeasurements = useCallback(async () => {
    setMeasurementsLoading(true);
    try {
      const { data } = await api.get("/measurements", {
        params: { customerId: id, page: 1, limit: 100 },
      });
      setMeasurements(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setMeasurementsLoading(false);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const sort = noteSort === "priority" ? "priority" : "createdAt";
      const order = noteSort === "oldest" ? "asc" : "desc";
      const { data } = await api.get("/customer-notes", {
        params: { customerId: id, page: 1, limit: 50, sort, order },
      });
      setNotes(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setNotesLoading(false);
    }
  }, [id, noteSort]);

  useEffect(() => {
    fetchCustomer();
    fetchOrders();
    fetchMeasurements();
    fetchNotes();
  }, [fetchCustomer, fetchOrders, fetchMeasurements, fetchNotes]);

  const payments = useMemo(() => {
    const list = (orders || []).flatMap((o) =>
      (o.payments || []).map((p, idx) => ({
        id: paymentId(o._id, idx),
        orderId: o._id,
        orderNumber: orderNumberFromId(o._id),
        amount: p.amount,
        date: p.date,
      })),
    );

    return list.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return (db || 0) - (da || 0);
    });
  }, [orders]);

  const remainingOrderOptions = useMemo(() => {
    return (orders || [])
      .filter((o) => Number(o.remaining || 0) > 0)
      .map((o) => ({
        value: o._id,
        label: `${orderNumberFromId(o._id)} (Rs ${Number(o.remaining || 0).toLocaleString()})`,
      }));
  }, [orders]);

  useEffect(() => {
    if (!paymentModalOpen) return;
    if (paymentOrderId) return;
    if (remainingOrderOptions.length > 0) {
      setPaymentOrderId(remainingOrderOptions[0].value);
    }
  }, [paymentModalOpen, paymentOrderId, remainingOrderOptions]);

  const handleDeleteCustomer = useCallback(async () => {
    if (!customer?._id) return;
    setDeletingCustomer(true);
    try {
      await api.delete(`/customers/${customer._id}`);
      toast.success("Customer deleted");
      setDeleteCustomerOpen(false);
      navigate("/customers");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setDeletingCustomer(false);
    }
  }, [customer?._id, navigate]);

  const handleAddPayment = useCallback(async () => {
    if (!paymentOrderId) {
      toast.error("Select an order first");
      return;
    }
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    setAddingPayment(true);
    try {
      await api.post(`/orders/${paymentOrderId}/payment`, { amount });
      toast.success("Payment added successfully");
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentOrderId("");
      await fetchOrders();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setAddingPayment(false);
    }
  }, [fetchOrders, paymentAmount, paymentOrderId]);

  const addNote = useCallback(async () => {
    if (!noteForm.subject.trim() || !noteForm.note.trim()) {
      toast.error("Subject and note are required");
      return;
    }
    setAddingNote(true);
    try {
      await api.post("/customer-notes", {
        customerId: id,
        subject: noteForm.subject.trim(),
        note: noteForm.note.trim(),
        priority: noteForm.priority,
        pinned: noteForm.pinned,
      });
      toast.success("Note added");
      setNoteModalOpen(false);
      setNoteForm({ subject: "", note: "", priority: "medium", pinned: false });
      fetchNotes();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setAddingNote(false);
    }
  }, [fetchNotes, id, noteForm]);

  const togglePin = useCallback(
    async (note) => {
      try {
        await api.patch(`/customer-notes/${note._id}`, { pinned: !note.pinned });
        fetchNotes();
      } catch (e) {
        toast.error(formatApiError(e));
      }
    },
    [fetchNotes],
  );

  const onOverviewDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    setOverviewColumns((prev) => {
      const next = {
        left: [...prev.left],
        right: [...prev.right],
      };
      const sourceList = next[source.droppableId];
      const destinationList = next[destination.droppableId];
      const [moved] = sourceList.splice(source.index, 1);
      destinationList.splice(destination.index, 0, moved);
      return next;
    });
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab || !validTabs.includes(tab)) return;
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };

  const openOrderEdit = (order) => {
    setEditOrder(order);
    setOrderForm({
      status: order.status,
      price: String(order.price ?? ""),
      deliveryDate: order.deliveryDate
        ? new Date(order.deliveryDate).toISOString().slice(0, 10)
        : "",
      notes: order.notes || "",
    });
    setEditOrderModalOpen(true);
  };

  const saveOrderEdit = async () => {
    if (!editOrder?._id) return;
    setSavingOrder(true);
    try {
      await api.put(`/orders/${editOrder._id}`, {
        status: orderForm.status,
        price: parseFloat(orderForm.price) || 0,
        deliveryDate: orderForm.deliveryDate || null,
        notes: orderForm.notes.trim(),
      });
      toast.success("Order updated");
      setEditOrderModalOpen(false);
      setEditOrder(null);
      await fetchOrders();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSavingOrder(false);
    }
  };

  const openOrderDelete = (order) => {
    setOrderToDelete(order);
    setDeleteOrderOpen(true);
  };

  const deleteOrder = async () => {
    if (!orderToDelete?._id) return;
    setDeletingOrder(true);
    try {
      await api.delete(`/orders/${orderToDelete._id}`);
      toast.success("Order deleted");
      setDeleteOrderOpen(false);
      setOrderToDelete(null);
      await fetchOrders();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setDeletingOrder(false);
    }
  };

  const ordersColumns = useMemo(() => {
    const canManage = can("Orders", "manage") || isAdmin;
    return [
      {
        key: "orderNumber",
        header: "Order #",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-500">
            {orderNumberFromId(row.original._id)}
          </span>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        cell: ({ row }) => row.original.customerId?.name || "—",
      },
      {
        key: "price",
        header: "Price",
        cell: ({ row }) =>
          `Rs ${Number(row.original.price ?? 0).toLocaleString()}`,
      },
      {
        key: "remaining",
        header: "Remaining",
        cell: ({ row }) => (
          <span
            className={
              Number(row.original.remaining || 0) > 0
                ? "text-red-600 font-medium"
                : "text-green-600 font-medium"
            }
          >
            Rs {Number(row.original.remaining ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "paymentStatus",
        header: "Payment Status",
        cell: ({ row }) => (
          <Badge className="capitalize text-[10px]" status={row.original.paymentStatus || "unpaid"}>
            {(row.original.paymentStatus || "unpaid").replace("_", " ")}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: ({ row }) => {
          const st = row.original.status;
          const cls =
            STATUS_BADGE[st] ||
            (st === "canceled"
              ? "bg-red-100 text-red-700 ring-red-200"
              : "bg-zinc-100 text-zinc-700 ring-zinc-200");
          return (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ring-1 ${cls}`}
            >
              {st}
            </span>
          );
        },
      },
      {
        key: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
          <div className="text-xs text-zinc-500">
            <p>{formatDate(row.original.createdAt)}</p>
            <p className="text-[10px] opacity-70">{formatTime(row.original.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "deliveryDate",
        header: "Delivery",
        cell: ({ row }) =>
          row.original.deliveryDate
            ? formatDate(row.original.deliveryDate)
            : "—",
      },
      {
        key: "actions",
        header: "Actions",
        filter: false,
        cell: ({ row }) => (
          <div className="flex gap-4">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-[var(--sf-accent)] hover:underline"
              onClick={() =>
                navigate(`/orders/${row.original._id}?tab=details`)
              }
              title="View Details"
            >
              <Eye size={16} className="inline-block" />
            </button>

            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:underline"
              onClick={() => openOrderEdit(row.original)}
              title="Edit"
              disabled={!canManage}
            >
              <Pencil size={16} className="inline-block" />
            </button>

            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:underline"
              onClick={async () => {
                try {
                  await downloadOrderInvoicePdf(row.original._id);
                  toast.success("Invoice downloaded");
                } catch (e) {
                  toast.error(formatApiError(e));
                }
              }}
              title="Invoice PDF"
            >
              <FileCodeIcon size={16} className="inline-block" />
            </button>

            {canManage ? (
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
                onClick={() => openOrderDelete(row.original)}
                title="Delete"
              >
                <Trash2 size={16} className="inline-block" />
              </button>
            ) : null}
          </div>
        ),
      },
    ];
  }, [can, isAdmin, navigate]);

  const paymentsColumns = useMemo(() => {
    return [
      {
        key: "date",
        header: "Date",
        cell: ({ row }) => (
          <div className="text-xs text-zinc-500">
            <p>{formatDate(row.original.date)}</p>
            <p className="text-[10px] opacity-70">{formatTime(row.original.date)}</p>
          </div>
        ),
      },
      {
        key: "orderNumber",
        header: "Order",
        cell: ({ row }) => <span className="font-mono text-xs text-zinc-500">{row.original.orderNumber}</span>,
      },
      {
        key: "amount",
        header: "Amount",
        cell: ({ row }) => `Rs ${Number(row.original.amount ?? 0).toLocaleString()}`,
      },
    ];
  }, []);

  const measurementsColumns = useMemo(() => {
    return [
      { key: "label", header: "Label", cell: ({ row }) => row.original.label || "—" },
      {
        key: "summary",
        header: "Summary",
        cell: ({ row }) => getMeasurementSummary(row.original.values),
      },
      {
        key: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        key: "notes",
        header: "Notes",
        cell: ({ row }) =>
          row.original.values?.notes || row.original.notes || "—",
      },
    ];
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--sf-accent)] border-t-transparent" />
      </div>
    );
  }

  if (!customer) return null;

  const recentNotes = notes.slice(0, 5);
  const recentPayments = payments.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  const renderOverviewPanel = (panelId, dragHandleProps) => {
    if (panelId === "customerInfo") {
      return (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex cursor-grab items-center rounded-md border border-zinc-200 bg-white p-1 text-zinc-500 active:cursor-grabbing"
                  aria-label="Drag customer info panel"
                  title="Drag panel"
                  {...dragHandleProps}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs text-zinc-500">Customer Info</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="flex items-start gap-2 text-zinc-700">
                <MapPin className="mt-0.5 h-4 w-4 text-zinc-400" />
                <span>{customer.address || "No address"}</span>
              </p>
              <p className="flex items-start gap-2 text-zinc-700">
                <Mail className="mt-0.5 h-4 w-4 text-zinc-400" />
                <span>{customer.email || "No email"}</span>
              </p>
              <p className="text-zinc-700">{customer.notes || "No customer notes available"}</p>
            </div>
            <div className="text-xs text-zinc-500 pt-2 border-t">Created: {formatDate(customer.createdAt)}</div>
          </CardContent>
        </Card>
      );
    }

    if (panelId === "recentNotes") {
      return (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex cursor-grab items-center rounded-md border border-zinc-200 bg-white p-1 text-zinc-500 active:cursor-grabbing"
                  aria-label="Drag recent notes panel"
                  title="Drag panel"
                  {...dragHandleProps}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-medium">Recent Notes</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-medium underline underline-offset-2 text-zinc-600 hover:text-zinc-900"
                  onClick={() => handleTabChange("notes")}
                >
                  View all
                </button>
                <Button size="sm" variant="secondary" onClick={() => setNoteModalOpen(true)}>
                  Add Note
                </Button>
              </div>
            </div>
            <div className="space-y-3 h-[360px] overflow-y-auto pr-1">
              {notesLoading ? <p className="text-sm text-zinc-500">Loading notes...</p> : null}
              {!notesLoading && recentNotes.length === 0 ? <p className="text-sm text-zinc-500">No notes available</p> : null}
              {recentNotes.map((n) => (
                <div key={n._id} className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{n.subject}</p>
                    <button type="button" onClick={() => togglePin(n)} className="text-zinc-400 hover:text-zinc-700" aria-label={n.pinned ? "Unpin note" : "Pin note"}>
                      {n.pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="line-clamp-2 text-xs text-zinc-600">{n.note}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <Badge variant={n.priority === "high" ? "destructive" : "secondary"}>{n.priority}</Badge>
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (panelId === "recentPayments") {
      return (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex cursor-grab items-center rounded-md border border-zinc-200 bg-white p-1 text-zinc-500 active:cursor-grabbing"
                  aria-label="Drag recent payments panel"
                  title="Drag panel"
                  {...dragHandleProps}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-medium">Recent Payments</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs font-medium underline underline-offset-2 text-zinc-600 hover:text-zinc-900"
                  onClick={() => handleTabChange("payments")}
                >
                  View all
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {recentPayments.length === 0 ? <p className="text-sm text-zinc-500">No recent payments</p> : null}
              {recentPayments.map((p) => (
                <div key={p.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">{p.orderNumber}</p>
                  <p className="text-sm font-semibold text-zinc-900">Rs {Number(p.amount || 0).toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">{formatDate(p.date)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="inline-flex cursor-grab items-center rounded-md border border-zinc-200 bg-white p-1 text-zinc-500 active:cursor-grabbing"
                aria-label="Drag recent orders panel"
                title="Drag panel"
                {...dragHandleProps}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-medium">Recent Orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-xs font-medium underline underline-offset-2 text-zinc-600 hover:text-zinc-900"
                onClick={() => handleTabChange("orders")}
              >
                View all
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {recentOrders.length === 0 ? <p className="text-sm text-zinc-500">No recent orders</p> : null}
            {recentOrders.map((o) => (
              <div key={o._id} className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">{orderNumberFromId(o._id)}</p>
                <p className="text-sm font-semibold text-zinc-900">{o.status}</p>
                <p className="text-xs text-zinc-500">Rs {Number(o.price || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Button variant="outline" size="sm" onClick={() => navigate("/customers")} aria-label="Go back to customers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/customers">Customers</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customer.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[var(--sf-accent)]/10 flex items-center justify-center text-lg font-bold text-[var(--sf-accent)]">
              {customer.name?.charAt(0) || "C"}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{customer.name}</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <a href={`tel:${customer.phone}`}>{formatPhoneNumber(customer.phone)}</a>
                {customer.email && <span>• <a href={`mailto:${customer.email}`}>{customer.email}</a></span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => navigate(`/orders/new?customerId=${customer._id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" aria-label="Open customer actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(can("Orders", "manage") || isAdmin) && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setTimeout(() => setPaymentModalOpen(true), 0);
                    }}
                  >
                    Create Payment
                  </DropdownMenuItem>
                )}
                {(can("Customers", "delete") || isAdmin) && (
                  <DropdownMenuItem onClick={() => setDeleteCustomerOpen(true)} className="text-red-600 focus:text-red-600">
                    Delete Customer
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4 mb-2">
            <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Total Orders</p>
                <span className="text-2xl font-bold text-zinc-900">{orders.length}</span>
              </CardContent>
            </Card>
            <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Total Spent</p>
                <span className="text-2xl font-bold text-zinc-900">Rs {orders.reduce((a, o) => a + Number(o.price || 0), 0).toLocaleString()}</span>
              </CardContent>
            </Card>
            <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Remaining</p>
                <span className="text-2xl font-bold text-red-600">Rs {orders.reduce((a, o) => a + Number(o.remaining || 0), 0).toLocaleString()}</span>
              </CardContent>
            </Card>
            <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Measurements</p>
                <span className="text-2xl font-bold text-zinc-900">{measurements.length}</span>
              </CardContent>
            </Card>
          </div>

          <div className="mb-2 flex justify-end">
            <Select value={noteSort} onValueChange={setNoteSort}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DragDropContext onDragEnd={onOverviewDragEnd}>
            <div className="grid gap-4 md:grid-cols-2">
              {["left", "right"].map((columnId) => (
                <Droppable key={columnId} droppableId={columnId}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4 min-h-[200px]">
                      {overviewColumns[columnId].map((panelId, index) => (
                        <Draggable key={panelId} draggableId={panelId} index={index}>
                          {(dragProvided) => (
                            <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                              {renderOverviewPanel(panelId, dragProvided.dragHandleProps)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={noteSort} onValueChange={setNoteSort}>
                <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setNoteModalOpen(true)}>Add Note</Button>
            </div>
            <div className="space-y-3">
              {notesLoading ? <p className="text-sm text-zinc-500">Loading notes...</p> : null}
              {!notesLoading && notes.length === 0 ? <p className="text-sm text-zinc-500">No notes found.</p> : null}
              {notes.map((n) => (
                <div key={n._id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-900">{customer.name}</p>
                        <Badge variant="secondary">{n.priority}</Badge>
                        {n.pinned ? <Badge>Pinned</Badge> : null}
                      </div>
                      <p className="text-xs text-zinc-500">{formatDate(n.createdAt)}</p>
                      <p className="mt-2 text-sm text-zinc-700">{n.subject}</p>
                      <p className="mt-1 text-sm text-zinc-600">{n.note}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => togglePin(n)} className="text-xs text-zinc-500 hover:text-zinc-700">
                        {n.pinned ? "Unpin" : "Pin"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{p.orderNumber}</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">Rs {Number(p.amount || 0).toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(p.date)}</p>
              </div>
            ))}
            {!ordersLoading && payments.length === 0 ? <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 md:col-span-2 xl:col-span-3">No payments yet.</div> : null}
          </div>
        </TabsContent>

        <TabsContent value="measurements">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => navigate(`/measurements/editor?customerId=${customer._id}`)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Measurement
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {measurements.map((m) => (
              <div key={m._id} className="rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">{m.label || "Measurement Snapshot"}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(m.createdAt)}</p>
                <p className="mt-3 text-xs text-zinc-700">{getMeasurementSummary(m.values)}</p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedMeasurement(m);
                      setMeasurementModalOpen(true);
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
            {!measurementsLoading && measurements.length === 0 ? <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 md:col-span-2 xl:col-span-3">No measurements found.</div> : null}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="rounded-lg border bg-white p-4">
            <DataTable fixedHeight={false} columns={ordersColumns} rows={orders} isLoading={ordersLoading} emptyMessage="No orders" /> 
          </div>
        </TabsContent>
      </Tabs>

      <Modal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} title="Create Payment" description="Add payment against a pending order.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Order</Label>
            <Select value={paymentOrderId} onValueChange={setPaymentOrderId}>
              <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
              <SelectContent>
                {remainingOrderOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input label="Amount (Rs)" type="number" min="0" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
        </div>
        <ModalActions onCancel={() => setPaymentModalOpen(false)} onConfirm={handleAddPayment} confirmText={addingPayment ? "Saving..." : "Save payment"} cancelText="Cancel" confirmDisabled={addingPayment} />
      </Modal>

      <Modal open={noteModalOpen} onOpenChange={setNoteModalOpen} title="Add Note" description="Capture an important customer update.">
        <div className="space-y-4">
          <Input label="Subject" value={noteForm.subject} onChange={(e) => setNoteForm((s) => ({ ...s, subject: e.target.value }))} />
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={noteForm.priority} onValueChange={(v) => setNoteForm((s) => ({ ...s, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea rows={5} value={noteForm.note} onChange={(e) => setNoteForm((s) => ({ ...s, note: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" checked={noteForm.pinned} onChange={(e) => setNoteForm((s) => ({ ...s, pinned: e.target.checked }))} />Pin this note</label>
        </div>
        <ModalActions onCancel={() => setNoteModalOpen(false)} onConfirm={addNote} confirmText={addingNote ? "Saving..." : "Save note"} cancelText="Cancel" confirmDisabled={addingNote} />
      </Modal>

      <Modal
        open={measurementModalOpen}
        onOpenChange={setMeasurementModalOpen}
        contentClassName="max-w-[60vw] overflow-y-auto pr-1"
        title="Measurement Snapshot"
        description="Captured measurement details for this customer."
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-5">
          <div className="flex items-center justify-between gap-2">
            {selectedMeasurement?.label ? (
              <div className="rounded-md bg-zinc-50 p-2 text-xs font-medium text-zinc-600">
                Label: {selectedMeasurement.label}
              </div>
            ) : null}
            <div>
              <Button variant="secondary" size="sm" onClick={() => navigate(`/measurements/editor?edit=${selectedMeasurement._id}`)}>Edit</Button>
            </div>
          </div>

          {Object.entries(selectedMeasurement?.values || {}).filter(([, value]) => {
            if (value === null || value === undefined) return false;
            if (typeof value === "string") return value.trim() !== "";
            return true;
          }).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Object.entries(selectedMeasurement?.values || {})
                .filter(([, value]) => {
                  if (value === null || value === undefined) return false;
                  if (typeof value === "string") return value.trim() !== "";
                  return true;
                })
                .map(([key, value]) => (
                  <div key={key} className="rounded-md border border-zinc-100 bg-white p-2 shadow-sm">
                    <p className="text-[10px] font-medium uppercase text-zinc-400">
                      {MEASUREMENT_LABELS[key] || key}
                    </p>
                    <p className="text-sm font-semibold text-zinc-800">{String(value)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <AlertCircle size={24} className="mb-2 opacity-20" />
              <p className="text-xs text-center">No measurement details found.</p>
            </div>
          )}
        </div>
      </Modal>

      <DeleteModel
        title="Delete customer?"
        description={`Delete ${customer.name}. This action cannot be undone.`}
        open={deleteCustomerOpen}
        onOpenChange={setDeleteCustomerOpen}
        onDelete={handleDeleteCustomer}
        loading={deletingCustomer}
      />
    </div>
  );
}