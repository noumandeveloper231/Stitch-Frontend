import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const titles = {
  "/": "Dashboard",
  "/customers": "Customers",
  "/orders": "Orders",
  "/orders/new": "Create order",
  "/measurements": "Measurements",
};

function titleFromPath(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/orders")) return "Orders";
  return "Stitch";
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem("sf_sidebar_collapsed") === "1",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    localStorage.setItem("sf_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--sf-bg)]">
      <div
        className={`fixed inset-0 z-30 bg-zinc-900/40 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-40 md:static md:z-0 md:flex transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={titleFromPath(pathname)}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 transition-[padding] duration-200 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
