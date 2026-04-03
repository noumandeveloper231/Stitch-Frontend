import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { api } from "../api/client";
import { formatApiError } from "../utils/errors";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatCreatedAt(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function ContactDiary() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/customers", {
          params: { page: 1, limit: 12, sort: "createdAt", order: "desc" },
        });
        if (!cancelled) {
          setCustomers(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (e) {
        if (!cancelled) toast.error(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Diary"
        description="Quickly view recent customers and their contact notes."
      />

      {loading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--sf-accent)] border-t-transparent" />
        </div>
      ) : customers.length === 0 ? (
        <p className="text-sm text-zinc-500">No customers found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((c) => (
            <Card
            key={c._id}
            className="relative flex min-h-[220px] flex-col rounded-2xl border border-zinc-200 bg-[#fafafa]! shadow-none! px-6 py-10 hover:border-black"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="truncate text-[22px] font-semibold text-zinc-900">
                  {c.name || "Unnamed"}
                </p>
                {c.email && (
                  <p className="mt-1 truncate text-[14px] text-zinc-500">
                    {c.email}
                  </p>
                )}
              </div>
          
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
          
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(`/customers/${c._id}`)}
                  >
                    View details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          
            {/* Content */}
            <CardContent className="mt-6 flex flex-1 flex-col justify-between p-0!">
              {/* Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium text-zinc-500">
                    Contact Number
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-zinc-900">
                    {c.phone ? formatPhoneNumber(c.phone) : "—"}
                  </p>
                </div>
          
                <div>
                  <p className="text-[12px] font-medium text-zinc-500">
                    Created Date
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-zinc-900">
                    {formatCreatedAt(c.createdAt)}
                  </p>
                </div>
              </div>
          
              {/* Subject */}
              <div className="mt-6">
                <p className="text-[12px] font-medium text-zinc-500">
                  Notes
                </p>
                <p className="mt-1 line-clamp-2 text-[15px] font-medium text-zinc-900">
                  {c.notes || "No notes added yet."}
                </p>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}

