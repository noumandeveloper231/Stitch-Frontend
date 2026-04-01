import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  ChevronDown, 
  Mail,
  LayoutDashboard, 
  Menu, 
  Ruler, 
  ShoppingBag, 
  Users, 
  X, 
  Shield, 
  History, 
  UserCog 
} from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";

const navSections = [
  {
    key: "main",
    header: "Main",
    items: [
      { key: "dashboard", to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { key: "customers", to: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    key: "modules",
    header: "Modules",
    items: [
      { key: "calendar", to: "/calendar", label: "Calendar", icon: CalendarIcon },
      {
        key: "measurements", to: "/measurements", label: "Measurements", icon: Ruler, subItems: [
          { key: "all-measurements", to: "/measurements", label: "All Measurements", end: true },
          { key: "create-measurement", to: "/measurements/new", label: "Create Measurement" },
        ]
      },
      {
        key: "orders",
        label: "Orders",
        icon: ShoppingBag,
        subItems: [
          { key: "all-orders", to: "/orders", label: "All Orders", end: true },
          { key: "order-kanban", to: "/orders/kanban", label: "Order Kanban" },
          { key: "create-order", to: "/orders/new", label: "Create Order" },
        ],
      },
    ],
  },
  {
    key: "admin",
    header: "Administration",
    // adminOnly: true,
    items: [
      { 
        key: "user-management", 
        label: "User Management", 
        icon: UserCog,
        subItems: [
          { key: "users", to: "/admin/users", label: "All Users" },
          { key: "roles", to: "/admin/roles", label: "Role Permissions" },
          { key: "history", to: "/admin/history", label: "Login History" },
          { key: "email-templates", to: "/admin/email-templates", label: "Email Templates", icon: Mail },
        ],
      },
    ],
  },
];

export default function AppSidebar({ mobileOpen, onClose, onOpen }) {
  const { pathname } = useLocation();
  const { can } = useAuth();
  const [expanded, setExpanded] = useState(() => ({ 
    orders: pathname.startsWith("/orders"),
    measurements: pathname.startsWith("/measurements"),
    "user-management": pathname.startsWith("/admin")
  }));

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

      <aside className={asideClass} aria-label="Sidebar">
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
          {navSections
            .filter((section) => !section.adminOnly || can("Roles", "show"))
            .map((section, sectionIndex) => (
              <div key={section.key} className={sectionIndex > 0 ? "mt-2 pt-4" : ""}>
                <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {section.header}
                </p>
                <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  if (!item.subItems) {
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
                  }

                  const isGroupActive = item.subItems.some((subItem) => pathname === subItem.to);
                  const isOpen = expanded[item.key];

                  return (
                    <li key={item.key} className="">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isGroupActive
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                      </button>

                      {isOpen ? (
                        <ul className="mt-1 ml-4.5 space-y-1 border-l border-zinc-200 pl-4">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.to}>
                              <NavLink
                                to={subItem.to}
                                end={subItem.end}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  cn(
                                    "block rounded-md px-3 py-1.5 text-sm",
                                    isActive
                                      ? "bg-zinc-100 font-medium text-zinc-900"
                                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                                  )
                                }
                              >
                                {subItem.label}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
