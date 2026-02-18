import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Heart } from "lucide-react";
import natureHero from "@/assets/nature-hero.jpg";
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
    <div className="min-h-screen flex flex-col">
      {/* Hero header */}
      <div className="relative h-48 overflow-hidden">
        <img src={natureHero} alt="Peaceful nature" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="absolute inset-0 flex items-center justify-center pb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Leaf className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
              <span className="text-2xl font-bold" style={{ color: "hsl(var(--primary-foreground))", fontFamily: "Lora, Georgia, serif", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                Daily Guardian
              </span>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
              Peaceful check-ins for peace of mind
            </p>
          </div>
        </div>
      </div>

      {/* Auth card */}
      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
          <h2 className="text-2xl font-semibold text-center mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {mode === "login" ? "Sign in to continue" : "Join Daily Guardian today"}
          </p>

          {/* Role selector (signup only) */}
          {mode === "signup" && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setRole("senior")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "senior"
                    ? "border-primary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span className="text-2xl">🌿</span>
                <span className="font-semibold text-sm">I'm a Senior</span>
                <span className="text-xs text-center leading-tight opacity-70">Daily check-in for me</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("caregiver")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "caregiver"
                    ? "border-primary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <Heart className="w-6 h-6" />
                <span className="font-semibold text-sm">I'm a Caregiver</span>
                <span className="text-xs text-center leading-tight opacity-70">Monitor my loved ones</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="fullName" className="text-base font-medium">Full Name</Label>
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
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
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
              <Label htmlFor="password" className="text-base font-medium">Password</Label>
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
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium">
                {success}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 text-lg font-bold rounded-xl gradient-btn shadow-btn border-0"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
              className="text-primary font-semibold underline-offset-4 hover:underline text-sm"
            >
              {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
