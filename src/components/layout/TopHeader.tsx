import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  pageTitle?: string;
  alertCount?: number;
}

export default function TopHeader({ pageTitle, alertCount = 0 }: TopHeaderProps) {
  const isMobile = useIsMobile();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
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

      {/* Right — bell only */}
      <div className="flex items-center">
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
      </div>
    </header>
  );
}
