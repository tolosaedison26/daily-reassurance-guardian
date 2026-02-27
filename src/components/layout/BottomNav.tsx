import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Seniors", icon: Users, path: "/seniors" },
  { label: "Reports", icon: BarChart2, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card border-t border-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
          >
            <item.icon className="w-5 h-5" />
            <span className={cn("text-[11px] font-semibold", active && "font-bold")}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
