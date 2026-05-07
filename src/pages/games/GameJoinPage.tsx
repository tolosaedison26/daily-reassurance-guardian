import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Gamepad2, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Public page at /games/join?code=XXXX
 * - Logged-in users → redirect to lobby with code pre-filled
 * - Non-users → show signup prompt with redirect back
 */
export default function GameJoinPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code")?.toUpperCase().trim() || "";

  useEffect(() => {
    if (user && code) {
      navigate(`/games/lobby?join=${code}`, { replace: true });
    }
  }, [user, code, navigate]);

  // If logged in without code, just go to games hub
  if (user && !code) {
    navigate("/games", { replace: true });
    return null;
  }

  // Logged in with code — will redirect via useEffect
  if (user) return null;

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
                className="w-11 h-13 rounded-xl bg-card border-2 border-primary/30 flex items-center justify-center text-xl font-black text-foreground shadow-sm"
              >
                {char}
              </span>
            ))}
          </div>
        )}

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
        </div>

        <p className="text-xs text-muted-foreground">
          Daily Guardian is a free safety check-in app. Sign up takes 30 seconds.
        </p>
      </div>
    </div>
  );
}
