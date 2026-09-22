import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { type SidebarNavItem } from "@/components/AppSidebar";
import { LayoutDashboard, Search, ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";

export const ngoSidebarNav: SidebarNavItem[] = [
  { to: "/ngo/dashboard", label: "Dashboard",         icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/ngo/explore",   label: "Explore Donations", icon: <Search className="h-4 w-4" /> },
  { to: "/ngo/claims",    label: "My Claims",          icon: <ClipboardList className="h-4 w-4" /> },
];

export const Route = createFileRoute("/ngo")({
  beforeLoad: ({ context }) => requireRole("ngo", context.auth),
  component: NgoLayout,
});

function NgoLayout() {
  return (
    <DashboardLayout nav={ngoSidebarNav}>
      <Outlet />
    </DashboardLayout>
  );
}
