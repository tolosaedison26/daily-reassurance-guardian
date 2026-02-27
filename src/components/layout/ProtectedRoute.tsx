import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <span className="text-6xl animate-float">☀️</span>
        <div className="text-center">
          <h1 className="text-2xl font-black" style={{ color: "hsl(var(--primary))" }}>
            Daily Guardian
          </h1>
          <p className="text-muted-foreground text-sm mt-1 animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
