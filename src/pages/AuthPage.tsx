import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { createUserProfile } from "@/lib/supabase-helpers";

type Mode = "login" | "signup";
type Role = "senior" | "caregiver";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("senior");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        await createUserProfile(data.user.id, fullName, role);
        await supabase.from("user_roles").insert({ user_id: data.user.id, role });
        setSuccess("Account created! Please check your email to verify your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-6 px-5">
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
            {mode === "login" ? "Welcome back!" : "Create your account"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {mode === "login" ? "Sign in to continue" : "Join Daily Guardian today"}
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
                  className="mt-1 h-13 h-12 text-base rounded-xl"
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
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setSuccess("");
              }}
              className="text-primary font-bold text-sm underline-offset-4 hover:underline"
            >
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
