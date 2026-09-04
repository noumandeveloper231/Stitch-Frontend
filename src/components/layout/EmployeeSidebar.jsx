import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Menu,
  User,
  X,
} from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import { cn } from "@/lib/utils";

const navItems = [
  {
    key: "dashboard",
    to: "/employee/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    key: "profile",
    to: "/employee/profile",
    label: "Profile",
    icon: User,
  },
];

export default function EmployeeSidebar({ mobileOpen, onClose, onOpen }) {
  const { pathname } = useLocation();

  const asideClass = cn(
    "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0",
    mobileOpen ? "translate-x-0" : "-translate-x-full",
  );

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed left-3 top-3 z-30 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 bg-zinc-900/40 lg:hidden" onClick={onClose} aria-hidden />
      ) : null}

      <aside className={asideClass} aria-label="Employee sidebar">
        <div className="flex items-center justify-between lg:block">
          <SidebarHeader />
          <button
            type="button"
            onClick={onClose}
            className="mr-3 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Employee
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
