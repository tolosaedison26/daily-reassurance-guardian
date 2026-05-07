import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { buildCardDeck } from "@/lib/games/helpers";
import { createMatch, finishMatch, trackDailyActivity } from "@/lib/games/client";
import { useAuth } from "@/contexts/AuthContext";
import type { GameResult, MemoryCard } from "@/types/games";
import ScoreCard from "./ScoreCard";

const POINTS_PER_PAIR = 5;
const STREAK_BONUS = 3;
const DEFAULT_FLIP_BACK_DELAY = 1500;

interface Props {
  onBack: () => void;
  /** Pre-determined cards for VS mode */
  vsCards?: MemoryCard[];
  /** Called when VS game completes (instead of showing ScoreCard) */
  onVsComplete?: (result: GameResult) => void;
  /** Override flip-back delay in ms (default 1500; daily challenge uses shorter) */
  flipDelay?: number;
}

export default function MemoryMatch({ onBack, vsCards, onVsComplete, flipDelay }: Props) {
  const { user } = useAuth();
  const vsCardsRef = useRef(vsCards);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]); // indices of currently flipped cards (max 2)
  const [score, setScore] = useState(0);
  const [consecutiveMatches, setConsecutiveMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [pairsMatched, setPairsMatched] = useState(0);
  const [totalPairs, setTotalPairs] = useState(8);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [lastMatchedKey, setLastMatchedKey] = useState<string | null>(null);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVs = !!vsCardsRef.current;

  const initGame = useCallback(async () => {
    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    const pairs = 8;
    const deck = vsCardsRef.current || buildCardDeck(pairs);
    setCards(deck);
    setFlipped([]);
    setScore(0);
    setConsecutiveMatches(0);
    setMoves(0);
    setPairsMatched(0);
    setTotalPairs(pairs);
    setIsChecking(false);
    setResult(null);
    setLastMatchedKey(null);

    // Only create a DB match for solo mode
    if (user && !isVs) {
      try {
        const match = await createMatch(user.id, "memory_match", "solo", {
          totalPairs: pairs,
          gridSize: "standard",
        });
        setMatchId(match.id);
      } catch {
        // Game works without DB
      }
    }
  }, [user, isVs]);

  useEffect(() => {
    initGame();
    return () => {
      if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    };
  }, [initGame]);

  function handleCardTap(index: number) {
    if (isChecking) return;
    const card = cards[index];
    if (card.matched || card.flipped) return;
    if (flipped.length >= 2) return;

    // Flip the card
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], flipped: true };
    setCards(newCards);

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsChecking(true);

      const [first, second] = newFlipped;
      const cardA = newCards[first];
      const cardB = newCards[second];

      if (cardA.pairKey === cardB.pairKey) {
        // Match found
        const newConsecutive = consecutiveMatches + 1;
        const bonus = newConsecutive > 1 ? STREAK_BONUS : 0;
        const pointsEarned = POINTS_PER_PAIR + bonus;
        const newScore = score + pointsEarned;
        const newPairsMatched = pairsMatched + 1;

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.pairKey === cardA.pairKey ? { ...c, matched: true, flipped: true } : c
            )
          );
          setFlipped([]);
          setScore(newScore);
          setConsecutiveMatches(newConsecutive);
          setPairsMatched(newPairsMatched);
          setLastMatchedKey(cardA.pairKey);
          setIsChecking(false);

          // Check game over
          if (newPairsMatched === totalPairs) {
            const finalResult: GameResult = {
              gameType: "memory_match",
              score: newScore,
              pairsMatched: newPairsMatched,
              totalPairs,
              moves: moves + 1,
            };

            if (onVsComplete) {
              onVsComplete(finalResult);
            } else {
              setResult(finalResult);
              if (matchId && user) {
                finishMatch(matchId, newScore).catch(() => {});
                trackDailyActivity(user.id, moves + 1, true).catch(() => {});
              }
            }
          }
        }, 400);
      } else {
        // No match — flip back after delay
        setConsecutiveMatches(0);
        setLastMatchedKey(null);
        flipTimerRef.current = setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === first || i === second ? { ...c, flipped: false } : c
            )
          );
          setFlipped([]);
          setIsChecking(false);
        }, flipDelay ?? DEFAULT_FLIP_BACK_DELAY);
      }
    }
  }

  if (result) {
    return (
      <ScoreCard
        result={result}
        onPlayAgain={initGame}
        onBackToHub={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground min-h-[44px] px-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="text-right">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Pairs {pairsMatched}/{totalPairs}
          </p>
          <p className="text-2xl font-black text-foreground">{score} pts</p>
        </div>
      </div>

      {/* Streak indicator */}
      {consecutiveMatches > 1 && (
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-bold">
            {consecutiveMatches}x streak! +{STREAK_BONUS} bonus
          </span>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto w-full">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardTap(index)}
            disabled={card.matched || card.flipped || isChecking}
            aria-label={`Card ${index + 1}: ${card.matched ? card.label + ', matched' : card.flipped ? card.label : 'face down'}`}
            className={`aspect-square rounded-xl text-base sm:text-lg font-bold flex items-center justify-center transition-all duration-300 min-h-[64px] ${
              card.matched
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400 dark:border-emerald-700"
                : card.flipped
                ? lastMatchedKey === card.pairKey
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400"
                  : "bg-card text-foreground border-2 border-primary/30 shadow-sm"
                : "bg-primary/10 dark:bg-primary/20 text-transparent border-2 border-border hover:border-primary/50 hover:shadow-md active:scale-95"
            }`}
          >
            {card.flipped || card.matched ? card.label : "?"}
          </button>
        ))}
      </div>

      {/* Moves counter */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Moves: <span className="font-bold text-foreground">{moves}</span>
        </p>
      </div>
    </div>
  );
}
