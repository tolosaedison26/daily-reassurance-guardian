import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
        <span className="text-5xl mb-4">☀️</span>
        <h1 className="text-2xl font-black mb-2">Invalid Reset Link</h1>
        <p className="text-muted-foreground text-center mb-6">
          This link is invalid or has expired. Please request a new password reset.
        </p>
        <Button onClick={() => navigate("/")} className="rounded-xl font-bold">
          Go to Home
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5">
        <span className="text-5xl mb-4">✅</span>
        <h1 className="text-2xl font-black mb-2">Password Updated!</h1>
        <p className="text-muted-foreground text-center">
          Your password has been changed successfully. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex flex-col items-center pt-16 pb-6 px-5">
        <span className="text-5xl mb-3">☀️</span>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "hsl(var(--primary))" }}>
          Daily Guardian
        </h1>
      </div>

      <div className="flex-1 px-5 pb-10 max-w-md mx-auto w-full">
        <div className="bg-card rounded-3xl p-6 shadow-card border border-border">
          <h2 className="text-2xl font-black text-center mb-1">Set New Password</h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-base font-bold">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="h-12 text-base rounded-xl pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-base font-bold">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="mt-1 h-12 text-base rounded-xl"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-black rounded-2xl border-0 shadow-btn mt-2"
              style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
