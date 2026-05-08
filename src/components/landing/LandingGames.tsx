import { useState, useCallback } from "react";
import { Gamepad2, Users, Calendar, Trophy, RotateCcw } from "lucide-react";
import { useInView } from "@/hooks/useInView";

// Word scramble demo: "PLAY" scrambled as A-L-P-Y
// User taps: P(idx 2) → L(idx 1) → A(idx 0) → Y(idx 3)
const DEMO_WORD = "PLAY";
const DEMO_SCRAMBLED = ["A", "L", "P", "Y"];

type DemoStatus = "idle" | "correct" | "wrong";

export default function LandingGames() {
  const { ref, isVisible } = useInView(0.08);
  const [selected, setSelected] = useState<number[]>([]);
  const [status, setStatus] = useState<DemoStatus>("idle");

  const handleTileClick = useCallback(
    (idx: number) => {
      if (status !== "idle") return;
      if (selected.includes(idx)) return;

      const next = [...selected, idx];
      setSelected(next);

      if (next.length === DEMO_WORD.length) {
        const answer = next.map((i) => DEMO_SCRAMBLED[i]).join("");
        if (answer === DEMO_WORD) {
          setStatus("correct");
          setTimeout(() => { setSelected([]); setStatus("idle"); }, 2400);
        } else {
          setStatus("wrong");
          setTimeout(() => { setSelected([]); setStatus("idle"); }, 900);
        }
      }
    },
    [selected, status]
  );

  const handleClear = useCallback(() => {
    if (status !== "idle") return;
    setSelected([]);
  }, [status]);

  const answerSlots = Array.from({ length: DEMO_WORD.length }, (_, pos) =>
    pos < selected.length ? DEMO_SCRAMBLED[selected[pos]] : null
  );

  return (
    <section id="games" className="py-16 sm:py-20 md:py-24 bg-background relative overflow-hidden">
      {/* Subtle decorative accent — brand orange, very low opacity */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.04)", filter: "blur(100px)", transform: "translate(30%, -30%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "hsl(var(--primary) / 0.03)", filter: "blur(80px)", transform: "translate(-30%, 30%)" }}
      />

      <div ref={ref} className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <div className={`fade-up text-center max-w-2xl mx-auto ${isVisible ? "visible" : ""}`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.1)" }}
            >
              <Gamepad2 className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Brain Games
            </span>
          </div>

          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
            style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}
          >
            Keep your mind sharp — every day.
          </h2>

          <p
            className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto"
            style={{ lineHeight: "1.7" }}
          >
            Two brain games included at no extra cost. Play solo at your own pace, challenge a friend or family member to a VS match, and tackle a fresh daily puzzle every morning.
          </p>
        </div>

        {/* Interactive demo */}
        <div
          className={`fade-up mt-10 sm:mt-12 mx-auto max-w-sm ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "150ms" }}
        >
          <div
            className="bg-card rounded-2xl border border-border/60 overflow-hidden"
            style={{ boxShadow: "0 8px 32px -8px hsl(220 30% 20% / 0.12)" }}
          >
            {/* Demo card header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/60">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Word Scramble
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">Round 1 of 5</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Score</p>
                <p
                  className="text-xl font-black"
                  style={{ color: status === "correct" ? "hsl(var(--status-checked))" : "hsl(var(--foreground))" }}
                >
                  {status === "correct" ? "15" : "0"} pts
                </p>
              </div>
            </div>

            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Unscramble the letters to find the 4-letter word
              </p>

              {/* Answer slots */}
              <div className="flex justify-center gap-2.5">
                {answerSlots.map((letter, i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-xl text-2xl font-black flex items-center justify-center border-2 transition-all duration-200 select-none ${
                      status === "correct"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-400"
                        : status === "wrong"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-400"
                        : letter
                        ? "bg-card text-foreground shadow-sm"
                        : "bg-muted/40 text-transparent"
                    } ${
                      letter && status === "idle"
                        ? "border-primary/30"
                        : !letter
                        ? "border-dashed border-border"
                        : ""
                    }`}
                  >
                    {letter || ""}
                  </div>
                ))}
              </div>

              {/* Status messages */}
              {status === "correct" && (
                <div className="text-center animate-bounce-in">
                  <p className="text-base font-black" style={{ color: "hsl(var(--status-checked))" }}>
                    Correct! +15 pts
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Resetting in a moment…</p>
                </div>
              )}
              {status === "wrong" && (
                <div className="text-center animate-bounce-in">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">Try again!</p>
                </div>
              )}

              {/* Scrambled letter tiles */}
              <div className="flex justify-center gap-2.5">
                {DEMO_SCRAMBLED.map((letter, i) => {
                  const isUsed = selected.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => handleTileClick(i)}
                      disabled={isUsed || status !== "idle"}
                      aria-label={`Letter ${letter}${isUsed ? ", placed" : ""}`}
                      className={`w-14 h-14 rounded-xl text-2xl font-black flex items-center justify-center border-2 transition-all duration-150 select-none ${
                        isUsed
                          ? "bg-muted/20 text-muted-foreground/20 border-transparent cursor-not-allowed"
                          : "bg-card text-foreground border-border shadow-sm hover:border-primary hover:shadow-md active:scale-95 cursor-pointer"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Clear + hint row */}
              <div className="flex items-center justify-center gap-4 min-h-[36px]">
                {selected.length > 0 && status === "idle" ? (
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted min-h-[36px] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                ) : status === "idle" ? (
                  <p className="text-xs text-muted-foreground">
                    Tap the letters above in the right order
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Try it — tap to unscramble the letters
          </p>
        </div>

        {/* Feature cards */}
        <div
          className={`fade-up mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "280ms" }}
        >
          {/* Solo */}
          <div className="bg-card rounded-xl border border-border/60 p-5 flex gap-4 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-card">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary) / 0.1)" }}
            >
              <Trophy className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Solo Practice</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ lineHeight: "1.6" }}>
                Play Word Scramble or Memory Match at your own pace. No timer, no pressure — just you and the game.
              </p>
            </div>
          </div>

          {/* VS */}
          <div className="bg-card rounded-xl border border-border/60 p-5 flex gap-4 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-card">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(142 60% 40% / 0.1)" }}
            >
              <Users className="w-5 h-5" style={{ color: "hsl(142 60% 40%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Challenge Friends</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ lineHeight: "1.6" }}>
                Share a 6-character invite code with a friend or family member. You both solve the same puzzle — highest score wins!
              </p>
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="bg-card rounded-xl border border-border/60 p-5 flex gap-4 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-card">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(38 95% 50% / 0.1)" }}
            >
              <Calendar className="w-5 h-5" style={{ color: "hsl(38 95% 50%)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Daily Challenge</p>
              <p className="text-xs text-muted-foreground mt-1" style={{ lineHeight: "1.6" }}>
                A harder puzzle resets every morning — the same for everyone. Build your streak and keep your mind active day after day.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
