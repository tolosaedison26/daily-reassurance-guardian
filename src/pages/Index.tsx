import { useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/pages/AuthPage";
import SeniorHome from "@/pages/SeniorHome";
import CaregiverDashboard from "@/pages/CaregiverDashboard";
import { Leaf } from "lucide-react";

export default function Index() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="animate-float">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-soft"
            style={{ backgroundColor: "hsl(var(--primary))" }}
          >
            <Leaf className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-1">Daily Guardian</h1>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
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
