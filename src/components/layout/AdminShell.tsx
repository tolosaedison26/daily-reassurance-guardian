import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  Users,
  Phone,
  LogOut,
  Shield,
} from "lucide-react";

const adminNav = [
  { path: "/admin", label: "Overview", icon: LayoutDashboard },
  { path: "/admin/seniors", label: "Seniors", icon: Users },
  { path: "/admin/contacts", label: "Emergency Contacts", icon: Phone },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 flex items-center justify-between h-12">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-black text-primary">DG Admin</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors min-h-[44px] px-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-20">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {adminNav.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[52px] transition-colors cursor-pointer"
                style={{
                  color: isActive(item.path)
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[11px] font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="px-6 py-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-primary leading-tight">
              Daily Guardian
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Admin Console
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {adminNav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors min-h-[52px] cursor-pointer ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-6">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors min-h-[52px] cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
