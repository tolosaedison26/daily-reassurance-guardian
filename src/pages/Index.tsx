import { useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/pages/AuthPage";
import SeniorHome from "@/pages/SeniorHome";
import CaregiverDashboard from "@/pages/CaregiverDashboard";

export default function Index() {
  const { user, profile, loading } = useAuth();

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

  // User is logged in but profile hasn't loaded yet — keep showing loader
  if (user && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <span className="text-6xl animate-float">☀️</span>
        <div className="text-center">
          <h1 className="text-2xl font-black" style={{ color: "hsl(var(--primary))" }}>
            Daily Guardian
          </h1>
          <p className="text-muted-foreground text-sm mt-1 animate-pulse">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  if (profile.role === "caregiver") {
    return <CaregiverDashboard />;
  }

  return <SeniorHome />;
}
