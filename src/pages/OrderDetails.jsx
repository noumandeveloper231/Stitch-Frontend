import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, downloadOrderInvoicePdf } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Input from "@/components/ui/input";
import Modal, { ModalActions } from "@/components/ui/modal";
import { formatApiError } from "../utils/errors";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Download, 
  Plus, 
  History, 
  Receipt, 
  User, 
  Phone, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign
} from "lucide-react";

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

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [addingPayment, setAddingPayment] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editingCosts, setEditingCosts] = useState(false);
  const [costForm, setCostForm] = useState([]);
  const [savingCosts, setSavingCosts] = useState(false);

  const activeTab = searchParams.get("tab") || "details";

  const onTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);
      setCostForm(data.data.items || []);
    } catch (e) {
      toast.error(formatApiError(e));
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSaveCosts = async () => {
    const filteredItems = costForm
      .filter((it) => it.name.trim() !== "")
      .map((it) => ({ name: it.name.trim(), cost: parseFloat(it.cost) || 0 }));

    setSavingCosts(true);
    try {
      await api.put(`/orders/${id}`, { items: filteredItems });
      toast.success("Costs updated");
      setEditingCosts(false);
      fetchOrder();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSavingCosts(false);
    }
  };

  const addCostItem = () => {
    setCostForm([...costForm, { name: "", cost: "" }]);
  };

  const removeCostItem = (index) => {
    setCostForm(costForm.filter((_, i) => i !== index));
  };

  const updateCostItem = (index, field, value) => {
    const next = [...costForm];
    next[index] = { ...next[index], [field]: value };
    setCostForm(next);
  };

  const loadDefaultCosts = () => {
    const defaults = [
      { name: "Cutting", cost: "" },
      { name: "Button", cost: "" },
      { name: "Collar", cost: "" },
      { name: "Nulki", cost: "" },
      { name: "Kameez", cost: "" },
      { name: "Shalwar", cost: "" },
    ];
    // Keep existing items if any, but append defaults or just replace?
    // Usually, users want to quickly populate if empty.
    if (costForm.length === 0 || window.confirm("This will add default cost items. Continue?")) {
      setCostForm([...costForm, ...defaults]);
    }
  };

  const handleAddPayment = async (amountToPay) => {
    const amount = parseFloat(amountToPay || paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }
    if (amount > order.remaining) {
      toast.error("Payment amount cannot exceed remaining balance");
      return;
    }

    setAddingPayment(true);
    try {
      await api.post(`/orders/${id}/payment`, { amount });
      toast.success("Payment added successfully");
      setPaymentModalOpen(false);
      setPaymentAmount("");
      fetchOrder();
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadOrderInvoicePdf(id);
      toast.success("Invoice downloaded");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--sf-accent)] border-t-transparent"></div>
      </div>
    );
  }

  if (!order) return null;

  const measurementEntries = Object.entries(order.measurementSnapshot?.values || {}).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <PageHeader 
          title={`Order #${id.slice(-6).toUpperCase()}`} 
          description="View order details, cost breakdown, and payment history."
        />
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={handleDownloadPdf} loading={pdfLoading}>
            <Download className="mr-2 h-4 w-4" /> Invoice
          </Button>
          {order.remaining > 0 && (
            <Button onClick={() => setPaymentModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Total Pricing</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">Rs {order.price.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="text-[10px] px-1.5 py-0" status={order.paymentStatus || "unpaid"}>
                {(order.paymentStatus || "unpaid").replace("_", " ")}
              </Badge>
              <span className="text-[10px] text-zinc-400">Payment Status</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Total Costs</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900">Rs {order.totalCost.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-500">
                {order.items?.length || 0} production items
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-zinc-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Net Profit</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {order.profit.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-500">
                {((order.profit / (order.price || 1)) * 100).toFixed(1)}% margin
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Details
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Costs
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-lg font-semibold text-zinc-900">
                  <User className="mr-2 h-4 w-4 text-zinc-400" />
                  {order.customerId?.name}
                </div>
                <div className="flex items-center text-sm text-zinc-600">
                  <Phone className="mr-2 h-4 w-4 text-zinc-400" />
                  {order.customerId?.phone}
                </div>
                {order.customerId?.email && (
                  <p className="text-sm text-zinc-500 ml-6">{order.customerId.email}</p>
                )}
                {order.customerId?.address && (
                  <p className="text-sm text-zinc-500 ml-6">{order.customerId.address}</p>
                )}
                <div className="mt-4 flex items-center pt-2 border-t border-zinc-50">
                  <Badge className="capitalize text-xs" status={order.status}>
                    {order.status}
                  </Badge>
                  {order.deliveryDate && (
                    <div className="ml-auto flex items-center text-xs text-zinc-500">
                      <Calendar className="mr-1 h-3 w-3" />
                      Due: {new Date(order.deliveryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Measurement Snapshot</CardTitle>
                <p className="text-xs text-zinc-500">Snapshot taken at order creation</p>
              </CardHeader>
              <CardContent>
                {measurementEntries.length > 0 ? (
                  <div className="space-y-4">
                    {order.measurementSnapshot.label && (
                      <div className="rounded-md bg-zinc-50 p-2 text-xs font-medium text-zinc-600">
                        Label: {order.measurementSnapshot.label}
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {measurementEntries.map(([key, value]) => (
                        <div key={key} className="rounded-md border border-zinc-100 bg-white p-2 shadow-sm">
                          <p className="text-[10px] font-medium uppercase text-zinc-400">
                            {MEASUREMENT_LABELS[key] || key}
                          </p>
                          <p className="text-sm font-semibold text-zinc-800">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                    <AlertCircle size={24} className="mb-2 opacity-20" />
                    <p className="text-xs text-center">No measurement snapshot<br/>attached to this order.</p>
                  </div>
                )}
                {order.notes && (
                  <div className="mt-6 border-t border-zinc-100 pt-4">
                    <p className="text-xs font-medium uppercase text-zinc-400 mb-2">Order Notes</p>
                    <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-md italic">
                      "{order.notes}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base flex items-center">
                <Receipt className="mr-2 h-4 w-4 text-zinc-400" /> Cost Breakdown
              </CardTitle>
              {!editingCosts ? (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingCosts(true);
                  if (order.items?.length === 0) {
                    setCostForm([
                      { name: "Cutting", cost: "" },
                      { name: "Button", cost: "" },
                      { name: "Collar", cost: "" },
                      { name: "Nulki", cost: "" },
                      { name: "Kameez", cost: "" },
                      { name: "Shalwar", cost: "" },
                    ]);
                  }
                }}>
                  Edit Costs
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => {
                    setEditingCosts(false);
                    setCostForm(order.items || []);
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveCosts} loading={savingCosts}>
                    Save Changes
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editingCosts && (
                <div className="mb-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={loadDefaultCosts} className="text-xs">
                    Load Default Items
                  </Button>
                </div>
              )}
              {!editingCosts ? (
                <div className="rounded-lg border border-zinc-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Item</th>
                        <th className="px-4 py-2 text-right font-medium">Cost (Rs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {order.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-2 text-zinc-700">{item.name}</td>
                          <td className="px-4 py-2 text-right text-zinc-900 font-medium">{item.cost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50/50 font-semibold">
                      <tr>
                        <td className="px-4 py-2 text-zinc-600">Total Production Cost</td>
                        <td className="px-4 py-2 text-right text-zinc-900">{order.totalCost.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                    {costForm.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex-1">
                          <input
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateCostItem(idx, "name", e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <input
                            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                            type="number"
                            placeholder="Cost"
                            value={item.cost}
                            onChange={(e) => updateCostItem(idx, "cost", e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCostItem(idx)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" className="w-full border-dashed border-2" onClick={addCostItem}>
                      + Add Item
                    </Button>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
                      <span className="text-sm font-medium text-zinc-600">New Total Cost:</span>
                      <span className="text-lg font-bold text-zinc-900">
                        Rs {costForm.reduce((sum, it) => sum + (parseFloat(it.cost) || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-600">Customer Price:</span>
                    <span className="text-lg font-semibold text-zinc-900">Rs {order.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-600">Total Paid:</span>
                    <span className="text-lg font-semibold text-green-600">Rs {order.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-700">Remaining:</span>
                    <span className={`text-2xl font-bold ${order.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Rs {order.remaining.toLocaleString()}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="border-t border-zinc-100 pt-3 flex justify-between items-center">
                      <span className="text-sm text-zinc-500 italic">Profit:</span>
                      <span className="text-sm font-medium text-zinc-500 italic">Rs {order.profit.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <History className="mr-2 h-4 w-4 text-zinc-400" /> Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.payments?.length > 0 ? (
                  <div className="space-y-3">
                    {order.payments.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-zinc-100 p-3 text-sm shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">Payment Received</p>
                            <p className="text-xs text-zinc-500">{new Date(p.date).toLocaleDateString()} at {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-900">Rs {p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-zinc-500">
                    <Clock size={24} className="mb-2 opacity-20" />
                    <p className="text-sm">No payments recorded yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Add Payment"
        footer={
          <ModalActions
            onCancel={() => setPaymentModalOpen(false)}
            onConfirm={() => handleAddPayment()}
            loading={addingPayment}
            confirmLabel="Record Payment"
          />
        }
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-md bg-zinc-50 p-3 text-sm flex justify-between items-center">
            <span className="text-zinc-600">Remaining Balance:</span>
            <span className="font-bold text-red-600">Rs {order.remaining.toLocaleString()}</span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick Pay</Label>
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  disabled={addingPayment || amt > order.remaining}
                  onClick={() => handleAddPayment(amt)}
                  className="flex-1 border-zinc-200 hover:bg-zinc-50"
                >
                  Rs {amt}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={addingPayment || order.remaining <= 0}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to mark this order as complete by paying the full remaining balance of Rs ${order.remaining.toLocaleString()}?`)) {
                    handleAddPayment(order.remaining);
                  }
                }}
                className="flex-[2] border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                Mark as Complete
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-400">Or enter amount</span>
            </div>
          </div>

          <Input
            label="Custom Amount (Rs)"
            type="number"
            min="0.01"
            max={order.remaining}
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Enter amount..."
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
