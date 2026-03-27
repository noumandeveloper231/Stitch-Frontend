import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  PlusCircle,
  Ruler,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/orders/new", label: "New order", icon: PlusCircle },
  { to: "/measurements", label: "Measurements", icon: Ruler },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ease-out md:relative ${collapsed ? "w-[72px]" : "w-56"}`}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-zinc-100 px-3">
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight text-zinc-900">
            Stitch
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              } ${collapsed ? "justify-center px-2" : ""}`
            }
          >
            <Icon className="h-5 w-5 shrink-0 opacity-90" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
