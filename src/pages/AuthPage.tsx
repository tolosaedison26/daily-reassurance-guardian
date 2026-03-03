import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage";

type Mode = "login" | "signup" | "forgot";
type Role = "senior" | "caregiver";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Determine initial mode from route
  const getInitialMode = (): Mode => {
    if (location.pathname === "/register") return "signup";
    if (location.pathname === "/forgot-password") return "forgot";
    return "login";
  };

  const [mode, setMode] = useState<Mode>(getInitialMode());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("senior");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      const defaultRoute = profile.role === "senior" ? "/home" : "/dashboard";
      // Check ?redirect= query param first, then location state
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get("redirect");
      const from = redirectParam || (location.state as any)?.from || defaultRoute;
      navigate(from, { replace: true });
    }
  }, [authLoading, user, profile, navigate, location.state, location.search]);

  // Sync mode with route
  useEffect(() => {
    setMode(getInitialMode());
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password reset link sent! Check your email.");
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Profile is auto-created by database trigger — just insert role
        await supabase.from("user_roles").upsert(
          { user_id: data.user.id, role },
          { onConflict: "user_id,role" }
        );
        setSuccess("Account created! You can now sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      // Auth state change will trigger redirect
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Back to landing */}
      <div className="px-5 pt-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
      </div>
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-5">
        <span className="text-5xl mb-3">☀️</span>
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ color: "hsl(var(--primary))" }}
        >
          Daily Guardian
        </h1>
        <p className="text-muted-foreground text-base mt-1 text-center">
          Simple daily check-ins for peace of mind
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 pb-10 max-w-md mx-auto w-full">
        <div className="bg-card rounded-3xl p-6 shadow-card border border-border">
          <h2 className="text-2xl font-black text-center mb-1">
            {mode === "login" ? "Welcome back!" : mode === "signup" ? "Create your account" : "Reset Password"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {mode === "login" ? "Sign in to continue" : mode === "signup" ? "Join Daily Guardian today" : "Enter your email to receive a reset link"}
          </p>

          {/* Role selector */}
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setRole("senior")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  role === "senior"
                    ? "border-primary bg-secondary"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-2xl">☀️</span>
                <span className="font-black text-sm">I'm a Senior</span>
                <span className="text-xs text-center opacity-60 leading-tight">
                  Daily check-in for me
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("caregiver")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  role === "caregiver"
                    ? "border-primary bg-secondary"
                    : "border-border bg-card"
                }`}
              >
                <Heart className="w-7 h-7" style={{ color: role === "caregiver" ? "hsl(var(--primary))" : undefined }} />
                <span className="font-black text-sm">I'm a Caregiver</span>
                <span className="text-xs text-center opacity-60 leading-tight">
                  Monitor my loved ones
                </span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="fullName" className="text-base font-bold">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="mt-1 h-12 text-base rounded-xl"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-base font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1 h-12 text-base rounded-xl"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password" className="text-base font-bold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="mt-1 h-12 text-base rounded-xl"
                />
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary text-sm font-semibold hover:underline underline-offset-4"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-black rounded-2xl border-0 shadow-btn mt-2"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary font-bold text-sm underline-offset-4 hover:underline"
              >
                ← Back to Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(mode === "login" ? "/register" : "/login")}
                className="text-primary font-bold text-sm underline-offset-4 hover:underline"
              >
                {mode === "login"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
