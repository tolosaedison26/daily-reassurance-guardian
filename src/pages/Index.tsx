import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import AuthPage from "@/pages/AuthPage";

import LandingPage from "@/pages/LandingPage";

export default function Index() {
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

  // If logged in, route to the right dashboard
  if (user && profile) {
    if (profile.role === "caregiver") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  // Not logged in: show landing page
  return <LandingPage 
    onGetStarted={() => window.location.href = "/register"} 
    onSignIn={() => window.location.href = "/login"} 
  />;
}
