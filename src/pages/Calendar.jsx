import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "../api/client";
import { formatApiError } from "../utils/errors";
import PageHeader from "@/components/PageHeader";

export default function Calendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders", { params: { limit: 1000 } });
      const mappedEvents = data.data.map((order) => ({
        id: order._id,
        title: `#${order._id.slice(-6).toUpperCase()} - ${order.customerId?.name || "Unknown"}`,
        start: order.deliveryDate || order.createdAt,
        allDay: true,
        backgroundColor: "rgba(24, 24, 27, 0.05)",
        borderColor: "#18181b",
        textColor: "#18181b",
        extendedProps: { ...order }
      }));
      setEvents(mappedEvents);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleEventClick = (info) => {
    navigate(`/orders/${info.event.id}?tab=details`);
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Calendar" 
        description="View and manage order delivery deadlines and production schedule."
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth"
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={true}
            nowIndicator={true}
            buttonText={{
              today: "Today",
              month: "Month",
              week: "Week",
              day: "Day",
              list: "List"
            }}
            eventClassNames="cursor-pointer border-l-4 transition-all hover:brightness-95"
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --fc-button-bg-color: transparent;
          --fc-button-border-color: #e4e4e7;
          --fc-button-hover-bg-color: #f4f4f5;
          --fc-button-hover-border-color: #d4d4d8;
          --fc-button-active-bg-color: #18181b;
          --fc-button-active-border-color: #18181b;
          --fc-button-text-color: #3f3f46;
          --fc-button-active-text-color: #ffffff;
          --fc-border-color: #e4e4e7;
          --fc-today-bg-color: #f9fafb;
        }

        .calendar-container .fc-toolbar-title {
          font-size: 1.125rem !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
          color: #18181b !important;
        }

        .calendar-container .fc-button {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem !important;
          box-shadow: none !important;
          transition: all 0.2s !important;
        }

        .calendar-container .fc-button-primary:not(:disabled).fc-button-active,
        .calendar-container .fc-button-primary:not(:disabled):active {
          background-color: #18181b !important;
          border-color: #18181b !important;
          color: white !important;
        }

        .calendar-container .fc-button-primary:disabled {
          background-color: transparent !important;
          border-color: #e4e4e7 !important;
          color: #a1a1aa !important;
        }

        .calendar-container .fc-col-header-cell {
          background-color: #f9fafb !important;
          padding: 12px 0 !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #4b5563 !important;
          border-bottom: 1px solid #e5e7eb !important;
        }

        .calendar-container .fc-daygrid-day-number {
          font-size: 0.875rem !important;
          padding: 8px !important;
          color: #4b5563 !important;
        }

        .calendar-container .fc-event {
          padding: 2px 4px !important;
          font-size: 0.75rem !important;
          border-radius: 4px !important;
          margin-bottom: 2px !important;
        }

        .calendar-container .fc-list-day-cushion {
          background-color: #f3f4f6 !important;
        }

        .calendar-container .fc-list-event:hover td {
          background-color: #f9fafb !important;
        }

        .calendar-container .fc-theme-standard td, 
        .calendar-container .fc-theme-standard th {
          border-color: #f3f4f6 !important;
        }

        .calendar-container .fc-day-today {
          background-color: #f9fafb !important;
        }
      `}} />
    </div>
  );
}
