import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  pageTitle?: string;
}

export default function TopHeader({ pageTitle }: TopHeaderProps) {
  const { profile, user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
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
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
            aria-label="User menu"
          >
            {initials}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-bold truncate">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { navigate("/settings"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Account Settings
                </button>
              </div>
              <div className="border-t border-border p-1">
                <button
                  onClick={() => { signOut(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
