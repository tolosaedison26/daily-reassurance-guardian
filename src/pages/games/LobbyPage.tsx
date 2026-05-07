import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Users, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createVsMatch, joinVsMatch } from "@/lib/games/client";
import type { GameType } from "@/types/games";
import InviteCode from "@/components/games/InviteCode";

type LobbyState = "choose" | "creating" | "hosting" | "joining";

export default function LobbyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gameType = (searchParams.get("type") || "word_scramble") as GameType;
  const gameLabel = gameType === "word_scramble" ? "Word Scramble" : "Memory Match";

  const [state, setState] = useState<LobbyState>("choose");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-join if ?join=CODE is present (from shared link / GameJoinPage redirect)
  const joinCode = searchParams.get("join");
  useEffect(() => {
    if (joinCode && user && state === "choose") {
      setState("joining");
      handleJoin(joinCode);
    }
  }, [joinCode, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate() {
    if (!user) return;
    setState("creating");
    setLoading(true);
    try {
      const { match, inviteCode: code } = await createVsMatch(user.id, gameType);
      setInviteCode(code);
      setState("hosting");
      // Navigate to match page — the host can start playing right away
      // But first show the code so they can share it
      setTimeout(() => {
        navigate(`/games/m/${match.id}`);
      }, 0);
    } catch (err: unknown) {
      toast({ title: "Failed to create game", description: (err as Error).message, variant: "destructive" });
      setState("choose");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(code: string) {
    if (!user) return;
    setLoading(true);
    setJoinError(null);
    try {
      const matchId = await joinVsMatch(code, user.id);
      toast({ title: "Joined game!" });
      navigate(`/games/m/${matchId}`);
    } catch (err: unknown) {
      setJoinError((err as Error).message || "Could not join game");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6 gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/games")}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">VS {gameLabel}</h1>
            <p className="text-sm text-muted-foreground">Play against a friend or family member</p>
          </div>
        </div>

        {state === "choose" && (
          <div className="space-y-4 mt-4">
            {/* Create game */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/30 hover:shadow-md transition-all text-left min-h-[56px]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Create a game</p>
                  <p className="text-sm text-muted-foreground">Get a code to share with your opponent</p>
                </div>
              </div>
            </button>

            {/* Join game */}
            <button
              onClick={() => setState("joining")}
              disabled={loading}
              className="w-full p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/30 hover:shadow-md transition-all text-left min-h-[56px]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
                  <KeyRound className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">Join a game</p>
                  <p className="text-sm text-muted-foreground">Enter a code from your friend</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {state === "creating" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-base font-semibold text-muted-foreground">Setting up your game...</p>
          </div>
        )}

        {state === "hosting" && inviteCode && (
          <div className="py-6">
            <InviteCode mode="display" code={inviteCode} />
          </div>
        )}

        {state === "joining" && (
          <div className="py-6 space-y-4">
            <InviteCode
              mode="entry"
              onSubmit={handleJoin}
              error={joinError}
              loading={loading}
            />
            <div className="text-center">
              <button
                onClick={() => { setState("choose"); setJoinError(null); }}
                className="text-sm font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-4 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
