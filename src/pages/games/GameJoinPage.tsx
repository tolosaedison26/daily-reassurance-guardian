import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Gamepad2, UserPlus, Loader2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public page at /games/join?code=XXXX
 * - Logged-in users → redirect to lobby with code pre-filled
 * - Non-users → show signup / login / play as guest options
 */
export default function GameJoinPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code")?.toUpperCase().trim() || "";

  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guestSignupInProgress, setGuestSignupInProgress] = useState(false);

  // Redirect when user + profile are both ready (covers guest timing)
  useEffect(() => {
    if (guestSignupInProgress) return;
    if (user && profile && code) {
      navigate(`/games/lobby?join=${code}`, { replace: true });
    } else if (user && profile && !code) {
      navigate("/games", { replace: true });
    }
  }, [user, profile, code, navigate, guestSignupInProgress]);

  // Show nothing while authenticated user waits for redirect
  if (user && profile && !guestSignupInProgress) return null;
  // Show loading state if user exists but profile still loading (brief moment after guest signup)
  if (user && !profile && !guestSignupInProgress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  async function handleGuestPlay(e: React.FormEvent) {
    e.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    setLoading(true);
    setError("");
    setGuestSignupInProgress(true);
    try {
      const { data, error: authError } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: name } },
      });
      if (authError) throw authError;
      if (!data.user) throw new Error("Failed to create guest session");

      // Wait for handle_new_user trigger to create profile (no seniors record for anonymous)
      const userId = data.user.id;
      let profileFound = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (p) { profileFound = true; break; }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (!profileFound) throw new Error("Setup timed out. Please try again.");

      // Let useEffect handle navigation once AuthContext has profile ready
      setGuestSignupInProgress(false);
    } catch (err: unknown) {
      setError((err as Error).message || "Something went wrong");
      setGuestSignupInProgress(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-primary/10">
          <Gamepad2 className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-foreground">
            You've been invited to play!
          </h1>
          <p className="text-base text-muted-foreground mt-2">
            Someone wants to play a brain game with you on Daily Guardian.
          </p>
        </div>

        {code && (
          <div className="flex items-center justify-center gap-2">
            {code.split("").map((char, i) => (
              <span
                key={i}
                className="w-12 h-14 rounded-xl bg-card border-2 border-primary/30 flex items-center justify-center text-xl font-black text-foreground shadow-sm"
              >
                {char}
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold">
            {error}
          </div>
        )}

        {!guestMode ? (
          <div className="space-y-3">
            <Link
              to={`/register?redirect=${encodeURIComponent(`/games/lobby?join=${code}`)}`}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] hover:opacity-90 transition-opacity"
            >
              <UserPlus className="w-5 h-5" />
              Sign up to play
            </Link>
            <Link
              to={`/login?redirect=${encodeURIComponent(`/games/lobby?join=${code}`)}`}
              className="w-full py-4 rounded-2xl border-2 border-border font-bold text-lg text-muted-foreground flex items-center justify-center gap-2 min-h-[56px] hover:bg-muted transition-colors"
            >
              I already have an account
            </Link>
            <button
              onClick={() => setGuestMode(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-border font-bold text-lg text-muted-foreground flex items-center justify-center gap-2 min-h-[56px] hover:bg-muted transition-colors"
            >
              <User className="w-5 h-5" />
              Play as Guest
            </button>
          </div>
        ) : (
          <form onSubmit={handleGuestPlay} className="space-y-4">
            <div className="text-left">
              <label htmlFor="guestName" className="text-sm font-bold text-foreground">
                Your name
              </label>
              <input
                id="guestName"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your name"
                required
                autoFocus
                disabled={loading}
                className="mt-1 w-full h-14 px-4 rounded-xl border-2 border-border bg-card text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !guestName.trim()}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start playing"}
            </button>
            <button
              type="button"
              onClick={() => { setGuestMode(false); setError(""); }}
              className="text-sm font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-4 transition-colors"
            >
              Back
            </button>
          </form>
        )}

        <p className="text-xs text-muted-foreground">
          Daily Guardian is a free safety check-in app. Sign up takes 30 seconds.
        </p>
      </div>
    </div>
  );
}
