import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  User, 
  Calendar, 
  Clock, 
  MoreVertical, 
  ShoppingBag,
  Loader2,
  GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { api } from "../api/client";
import { ORDER_STATUSES } from "../config/constants";
import { formatApiError } from "../utils/errors";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

export default function OrderKanban() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders", { params: { limit: 1000 } });
      setOrders(data.data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside or no change
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const orderId = draggableId;
    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Optimistic update
    const previousOrders = [...orders];
    setOrders((prev) => 
      prev.map((order) => 
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setUpdatingId(orderId);

    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order #${orderId.slice(-6).toUpperCase()} moved to ${newStatus}`);
    } catch (e) {
      // Revert on error
      setOrders(previousOrders);
      toast.error(`Failed to move order: ${formatApiError(e)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Group orders by status
  const groupedOrders = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status);
    return acc;
  }, {});

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Order Kanban" 
        description="Visual overview of orders across different production stages. Drag and drop to update status."
      />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-6 min-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent px-1 max-h-[80vh]">
          {ORDER_STATUSES.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex w-[320px] shrink-0 flex-col rounded-xl bg-zinc-100/80 p-3 border transition-colors duration-300 ease-in-out",
                    snapshot.isDraggingOver ? "bg-zinc-200/80 border-[var(--sf-accent)]/30 ring-2 ring-[var(--sf-accent)]/10" : "border-zinc-200/50"
                  )}
                >
                  <div className="mb-4 flex items-center justify-between px-2">
                    <h3 className="text-[13px] font-bold capitalize text-zinc-900">
                      {status.replace("_", " ")} ({groupedOrders[status]?.length || 0})
                    </h3>
                    <button className="text-zinc-400 hover:text-zinc-600">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar min-h-[100px]">
                    {groupedOrders[status]?.map((order, index) => (
                      <Draggable key={order._id} draggableId={order._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "group relative flex flex-col gap-3 rounded-xl border border-zinc-200/60 bg-white p-4 shadow-sm transition-all duration-300 ease-in-out cursor-default",
                              snapshot.isDragging ? "shadow-xl border-[var(--sf-accent)] ring-2 ring-[var(--sf-accent)]/20 scale-[1.02] z-50" : "hover:border-[var(--sf-accent)] hover:shadow-md",
                              updatingId === order._id && "opacity-50 pointer-events-none"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500">
                                  <GripVertical size={14} />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-zinc-900">
                                  #{order._id.slice(-6).toUpperCase()}
                                </span>
                              </div>
                              {updatingId === order._id && (
                                <Loader2 size={12} className="animate-spin text-[var(--sf-accent)]" />
                              )}
                            </div>

                            <div 
                              className="space-y-2.5 cursor-pointer"
                              onClick={() => navigate(`/orders/${order._id}?tab=details`)}
                            >
                              <div className="flex items-center gap-2.5 text-[12px] text-zinc-600">
                                <User size={14} className="text-zinc-400 shrink-0" />
                                <span className="truncate">
                                  Customer : <span className="text-zinc-900 font-medium">{order.customerId?.name || "Unknown"}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 text-[12px] text-zinc-600">
                                <Calendar size={14} className="text-zinc-400 shrink-0" />
                                <span className="truncate">
                                  Order Date : <span className="text-zinc-900 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 text-[12px] text-zinc-600">
                                <Clock size={14} className="text-zinc-400 shrink-0" />
                                <span className="truncate">
                                  Deadline date : <span className={order.deliveryDate ? "text-zinc-900 font-medium" : "text-zinc-400 italic font-normal"}>
                                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not set"}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {order.items?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                <div className="flex items-center gap-1.5 rounded-full bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-500 border border-zinc-100">
                                  <ShoppingBag size={10} className="shrink-0" />
                                  {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {!snapshot.isDraggingOver && groupedOrders[status]?.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 py-10 transition-colors duration-300">
                        <p className="text-xs text-zinc-400">No orders</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}} />
    </div>
  );
}
