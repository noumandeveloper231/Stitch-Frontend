import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../api/client";
import { formatApiError } from "../utils/errors";
import { toast } from "sonner";
import Input from "./ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ customers: [], orders: [] });
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const runSearch = useCallback(async (term) => {
    if (!term) {
      setResults({ customers: [], orders: [] });
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/search", { params: { q: term, limit: 8 } });
      setResults(data.data);
    } catch (e) {
      toast.error(formatApiError(e));
      setResults({ customers: [], orders: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!debounced) {
      setResults({ customers: [], orders: [] });
      return;
    }
    runSearch(debounced);
  }, [debounced, runSearch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goCustomer = (c) => {
    setOpen(false);
    setQ("");
    navigate(`/customers?q=${encodeURIComponent(c.name || "")}`);
  };

  const goOrder = (o) => {
    setOpen(false);
    setQ("");
    navigate(`/orders?orderId=${o._id}`);
  };

  const hasResults =
    results.customers?.length > 0 || results.orders?.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full min-w-0 max-w-md">
      <div className="relative">
        <InputGroup>
          <InputGroupInput
            type="search"
            placeholder="Search customers & orders…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            className="w-full"  
            onFocus={() => setOpen(true)}
            aria-autocomplete="list"
            aria-expanded={open}
          />
          <InputGroupAddon>
            <Search className="h-4 w-4 text-zinc-400" />
          </InputGroupAddon>
        </InputGroup>
      </div>
      {open && (q.trim() || hasResults) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
          {loading && (
            <p className="px-3 py-2 text-xs text-zinc-500">Searching…</p>
          )}
          {!loading && debounced && !hasResults && (
            <p className="px-3 py-2 text-xs text-zinc-500">No matches.</p>
          )}
          {results.customers?.length > 0 && (
            <div className="px-2 pb-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Customers
              </p>
              {results.customers.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => goCustomer(c)}
                  className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">{c.name}</span>
                  <span className="text-xs text-zinc-500">{c.phone || c.email || ""}</span>
                </button>
              ))}
            </div>
          )}
          {results.orders?.length > 0 && (
            <div className="px-2">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Orders
              </p>
              {results.orders.map((o) => (
                <button
                  key={o._id}
                  type="button"
                  onClick={() => goOrder(o)}
                  className="flex w-full flex-col items-start rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">
                    {o.customerName || "Order"} · Rs {(o.totalAmount ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs capitalize text-zinc-500">{o.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
