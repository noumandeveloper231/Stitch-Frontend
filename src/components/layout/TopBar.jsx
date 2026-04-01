import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import GlobalSearch from "../GlobalSearch";
import NotificationBell from "../NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function TopBar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 px-3 py-2 backdrop-blur md:px-4 md:py-3 lg:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          <SidebarTrigger className="h-9 w-9 rounded-lg" />
          <h1 className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 md:text-lg">
            {title}
          </h1>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 md:max-w-2xl md:flex-initial lg:max-w-xl">
          <GlobalSearch />
          <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-zinc-900">{user?.name}</p>
              <p className="text-xs capitalize text-zinc-500">{user?.role?.title || user?.role}</p>
            </div>
            <Button
              variant="ghost"
              className="!px-2"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
