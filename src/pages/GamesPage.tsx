import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Type, Grid3X3, Trophy, Loader2, Swords, Trash2, Calendar, Flame, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGameStats, getRecentMatches, getActiveVsMatches, deleteMatch,
  getTodayDailyChallenge, saveDailyChallenge, getDailyStreak, trackDailyActivity,
} from "@/lib/games/client";
import { seedDailyHardWords, buildDailyCardDeck } from "@/lib/games/helpers";
import type { GameType, GamesMatch, VsGameState, GameResult, MemoryCard } from "@/types/games";
import WordScramble from "@/components/games/WordScramble";
import MemoryMatch from "@/components/games/MemoryMatch";

type View = "hub" | "word_scramble" | "memory_match" | "daily_word_scramble" | "daily_memory_match";

export default function GamesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("hub");
  const [stats, setStats] = useState<{
    word_scramble: { played: number; totalScore: number; bestScore: number };
    memory_match: { played: number; totalScore: number; bestScore: number };
  } | null>(null);
  const [recentGames, setRecentGames] = useState<GamesMatch[]>([]);
  const [activeVs, setActiveVs] = useState<GamesMatch[]>([]);
  const [dailyWord, setDailyWord] = useState<GamesMatch | null | undefined>(undefined);
  const [dailyMemory, setDailyMemory] = useState<GamesMatch | null | undefined>(undefined);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [dailyGameWords, setDailyGameWords] = useState<string[] | null>(null);
  const [dailyGameCards, setDailyGameCards] = useState<MemoryCard[] | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      const [s, recent, active, dWord, dMem, dailyStreak] = await Promise.all([
        getGameStats(user.id),
        getRecentMatches(user.id, 10),
        getActiveVsMatches(user.id),
        getTodayDailyChallenge(user.id, "word_scramble", today),
        getTodayDailyChallenge(user.id, "memory_match", today),
        getDailyStreak(user.id),
      ]);
      setStats(s);
      setRecentGames(recent);
      setActiveVs(active);
      setDailyWord(dWord);
      setDailyMemory(dMem);
      setStreak(dailyStreak);
    } catch {
      setDailyWord(null);
      setDailyMemory(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function handleBack() {
    setView("hub");
    loadStats();
  }

  async function handleRemove(id: string) {
    try {
      await deleteMatch(id);
      setActiveVs((prev) => prev.filter((g) => g.id !== id));
      setRecentGames((prev) => prev.filter((g) => g.id !== id));
    } catch {
      // silently ignore — row stays if delete fails
    }
  }

  function handlePlayDailyWord() {
    const today = new Date().toISOString().split("T")[0];
    setDailyGameWords(seedDailyHardWords(today, 5));
    setView("daily_word_scramble");
  }

  function handlePlayDailyMemory() {
    const today = new Date().toISOString().split("T")[0];
    setDailyGameCards(buildDailyCardDeck(today));
    setView("daily_memory_match");
  }

  async function handleDailyComplete(gameType: GameType, result: GameResult) {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    // Optimistic update so score appears immediately
    const optimistic = { id: "", score_a: result.score } as GamesMatch;
    if (gameType === "word_scramble") setDailyWord(optimistic);
    else setDailyMemory(optimistic);
    setView("hub");
    try {
      await saveDailyChallenge(user.id, gameType, today, result.score);
      trackDailyActivity(user.id, result.rounds || result.moves || 1, true).catch(() => {});
    } catch {
      // non-critical — optimistic update already shown
    }
    loadStats();
  }

  if (view === "word_scramble") {
    return (
      <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
          <WordScramble onBack={handleBack} />
        </div>
      </div>
    );
  }

  if (view === "memory_match") {
    return (
      <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
          <MemoryMatch onBack={handleBack} />
        </div>
      </div>
    );
  }

  if (view === "daily_word_scramble" && dailyGameWords) {
    return (
      <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
          <WordScramble
            onBack={() => setView("hub")}
            vsWords={dailyGameWords}
            onVsComplete={(result) => handleDailyComplete("word_scramble", result)}
            hideHint
          />
        </div>
      </div>
    );
  }

  if (view === "daily_memory_match" && dailyGameCards) {
    return (
      <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
          <MemoryMatch
            onBack={() => setView("hub")}
            vsCards={dailyGameCards}
            onVsComplete={(result) => handleDailyComplete("memory_match", result)}
            flipDelay={800}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background max-w-2xl mx-auto w-full">
      <div className="flex-1 flex flex-col px-4 sm:px-6 pt-4 sm:pt-6 pb-6 gap-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-black text-foreground">Games</h1>
          </div>
          <p className="text-base text-muted-foreground">
            Play a quick game to keep your mind sharp.
          </p>
        </div>

        {/* Active VS matches */}
        {activeVs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Active Games
              </p>
              {activeVs.length > 3 && (
                <button
                  onClick={() => setShowAllActive((v) => !v)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {showAllActive ? "Show less" : `Show all ${activeVs.length}`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllActive ? activeVs : activeVs.slice(0, 3)).map((game) => (
                <ActiveVsRow key={game.id} game={game} userId={user?.id || ""} onRemove={handleRemove} />
              ))}
            </div>
            {!showAllActive && activeVs.length > 3 && (
              <button
                onClick={() => setShowAllActive(true)}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                +{activeVs.length - 3} more active {activeVs.length - 3 === 1 ? "game" : "games"}
              </button>
            )}
          </div>
        )}

        {/* Game cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GameCard
            title="Word Scramble"
            description="Unscramble letters to find the hidden word. 5 rounds per game."
            icon={<Type className="w-8 h-8" />}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
            iconBg="bg-violet-200 dark:bg-violet-800/50"
            stats={stats?.word_scramble}
            loading={loading}
            onSolo={() => setView("word_scramble")}
            onVs={() => navigate("/games/lobby?type=word_scramble")}
          />
          <GameCard
            title="Memory Match"
            description="Flip cards to find matching pairs. Test your memory with 8 pairs."
            icon={<Grid3X3 className="w-8 h-8" />}
            color="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
            iconBg="bg-sky-200 dark:bg-sky-800/50"
            stats={stats?.memory_match}
            loading={loading}
            onSolo={() => setView("memory_match")}
            onVs={() => navigate("/games/lobby?type=memory_match")}
          />
        </div>

        {/* Recent games */}
        {recentGames.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Game History
              </p>
              {recentGames.length > 5 && (
                <button
                  onClick={() => setShowAllRecent((v) => !v)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {showAllRecent ? "Show less" : `Show all ${recentGames.length}`}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {(showAllRecent ? recentGames : recentGames.slice(0, 5)).map((game) => (
                <RecentGameRow key={game.id} game={game} userId={user?.id || ""} onRemove={handleRemove} />
              ))}
            </div>
            {!showAllRecent && recentGames.length > 5 && (
              <button
                onClick={() => setShowAllRecent(true)}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Show {recentGames.length - 5} more
              </button>
            )}
          </div>
        )}

        {/* Daily Challenge */}
        <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 overflow-hidden">
          {/* Card header */}
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">
                  Today's Challenge
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Harder mode · Same puzzle for everyone · Resets tomorrow
              </p>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 text-xs font-bold shrink-0">
                <Flame className="w-3.5 h-3.5" />
                {streak} day streak
              </div>
            )}
          </div>
          {/* Game rows */}
          <div className="border-t border-amber-200 dark:border-amber-700">
            <DailyChallengeRow
              title="Word Scramble"
              subtitle="Longer words · No hints"
              icon={<Type className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
              iconBg="bg-violet-100 dark:bg-violet-900/40"
              match={dailyWord}
              loading={loading}
              onPlay={handlePlayDailyWord}
            />
            <div className="border-t border-amber-100 dark:border-amber-800/50">
              <DailyChallengeRow
                title="Memory Match"
                subtitle="Cards flip back faster"
                icon={<Grid3X3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                iconBg="bg-sky-100 dark:bg-sky-900/40"
                match={dailyMemory}
                loading={loading}
                onPlay={handlePlayDailyMemory}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function DailyChallengeRow({
  title,
  subtitle,
  icon,
  iconBg,
  match,
  loading,
  onPlay,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  match: GamesMatch | null | undefined;
  loading: boolean;
  onPlay: () => void;
}) {
  const played = match !== null && match !== undefined;
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">{subtitle}</p>
        </div>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
      ) : played ? (
        <div className="flex items-center gap-1.5 shrink-0 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-base font-black">{match.score_a} pts</span>
        </div>
      ) : (
        <button
          onClick={onPlay}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors min-h-[44px] shrink-0"
        >
          Play
        </button>
      )}
    </div>
  );
}

function GameCard({
  title,
  description,
  icon,
  color,
  iconBg,
  stats,
  loading,
  onSolo,
  onVs,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  iconBg: string;
  stats?: { played: number; totalScore: number; bestScore: number };
  loading: boolean;
  onSolo: () => void;
  onVs: () => void;
}) {
  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${color}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}>
        {icon}
      </div>
      <p className="text-lg font-black">{title}</p>
      <p className="text-sm opacity-80 mt-1">{description}</p>
      {loading ? (
        <div className="mt-3">
          <Loader2 className="w-4 h-4 animate-spin opacity-50" />
        </div>
      ) : stats && stats.played > 0 ? (
        <div className="mt-3 flex items-center gap-3 text-xs font-bold opacity-70">
          <span>{stats.played} played</span>
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Best: {stats.bestScore}
          </span>
        </div>
      ) : null}
      {/* Play buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSolo}
          className="flex-1 py-3 rounded-xl bg-white/50 dark:bg-white/10 font-bold text-sm hover:bg-white/70 dark:hover:bg-white/20 transition-colors min-h-[48px]"
        >
          Play Solo
        </button>
        <button
          onClick={onVs}
          className="flex-1 py-3 rounded-xl bg-white/50 dark:bg-white/10 font-bold text-sm hover:bg-white/70 dark:hover:bg-white/20 transition-colors min-h-[48px] flex items-center justify-center gap-1.5"
        >
          <Swords className="w-4 h-4" />
          VS
        </button>
      </div>
    </div>
  );
}

function ActiveVsRow({ game, userId, onRemove }: { game: GamesMatch; userId: string; onRemove: (id: string) => void }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const gameLabel = game.game_type === "word_scramble" ? "Word Scramble" : "Memory Match";
  const state = game.game_state as unknown as VsGameState;
  const isPlayerA = game.player_a_id === userId;
  const myDone = isPlayerA ? state.playerADone : state.playerBDone;
  const hasOpponent = !!game.player_b_id;

  const status = !hasOpponent
    ? "Waiting for opponent"
    : myDone
    ? "Waiting for their turn"
    : "Your turn";

  if (confirming) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20">
        <p className="text-sm font-semibold text-foreground">Remove this game?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRemove(game.id)}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 min-h-[36px]"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-muted min-h-[36px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(`/games/m/${game.id}`)}
        className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-card border hover:border-primary/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Swords className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{gameLabel} VS</p>
            <p className="text-xs text-muted-foreground">{status}</p>
          </div>
        </div>
        {!myDone && hasOpponent && (
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            Play
          </span>
        )}
      </button>
      <button
        onClick={() => setConfirming(true)}
        aria-label="Remove game"
        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function RecentGameRow({ game, userId, onRemove }: { game: GamesMatch; userId: string; onRemove: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const gameLabel = game.game_type === "word_scramble" ? "Word Scramble" : "Memory Match";
  const modeLabel = game.mode === "vs" ? " VS" : game.mode === "daily_challenge" ? " Daily" : "";
  const myScore = game.player_a_id === userId ? game.score_a : game.score_b;
  const date = new Date(game.created_at);
  const timeAgo = getTimeAgo(date);

  if (confirming) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20">
        <p className="text-sm font-semibold text-foreground">Remove this entry?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRemove(game.id)}
            className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 min-h-[36px]"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-muted min-h-[36px]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-card border">
        <div className="flex items-center gap-3">
          {game.game_type === "word_scramble" ? (
            <Type className="w-5 h-5 text-violet-500" />
          ) : (
            <Grid3X3 className="w-5 h-5 text-sky-500" />
          )}
          <div>
            <p className="text-sm font-bold text-foreground">
              {gameLabel}{modeLabel}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <p className="text-lg font-black text-foreground">{myScore} pts</p>
      </div>
      <button
        onClick={() => setConfirming(true)}
        aria-label="Remove from history"
        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
