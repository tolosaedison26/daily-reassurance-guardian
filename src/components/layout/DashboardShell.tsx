import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Home, Users, Settings, LogOut, Shield, HelpCircle, Briefcase } from "lucide-react";
import DashboardGuide from "@/components/DashboardGuide";

const navItems = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/services", label: "Services", icon: Briefcase },
  { path: "/contacts", label: "Contacts", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [showGuide, setShowGuide] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Sticky top bar with sign out */}
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 flex items-center justify-between h-12">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-black text-primary">Daily Guardian</span>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors min-h-[44px] px-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive(item.path) ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[52px] transition-colors"
                style={{ color: isActive(item.path) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] font-bold">{item.label}</span>
              </button>
            ))}
            <button
              onClick={() => setShowGuide(true)}
              aria-label="Help"
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[52px] transition-colors"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-bold">Help</span>
            </button>
          </div>
        </nav>

        {showGuide && <DashboardGuide onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  // Desktop: sidebar + content
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-card border-r border-border flex flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-black tracking-tight text-primary">Daily Guardian</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive(item.path) ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-colors min-h-[52px] ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </button>
          ))}

          {/* Help / Guide */}
          <button
            onClick={() => setShowGuide(true)}
            aria-label="Help"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[52px]"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
            Help
          </button>
        </nav>

        {/* Sign out — sticky at bottom of sidebar */}
        <div className="px-3 pb-6">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors min-h-[52px]"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {showGuide && <DashboardGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
