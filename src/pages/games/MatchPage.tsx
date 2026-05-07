import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getMatch, getMatchInvitation, submitVsResult, getPlayerName, trackDailyActivity } from "@/lib/games/client";
import { scrambleWord } from "@/lib/games/helpers";
import type { GamesMatch, VsGameState, GameResult, MemoryCard } from "@/types/games";
import WordScramble from "@/components/games/WordScramble";
import MemoryMatch from "@/components/games/MemoryMatch";
import ScoreCard from "@/components/games/ScoreCard";
import InviteCode from "@/components/games/InviteCode";
import ReactionsBar from "@/components/games/ReactionsBar";
import { REACTIONS } from "@/components/games/ReactionsBar";

type MatchState = "loading" | "waiting_opponent" | "your_turn" | "submitted" | "finished";

export default function MatchPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [match, setMatch] = useState<GamesMatch | null>(null);
  const [vsState, setVsState] = useState<VsGameState | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const opponentNameRef = useRef("Opponent");
  const [myResult, setMyResult] = useState<GameResult | null>(null);
  const [pageState, setPageState] = useState<MatchState>("loading");

  const isPlayerA = match?.player_a_id === user?.id;

  const resolveState = useCallback((m: GamesMatch): MatchState => {
    if (!user) return "loading";
    const state = m.game_state as unknown as VsGameState;
    const amPlayerA = m.player_a_id === user.id;

    // No opponent yet
    if (!m.player_b_id) return "waiting_opponent";

    // Both done
    if (state.playerADone && state.playerBDone) return "finished";

    // My turn?
    const myDone = amPlayerA ? state.playerADone : state.playerBDone;
    if (myDone) return "submitted";
    return "your_turn";
  }, [user]);

  // Load match + invitation
  useEffect(() => {
    if (!matchId || !user) return;

    async function load() {
      const [m, inv] = await Promise.all([
        getMatch(matchId!),
        getMatchInvitation(matchId!),
      ]);
      if (!m) {
        toast({ title: "Match not found", variant: "destructive" });
        navigate("/games");
        return;
      }
      setMatch(m);
      setVsState(m.game_state as unknown as VsGameState);
      if (inv?.invite_code) setInviteCode(inv.invite_code.trim());

      // Load opponent name
      const opponentId = m.player_a_id === user!.id ? m.player_b_id : m.player_a_id;
      if (opponentId) {
        getPlayerName(opponentId).then((name) => {
          setOpponentName(name);
          opponentNameRef.current = name;
        }).catch(() => {});
      }

      setPageState(resolveState(m));
    }
    load();
  }, [matchId, user, navigate, toast, resolveState]);

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`match-${matchId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "games_matches",
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        const updated = payload.new as unknown as GamesMatch;
        setMatch(updated);
        setVsState(updated.game_state as unknown as VsGameState);
        setPageState(resolveState(updated));

        // If opponent just joined, resolve their name
        if (updated.player_b_id && user) {
          const opponentId = updated.player_a_id === user.id ? updated.player_b_id : updated.player_a_id;
          if (opponentId) {
            getPlayerName(opponentId).then((name) => {
              setOpponentName(name);
              opponentNameRef.current = name;
            }).catch(() => {});
          }
        }
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "games_reactions",
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        const reaction = payload.new as { sender_id: string; reaction_id: number };
        if (reaction.sender_id !== user?.id) {
          const r = REACTIONS.find((r) => r.id === reaction.reaction_id);
          if (r) toast({ title: `${opponentNameRef.current}: "${r.label}"` });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user, toast, resolveState]);

  // Handle VS game completion
  async function handleVsComplete(result: GameResult) {
    if (!matchId || !user || !match) return;
    setMyResult(result);
    try {
      await submitVsResult(matchId, user.id, isPlayerA, result);
      await trackDailyActivity(user.id, result.rounds || result.moves || 1, false);
      // State will be updated by Realtime, but set optimistically
      setPageState("submitted");
    } catch (err: unknown) {
      toast({ title: "Failed to save result", description: (err as Error).message, variant: "destructive" });
    }
  }

  // Build VS cards from game state
  function buildVsCards(): MemoryCard[] {
    if (!vsState?.cardPairs || !vsState?.cardOrder) return [];
    const pairs = vsState.cardPairs;
    // Create card deck from pairs + order
    const allCards: MemoryCard[] = [];
    pairs.forEach((pair, i) => {
      allCards.push({ id: i * 2, pairKey: pair.key, label: pair.label, flipped: false, matched: false });
      allCards.push({ id: i * 2 + 1, pairKey: pair.key, label: pair.label, flipped: false, matched: false });
    });
    // Apply the stored shuffle order
    const ordered: MemoryCard[] = vsState.cardOrder.map((origIdx) => allCards[origIdx]);
    return ordered;
  }

  const gameLabel = match?.game_type === "word_scramble" ? "Word Scramble" : "Memory Match";

  if (pageState === "loading" || !match || !vsState) {
    return (
      <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6 gap-5">

        {/* Waiting for opponent to join */}
        {pageState === "waiting_opponent" && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/games")}
                className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-xl font-black text-foreground">VS {gameLabel}</h1>
            </div>

            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">Waiting for opponent</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Share the code below so they can join
                </p>
              </div>
              {inviteCode && <InviteCode mode="display" code={inviteCode} />}
            </div>
          </>
        )}

        {/* Your turn — play the game */}
        {pageState === "your_turn" && (
          <>
            {match.game_type === "word_scramble" && vsState.words ? (
              <WordScramble
                onBack={() => navigate("/games")}
                vsWords={vsState.words}
                onVsComplete={handleVsComplete}
              />
            ) : match.game_type === "memory_match" ? (
              <MemoryMatch
                onBack={() => navigate("/games")}
                vsCards={buildVsCards()}
                onVsComplete={handleVsComplete}
              />
            ) : null}

            {/* Reactions */}
            {match.player_b_id && user && (
              <div className="mt-2">
                <ReactionsBar matchId={match.id} senderId={user.id} />
              </div>
            )}
          </>
        )}

        {/* Submitted — waiting for opponent to finish */}
        {pageState === "submitted" && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/games")}
                className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h1 className="text-xl font-black text-foreground">VS {gameLabel}</h1>
            </div>

            <div className="flex flex-col items-center gap-6 py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  Your score: {myResult?.score || (isPlayerA ? match.score_a : match.score_b)} pts
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Waiting for {opponentName} to finish...
                </p>
              </div>

              {user && (
                <ReactionsBar matchId={match.id} senderId={user.id} />
              )}
            </div>
          </>
        )}

        {/* Both finished — show results */}
        {pageState === "finished" && (
          <>
            {(() => {
              const myResultData = isPlayerA ? vsState.playerAResult : vsState.playerBResult;
              const oppScore = isPlayerA ? match.score_b : match.score_a;
              const fallbackResult: GameResult = myResultData || {
                gameType: match.game_type,
                score: isPlayerA ? match.score_a : match.score_b,
              };
              return (
                <ScoreCard
                  result={fallbackResult}
                  opponentScore={oppScore}
                  opponentName={opponentName}
                  onPlayAgain={() => navigate(`/games/lobby?type=${match.game_type}`)}
                  onBackToHub={() => navigate("/games")}
                />
              );
            })()}

            {user && (
              <div className="mt-2">
                <ReactionsBar matchId={match.id} senderId={user.id} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
