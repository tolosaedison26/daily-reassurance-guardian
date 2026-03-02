import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import AvatarCircle from "@/components/ui/AvatarCircle";

interface TopHeaderProps {
  pageTitle?: string;
  alertCount?: number;
}

export default function TopHeader({ pageTitle, alertCount = 0 }: TopHeaderProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className={cn(
      "sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shrink-0 flex items-center justify-between px-4 sm:px-6",
      isMobile ? "h-14" : "h-16"
    )}>
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        {isMobile ? (
          <>
            <span className="text-lg">☀️</span>
            <span className="text-sm font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>
              Daily Guardian
            </span>
          </>
        ) : (
          <h1 className="text-lg font-bold truncate">{pageTitle || "Dashboard"}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors relative"
            aria-label={`Notifications${alertCount > 0 ? `, ${alertCount} unread` : ""}`}
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {alertCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "hsl(var(--status-alert))" }}
              />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">Notifications</p>
                <button className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button>
              </div>
              <div className="text-sm text-muted-foreground text-center py-4">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* User avatar menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 rounded-full hover:bg-muted transition-colors p-1 pr-2"
            aria-label="User menu"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
            >
              {initials}
            </div>
            {!isMobile && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg py-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              {/* User info */}
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-bold truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => { setShowUserMenu(false); navigate("/settings"); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Account Settings
              </button>

              <div className="border-t border-border my-1" />

              <button
                onClick={() => { setShowUserMenu(false); signOut(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
