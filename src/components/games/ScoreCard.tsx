import { RotateCcw, ArrowLeft, Star } from "lucide-react";
import type { GameResult } from "@/types/games";

interface ScoreCardProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  /** VS mode: opponent's score and name */
  opponentScore?: number;
  opponentName?: string;
}

function getStars(result: GameResult): number {
  if (result.gameType === "word_scramble") {
    if (result.score >= 60) return 3;
    if (result.score >= 35) return 2;
    return 1;
  }
  // memory_match: max ~61 (8 pairs × 5 + 7 streak bonuses)
  if (result.score >= 45) return 3;
  if (result.score >= 25) return 2;
  return 1;
}

export default function ScoreCard({
  result,
  onPlayAgain,
  onBackToHub,
  opponentScore,
  opponentName,
}: ScoreCardProps) {
  const gameLabel = result.gameType === "word_scramble" ? "Word Scramble" : "Memory Match";
  const isVs = opponentScore !== undefined;

  let vsOutcome: "won" | "lost" | "tie" | null = null;
  if (isVs) {
    if (result.score > opponentScore!) vsOutcome = "won";
    else if (result.score < opponentScore!) vsOutcome = "lost";
    else vsOutcome = "tie";
  }

  const stars = isVs
    ? vsOutcome === "won" ? 3 : vsOutcome === "tie" ? 2 : 1
    : getStars(result);

  const bannerGradient =
    stars === 3
      ? "from-yellow-400 via-orange-400 to-orange-500"
      : stars === 2
      ? "from-blue-400 via-indigo-400 to-indigo-500"
      : "from-slate-400 to-slate-500";

  const outcomeText = isVs
    ? vsOutcome === "won"
      ? "You won!"
      : vsOutcome === "lost"
      ? "Nice effort!"
      : "It's a tie!"
    : stars === 3
    ? "Excellent!"
    : stars === 2
    ? "Well done!"
    : "Keep going!";

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Celebration banner with stars */}
      <div className={`bg-gradient-to-br ${bannerGradient} rounded-2xl p-6 text-white text-center`}>
        <div className="flex justify-center gap-1.5 mb-3">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-9 h-9 transition-all ${
                s <= stars ? "fill-white text-white drop-shadow" : "text-white/25"
              }`}
            />
          ))}
        </div>
        <p className="text-2xl font-black">{outcomeText}</p>
        <p className="text-sm font-semibold opacity-80 mt-0.5">{gameLabel}</p>
      </div>

      {/* Score display */}
      {isVs ? (
        <div className="flex items-center justify-around bg-card rounded-2xl border p-5">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">You</p>
            <p
              className={`text-4xl font-black ${
                vsOutcome === "won" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              }`}
            >
              {result.score}
            </p>
          </div>
          <span className="text-2xl font-bold text-muted-foreground/30">vs</span>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              {opponentName || "Opponent"}
            </p>
            <p
              className={`text-4xl font-black ${
                vsOutcome === "lost" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              }`}
            >
              {opponentScore}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center bg-card rounded-2xl border p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
            Your Score
          </p>
          <p className="text-5xl font-black text-foreground">{result.score}</p>
          <p className="text-base font-semibold text-muted-foreground mt-1">points</p>
        </div>
      )}

      {/* Stats */}
      <div className="bg-card rounded-2xl border p-5 space-y-3">
        {result.rounds !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rounds</span>
            <span className="text-sm font-bold text-foreground">{result.rounds}</span>
          </div>
        )}
        {result.perfectRounds !== undefined && result.perfectRounds > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              First-try solves
            </span>
            <span className="text-sm font-bold text-foreground">{result.perfectRounds}</span>
          </div>
        )}
        {result.hintsUsed !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Hints used</span>
            <span className="text-sm font-bold text-foreground">{result.hintsUsed}</span>
          </div>
        )}
        {result.pairsMatched !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pairs matched</span>
            <span className="text-sm font-bold text-foreground">
              {result.pairsMatched}/{result.totalPairs}
            </span>
          </div>
        )}
        {result.moves !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total moves</span>
            <span className="text-sm font-bold text-foreground">{result.moves}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-5 h-5" />
          {isVs ? "Rematch" : "Play Again"}
        </button>
        <button
          onClick={onBackToHub}
          className="w-full py-4 rounded-2xl border-2 border-border font-bold text-lg text-muted-foreground flex items-center justify-center gap-2 min-h-[56px] hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Games
        </button>
      </div>
    </div>
  );
}
