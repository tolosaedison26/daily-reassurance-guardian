import { useState, useEffect, useCallback } from "react";
import { Gamepad2, Type, Grid3X3, Trophy, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getGameStats, getRecentMatches } from "@/lib/games/client";
import type { GameType, GamesMatch } from "@/types/games";
import WordScramble from "@/components/games/WordScramble";
import MemoryMatch from "@/components/games/MemoryMatch";

type View = "hub" | "word_scramble" | "memory_match";

export default function GamesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("hub");
  const [stats, setStats] = useState<{
    word_scramble: { played: number; totalScore: number; bestScore: number };
    memory_match: { played: number; totalScore: number; bestScore: number };
  } | null>(null);
  const [recentGames, setRecentGames] = useState<GamesMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      const [s, recent] = await Promise.all([
        getGameStats(user.id),
        getRecentMatches(user.id, 5),
      ]);
      setStats(s);
      setRecentGames(recent);
    } catch {
      // Stats are non-critical
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function handleBack() {
    setView("hub");
    loadStats(); // Refresh stats after a game
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
            onClick={() => setView("word_scramble")}
          />
          <GameCard
            title="Memory Match"
            description="Flip cards to find matching pairs. Test your memory with 8 pairs."
            icon={<Grid3X3 className="w-8 h-8" />}
            color="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
            iconBg="bg-sky-200 dark:bg-sky-800/50"
            stats={stats?.memory_match}
            loading={loading}
            onClick={() => setView("memory_match")}
          />
        </div>

        {/* Recent games */}
        {recentGames.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Recent Games
            </p>
            <div className="space-y-2">
              {recentGames.map((game) => (
                <RecentGameRow key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state if no games played */}
        {!loading && recentGames.length === 0 && (
          <div className="text-center py-8">
            <Gamepad2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-lg font-bold text-foreground">Ready to play?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Pick a game above to get started. No pressure, just fun.
            </p>
          </div>
        )}
      </div>
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
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  iconBg: string;
  stats?: { played: number; totalScore: number; bestScore: number };
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-5 rounded-2xl border shadow-sm text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98] min-h-[56px] ${color}`}
    >
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
    </button>
  );
}

function RecentGameRow({ game }: { game: GamesMatch }) {
  const gameLabel = game.game_type === "word_scramble" ? "Word Scramble" : "Memory Match";
  const date = new Date(game.created_at);
  const timeAgo = getTimeAgo(date);

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border">
      <div className="flex items-center gap-3">
        {game.game_type === "word_scramble" ? (
          <Type className="w-5 h-5 text-violet-500" />
        ) : (
          <Grid3X3 className="w-5 h-5 text-sky-500" />
        )}
        <div>
          <p className="text-sm font-bold text-foreground">{gameLabel}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
      <p className="text-lg font-black text-foreground">{game.score_a} pts</p>
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
