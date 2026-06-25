import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LayoutDashboard, Ruler, ShoppingBag, Users } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";

const rootItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, module: "Dashboard" },
  { to: "/customers", label: "Customers", icon: Users, module: "Customers" },
  { to: "/contact-diary", label: "Contact Diary", icon: Users, module: "Contact Diary" },
  { to: "/measurements", label: "Measurements", icon: Ruler, module: "Measurements" },
];

const orderItems = [
  { to: "/orders", label: "All orders" },
  { to: "/orders/new", label: "Create order" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { can, isAdmin } = useAuth();
  const ordersOpen = pathname.startsWith("/orders");
  const isOrdersActive = pathname === "/orders" || pathname === "/orders/new";
  const visibleRootItems = rootItems.filter((item) => isAdmin || can(item.module, "show"));

  return (
    <UISidebar
      collapsible="icon"
      className="border-r border-zinc-200/80 bg-white shadow-sm"
      style={{ "--sidebar-width": "15rem" }}
    >
      <SidebarHeader className="px-3 py-3">
        <p className="truncate text-base font-semibold tracking-tight text-zinc-900">StitchFlow</p>
      </SidebarHeader>
      <SidebarContent className="px-1.5 pb-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wide text-zinc-500">
            Main
          </SidebarGroupLabel>
          <SidebarMenu>
            {visibleRootItems.map(({ to, label, icon: Icon, end }) => (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  asChild
                  tooltip={label}
                  isActive={end ? pathname === to : pathname.startsWith(to)}
                  className={cn(
                    "h-9 rounded-lg font-medium",
                    (end ? pathname === to : pathname.startsWith(to)) && "bg-zinc-900 text-white",
                  )}
                >
                  <NavLink to={to} end={end}>
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <SidebarMenuItem>
              <Collapsible defaultOpen={ordersOpen} className="group/collapsible">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Orders"
                    isActive={isOrdersActive}
                    className={cn(
                      "h-9 rounded-lg font-medium",
                      isOrdersActive && "bg-zinc-900 text-white",
                    )}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Orders</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {orderItems.map((item) => (
                      <SidebarMenuSubItem key={item.to}>
                        <SidebarMenuSubButton asChild isActive={pathname === item.to} className="rounded-md">
                          <NavLink to={item.to}>{item.label}</NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </UISidebar>
  );
}
