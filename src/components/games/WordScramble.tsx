import { useState, useCallback, useEffect } from "react";
import { Lightbulb, Check, RotateCcw, ArrowLeft } from "lucide-react";
import { pickWords, scrambleWord } from "@/lib/games/helpers";
import { createMatch, finishMatch, recordMove, trackDailyActivity } from "@/lib/games/client";
import { useAuth } from "@/contexts/AuthContext";
import type { GameResult } from "@/types/games";
import ScoreCard from "./ScoreCard";

const TOTAL_ROUNDS = 5;
const POINTS_CORRECT = 10;
const POINTS_FIRST_TRY = 5;

interface RoundState {
  word: string;
  scrambled: string[];
  selected: number[]; // indices into scrambled that have been picked
  hintPositions: Set<number>; // positions in the answer that were hinted
  attempts: number;
  solved: boolean;
  score: number;
}

interface Props {
  onBack: () => void;
  /** Pre-determined words for VS mode */
  vsWords?: string[];
  /** Called when VS game completes (instead of showing ScoreCard) */
  onVsComplete?: (result: GameResult) => void;
}

export default function WordScramble({ onBack, vsWords, onVsComplete }: Props) {
  const { user } = useAuth();
  const [matchId, setMatchId] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [round, setRound] = useState<RoundState | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [perfectRounds, setPerfectRounds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const isVs = !!vsWords;

  const initGame = useCallback(async () => {
    const gameWords = vsWords || pickWords(TOTAL_ROUNDS);
    setWords(gameWords);
    setCurrentRound(0);
    setTotalScore(0);
    setPerfectRounds(0);
    setHintsUsed(0);
    setResult(null);
    setFeedback(null);
    initRound(gameWords[0]);

    // Only create a DB match for solo mode
    if (user && !isVs) {
      try {
        const match = await createMatch(user.id, "word_scramble", "solo", {
          words: gameWords,
          totalRounds: TOTAL_ROUNDS,
        });
        setMatchId(match.id);
      } catch {
        // Game works without DB — just skip persistence
      }
    }
  }, [user, isVs, vsWords]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  function initRound(word: string) {
    setRound({
      word,
      scrambled: scrambleWord(word),
      selected: [],
      hintPositions: new Set(),
      attempts: 0,
      solved: false,
      score: 0,
    });
    setFeedback(null);
  }

  function handleLetterTap(scrambledIndex: number) {
    if (!round || round.solved || feedback === "correct") return;
    if (round.selected.includes(scrambledIndex)) return;

    setRound((prev) => {
      if (!prev) return prev;
      return { ...prev, selected: [...prev.selected, scrambledIndex] };
    });
  }

  function handleAnswerTap(position: number) {
    if (!round || round.solved || feedback === "correct") return;
    // Don't allow removing hinted letters
    if (round.hintPositions.has(position)) return;

    setRound((prev) => {
      if (!prev) return prev;
      const newSelected = [...prev.selected];
      // Find which selected index corresponds to this answer position
      // Position in answer = index in selected array (accounting for hints)
      let answerPos = 0;
      let removeIdx = -1;
      for (let i = 0; i < newSelected.length; i++) {
        if (answerPos === position) {
          removeIdx = i;
          break;
        }
        answerPos++;
      }
      if (removeIdx >= 0) {
        newSelected.splice(removeIdx, 1);
      }
      return { ...prev, selected: newSelected };
    });
  }

  function handleHint() {
    if (!round || round.solved) return;
    const word = round.word;
    // Find next position that isn't already hinted
    for (let i = 0; i < word.length; i++) {
      if (!round.hintPositions.has(i)) {
        // Find the scrambled index that has this letter and isn't selected
        const letter = word[i];
        const availableIdx = round.scrambled.findIndex(
          (l, idx) => l === letter && !round.selected.includes(idx)
        );
        if (availableIdx >= 0) {
          setRound((prev) => {
            if (!prev) return prev;
            const newHints = new Set(prev.hintPositions);
            newHints.add(i);
            // Insert this letter at the correct position in selected
            const newSelected = [...prev.selected];
            // We need to place it so it ends up at position i
            newSelected.splice(i, 0, availableIdx);
            return { ...prev, selected: newSelected, hintPositions: newHints };
          });
          setHintsUsed((h) => h + 1);
        }
        break;
      }
    }
  }

  function handleClear() {
    if (!round || round.solved) return;
    setRound((prev) => {
      if (!prev) return prev;
      // Keep hinted letters, clear the rest
      if (prev.hintPositions.size === 0) {
        return { ...prev, selected: [] };
      }
      // Rebuild selected to only include hinted positions
      const newSelected: number[] = [];
      const word = prev.word;
      for (let i = 0; i < word.length; i++) {
        if (prev.hintPositions.has(i)) {
          // Find the scrambled index for this hinted letter
          const letter = word[i];
          const idx = prev.scrambled.findIndex(
            (l, si) => l === letter && !newSelected.includes(si)
          );
          if (idx >= 0) newSelected.push(idx);
        }
      }
      return { ...prev, selected: newSelected };
    });
  }

  async function handleSubmit() {
    if (!round || round.selected.length !== round.word.length) return;

    const answer = round.selected.map((i) => round.scrambled[i]).join("");
    const isCorrect = answer === round.word;
    const newAttempts = round.attempts + 1;

    if (isCorrect) {
      const roundScore = POINTS_CORRECT + (newAttempts === 1 ? POINTS_FIRST_TRY : 0);
      const newTotal = totalScore + roundScore;
      const newPerfect = newAttempts === 1 ? perfectRounds + 1 : perfectRounds;

      setRound((prev) => prev ? { ...prev, solved: true, attempts: newAttempts, score: roundScore } : prev);
      setTotalScore(newTotal);
      setPerfectRounds(newPerfect);
      setFeedback("correct");

      // Record move
      if (matchId && user) {
        recordMove(matchId, user.id, currentRound + 1, {
          word: round.word,
          answer,
          correct: true,
          attempts: newAttempts,
          hintUsed: round.hintPositions.size > 0,
          score: roundScore,
        }).catch(() => {});
      }

      // Advance after delay
      setTimeout(() => {
        const nextRound = currentRound + 1;
        if (nextRound < TOTAL_ROUNDS) {
          setCurrentRound(nextRound);
          initRound(words[nextRound]);
        } else {
          // Game over
          const finalResult: GameResult = {
            gameType: "word_scramble",
            score: newTotal,
            rounds: TOTAL_ROUNDS,
            perfectRounds: newPerfect,
            hintsUsed,
          };

          if (onVsComplete) {
            // VS mode — hand result back to MatchPage
            onVsComplete(finalResult);
          } else {
            setResult(finalResult);
            // Save to DB (solo only)
            if (matchId && user) {
              finishMatch(matchId, newTotal).catch(() => {});
              trackDailyActivity(user.id, TOTAL_ROUNDS, true).catch(() => {});
            }
          }
        }
      }, 1200);
    } else {
      setRound((prev) => prev ? { ...prev, attempts: newAttempts } : prev);
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 800);
    }
  }

  // Build the answer display
  function getAnswerLetters(): (string | null)[] {
    if (!round) return [];
    const slots: (string | null)[] = Array(round.word.length).fill(null);
    round.selected.forEach((scrambledIdx, pos) => {
      if (pos < slots.length) {
        slots[pos] = round.scrambled[scrambledIdx];
      }
    });
    return slots;
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

  if (!round) return null;

  const answerLetters = getAnswerLetters();
  const allPlaced = round.selected.length === round.word.length;

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
            Round {currentRound + 1} of {TOTAL_ROUNDS}
          </p>
          <p className="text-2xl font-black text-foreground">{totalScore} pts</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-lg font-bold text-foreground">Unscramble the word</p>
        <p className="text-sm text-muted-foreground mt-1">Tap letters in order to spell the word</p>
      </div>

      {/* Answer slots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {answerLetters.map((letter, i) => {
          const isHinted = round.hintPositions.has(i);
          return (
            <button
              key={i}
              onClick={() => letter && !isHinted ? handleAnswerTap(i) : undefined}
              disabled={!letter || isHinted}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl font-black flex items-center justify-center transition-all ${
                letter
                  ? isHinted
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700"
                    : feedback === "correct"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400"
                    : feedback === "wrong"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-400 animate-shake"
                    : "bg-card text-foreground border-2 border-primary/30 shadow-sm"
                  : "bg-muted/50 border-2 border-dashed border-border"
              }`}
            >
              {letter || ""}
            </button>
          );
        })}
      </div>

      {/* Scrambled letters */}
      <div className="flex justify-center gap-2 flex-wrap mt-2">
        {round.scrambled.map((letter, i) => {
          const isUsed = round.selected.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleLetterTap(i)}
              disabled={isUsed || round.solved}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl font-black flex items-center justify-center transition-all ${
                isUsed
                  ? "bg-muted/30 text-muted-foreground/30 border-2 border-transparent"
                  : "bg-card text-foreground border-2 border-border shadow-sm hover:border-primary hover:shadow-md active:scale-95"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center mt-2">
        <button
          onClick={handleHint}
          disabled={round.solved || round.hintPositions.size >= round.word.length - 1}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold border-2 border-border text-muted-foreground hover:bg-muted min-h-[52px] transition-colors disabled:opacity-40"
        >
          <Lightbulb className="w-5 h-5" />
          Hint
        </button>
        <button
          onClick={handleClear}
          disabled={round.solved || round.selected.length === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold border-2 border-border text-muted-foreground hover:bg-muted min-h-[52px] transition-colors disabled:opacity-40"
        >
          <RotateCcw className="w-5 h-5" />
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!allPlaced || round.solved}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-primary text-primary-foreground min-h-[52px] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Check className="w-5 h-5" />
          Submit
        </button>
      </div>
    </div>
  );
}
