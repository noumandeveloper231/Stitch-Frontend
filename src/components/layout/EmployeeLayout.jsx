import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";
import { useEmployeeAuth } from "@/context/EmployeeAuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const titles = {
  "/employee/dashboard": "Employee Dashboard",
};

function titleFromPath(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/employee")) return "Employee Panel";
  return "Employee";
}

export default function EmployeeLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-[var(--sf-bg)] lg:flex">
      <aside className="sticky top-0 z-40 h-screen self-start bg-white overflow-y-auto">
        <EmployeeSidebar
          mobileOpen={mobileSidebarOpen}
          onOpen={() => setMobileSidebarOpen(true)}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </aside>

      <div className="min-w-0 flex-1 lg:ml-0 flex flex-col">
        <header className="border-b border-zinc-200 bg-white">
          <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900">
              {titleFromPath(pathname)}
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900">
                  {employee?.firstName} {employee?.lastName}
                </p>
                <p className="text-xs capitalize text-zinc-500">Employee</p>
              </div>
              <Button
                variant="ghost"
                className="!px-2"
                onClick={async () => {
                  await logout();
                  navigate("/employee/login");
                }}
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-5 md:px-6 md:py-6 lg:px-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
