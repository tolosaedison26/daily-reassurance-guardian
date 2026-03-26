import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { triggerSmsWebhook, normalizePhone, formatPhoneDisplay } from "@/lib/supabase-helpers";

type Mode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const getInitialMode = (): Mode => {
    if (location.pathname === "/register") return "signup";
    if (location.pathname === "/forgot-password") return "forgot";
    return "login";
  };

  const [mode, setMode] = useState<Mode>(getInitialMode());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+1 ");
  const [smsConsent, setSmsConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signupInProgress, setSignupInProgress] = useState(false);

  useEffect(() => {
    // Don't redirect while signup save is still running
    if (signupInProgress) return;
    if (!authLoading && user && profile) {
      const defaultRoute = profile.role === "admin" ? "/admin" : "/home";
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get("redirect");
      const from = redirectParam || (location.state as any)?.from || defaultRoute;
      navigate(from, { replace: true });
    }
  }, [authLoading, user, profile, navigate, location.state, location.search, signupInProgress]);

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
      setSignupInProgress(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: "senior" } },
      });
      if (error) {
        setError(error.message);
        setSignupInProgress(false);
      } else if (data.user) {
        // Profile + senior record auto-created by DB trigger
        // Wait for trigger to complete, then update phone and SMS consent
        const userId = data.user.id;
        let senior: { id: string } | null = null;
        for (let attempt = 0; attempt < 8; attempt++) {
          const { data: s } = await supabase
            .from("seniors")
            .select("id")
            .eq("profile_id", userId)
            .maybeSingle();
          if (s) { senior = s; break; }
          await new Promise((r) => setTimeout(r, 500));
        }
        const cleanPhone = normalizePhone(phone);
        if (senior) {
          const updates: Record<string, any> = {};
          if (cleanPhone.length >= 10) updates.phone = cleanPhone;
          if (smsConsent) updates.sms_consent_status = "requested";
          if (Object.keys(updates).length > 0) {
            await supabase.from("seniors").update(updates).eq("id", senior.id);
          }
          if (smsConsent && cleanPhone.length >= 10) {
            triggerSmsWebhook(senior.id, "opt_in", cleanPhone, fullName);
          }
        }
        // Also update phone on profiles table
        if (cleanPhone.length >= 10) {
          await supabase.from("profiles").update({ phone: cleanPhone }).eq("user_id", userId);
        }
        // All saves done — now allow navigation
        setSignupInProgress(false);
        navigate("/home", { replace: true });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Back to landing */}
      <div className="px-5 pt-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back
        </button>
      </div>
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-5">
        <Shield className="w-12 h-12 text-primary mb-3" />
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
            {mode === "signup" && (
              <div>
                <Label htmlFor="phone" className="text-base font-bold">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="mt-1 h-12 text-base rounded-xl"
                />
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Enter your 10-digit mobile number. It will auto-format as you type.<br />
                  <span className="font-semibold">Example:</span> +1 (555) 123-4567<br />
                  We'll send your daily check-in SMS to this number.
                </p>
              </div>
            )}
            {mode !== "forgot" && (
              <div>
                <Label htmlFor="password" className="text-base font-bold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
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

            {mode === "signup" && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">(Optional)</span> Please check here to authorize Daily Guardian to send your daily check-in and safety SMS. We need this permission to keep you updated! Reply YES to the confirmation text to activate, or STOP to unsubscribe.
                </span>
              </label>
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
                &larr; Back to Sign In
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
