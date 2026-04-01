import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import Navbar from "./Navbar";

const titles = {
  "/": "Dashboard",
  "/customers": "Customers",
  "/calendar": "Calendar",
  "/orders": "Orders",
  "/orders/kanban": "Order Kanban",
  "/orders/new": "Create order",
  "/measurements": "Measurements",
  "/measurements/new": "Add measurement",
  "/admin/email-templates": "Email Templates",
};

function titleFromPath(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/measurements")) return "Measurements";
  return "Stitch";
}

export default function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[var(--sf-bg)] lg:flex">
      <aside className="sticky top-0 z-40 h-screen self-start bg-white">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onOpen={() => setMobileSidebarOpen(true)}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </aside>

      <div className="min-w-0 flex-1 lg:ml-0">
        <Navbar title={titleFromPath(pathname)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 md:px-6 md:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
