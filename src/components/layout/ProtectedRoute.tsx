import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "senior" | "caregiver";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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
    // Redirect to login with ?redirect= so user returns after auth
    const redirectParam = location.pathname !== "/" ? `?redirect=${encodeURIComponent(location.pathname)}` : "";
    return <Navigate to={`/login${redirectParam}`} replace />;
  }

  // Role-based redirect: send seniors to /home, caregivers to /dashboard
  if (requiredRole && profile.role !== requiredRole) {
    const redirectTo = profile.role === "senior" ? "/home" : "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
