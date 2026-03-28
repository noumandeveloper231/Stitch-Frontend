import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-900">{title}</h1>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <GlobalSearch />
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-900">{user?.name}</p>
              <p className="text-xs capitalize text-zinc-500">{user?.role}</p>
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
