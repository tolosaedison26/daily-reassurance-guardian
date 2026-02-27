import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, BarChart2, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Seniors", icon: Users, path: "/seniors" },
  { label: "Reports", icon: BarChart2, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col border-r border-border bg-card shrink-0 transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("h-16 flex items-center gap-2 px-4 border-b border-border shrink-0", collapsed && "justify-center px-0")}>
        <span className="text-xl">☀️</span>
        {!collapsed && (
          <span className="text-base font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>
            Daily Guardian
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const btn = (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-sm font-semibold transition-colors relative",
                collapsed ? "justify-center h-11 w-11 mx-auto" : "px-3 h-11",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary" />
              )}
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }
          return btn;
        })}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-border p-3 shrink-0", collapsed && "flex flex-col items-center")}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role || ""}</p>
            </div>
          )}
        </div>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                className="mt-2 w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={signOut}
            className="mt-2 w-full flex items-center gap-2 px-3 h-9 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
