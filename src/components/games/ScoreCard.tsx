import { Trophy, RotateCcw, ArrowLeft, Star } from "lucide-react";
import type { GameResult } from "@/types/games";

interface ScoreCardProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToHub: () => void;
  /** VS mode: opponent's score and name */
  opponentScore?: number;
  opponentName?: string;
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

  const isGreat = isVs ? vsOutcome === "won" : result.score >= 50;
  const isGood = isVs ? vsOutcome === "tie" : result.score >= 25;

  return (
    <div className="flex flex-col items-center gap-6 py-6 animate-in fade-in duration-500">
      {/* Trophy */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
        isGreat ? "bg-yellow-100 dark:bg-yellow-900/30" : isGood ? "bg-blue-100 dark:bg-blue-900/30" : "bg-muted"
      }`}>
        <Trophy className={`w-10 h-10 ${
          isGreat ? "text-yellow-600 dark:text-yellow-400" : isGood ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
        }`} />
      </div>

      {/* VS outcome */}
      {isVs && vsOutcome && (
        <p className={`text-2xl font-black ${
          vsOutcome === "won" ? "text-emerald-600 dark:text-emerald-400"
          : vsOutcome === "lost" ? "text-muted-foreground"
          : "text-blue-600 dark:text-blue-400"
        }`}>
          {vsOutcome === "won" ? "You won!" : vsOutcome === "lost" ? "Nice effort!" : "It's a tie!"}
        </p>
      )}

      {/* Score comparison for VS */}
      {isVs ? (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-sm font-bold text-muted-foreground mb-1">You</p>
            <p className="text-4xl font-black text-foreground">{result.score}</p>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">vs</span>
          <div className="text-center">
            <p className="text-sm font-bold text-muted-foreground mb-1">{opponentName || "Opponent"}</p>
            <p className="text-4xl font-black text-foreground">{opponentScore}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
            {gameLabel} Complete
          </p>
          <p className="text-5xl font-black text-foreground">{result.score}</p>
          <p className="text-lg font-semibold text-muted-foreground mt-1">points</p>
        </div>
      )}

      {/* Stats */}
      <div className="bg-card rounded-2xl border shadow-sm p-5 w-full max-w-sm space-y-3">
        {result.rounds !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Rounds</span>
            <span className="text-base font-bold text-foreground">{result.rounds}</span>
          </div>
        )}
        {result.perfectRounds !== undefined && result.perfectRounds > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500" /> First-try solves
            </span>
            <span className="text-base font-bold text-foreground">{result.perfectRounds}</span>
          </div>
        )}
        {result.hintsUsed !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Hints used</span>
            <span className="text-base font-bold text-foreground">{result.hintsUsed}</span>
          </div>
        )}
        {result.pairsMatched !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Pairs matched</span>
            <span className="text-base font-bold text-foreground">
              {result.pairsMatched}/{result.totalPairs}
            </span>
          </div>
        )}
        {result.moves !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-base text-muted-foreground">Total moves</span>
            <span className="text-base font-bold text-foreground">{result.moves}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {!isVs && (
          <button
            onClick={onPlayAgain}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        )}
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
