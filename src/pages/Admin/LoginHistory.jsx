import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { formatApiError } from "../../utils/errors";
import { DataTable } from "@/components/DataTable";
import {
  History,
  Search,
  Trash2,
} from "lucide-react";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import Input from "@/components/ui/input";

export default function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginDateFilter, setLoginDateFilter] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/history");
      setHistory(data.data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((h) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      h.email.toLowerCase().includes(query) ||
      h.userId?.name?.toLowerCase().includes(query) ||
      h.ip.includes(searchQuery) ||
      h.city.toLowerCase().includes(query) ||
      h.country.toLowerCase().includes(query);

    if (!loginDateFilter) return matchesSearch;

    const loginDateValue = new Date(h.loginDate);
    const loginDateString = `${loginDateValue.getFullYear()}-${String(
      loginDateValue.getMonth() + 1
    ).padStart(2, "0")}-${String(loginDateValue.getDate()).padStart(2, "0")}`;
    return matchesSearch && loginDateString === loginDateFilter;
  });

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this login record?")) return;
    try {
      await api.delete(`/history/${id}`);
      toast.success("Login history deleted");
      fetchHistory();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const columns = [
    {
      id: "user",
      header: "User",
      meta: { label: "User" },
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-zinc-900">{row.original.userId?.name || "Unknown User"}</div>
          <div className="text-xs text-zinc-500">{row.original.email}</div>
        </div>
      ),
    },
    { accessorKey: "system", header: "System", meta: { label: "System" } },
    { accessorKey: "ip", header: "IP Address", meta: { label: "IP Address" } },
    {
      id: "location",
      header: "Location",
      meta: { label: "Location" },
      cell: ({ row }) => {
        const h = row.original;
        return `${h.city || ""}${h.city ? ", " : ""}${h.state || ""}${h.state ? ", " : ""}${h.country || "Unknown"}`;
      },
    },
    {
      accessorKey: "loginDate",
      header: "Login Date",
      meta: { label: "Login Date" },
      cell: ({ row }) =>
        new Date(row.original.loginDate).toLocaleString([], {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      id: "actions",
      header: "Actions",
      filter: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <History className="text-[var(--sf-accent)]" />
            Login History
          </h1>
          <p className="text-sm text-zinc-500 italic mt-0.5">Track user login activity, system details, and geo-location.</p>
        </div>
      </div>


      <div className="mt-8 flex flex-col p-4 gap-4 rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</Label>
          <InputGroup>
            <InputGroupInput
              type="text"
              placeholder="Filter by user, email, IP, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search size={20} className="text-zinc-400" />
            </InputGroupAddon>
          </InputGroup>
        </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Login Date</Label>
            <Input
              type="date"
              value={loginDateFilter}
              onChange={(e) => setLoginDateFilter(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filteredHistory}
          isLoading={loading}
          emptyMessage="No activity records match your search."
          fixedHeight={false}
        />
      </div>
    </div>
  );
}
