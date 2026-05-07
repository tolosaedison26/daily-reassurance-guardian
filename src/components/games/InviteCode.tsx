import { useState, useRef } from "react";
import { Copy, Check } from "lucide-react";

interface DisplayProps {
  mode: "display";
  code: string;
}

interface EntryProps {
  mode: "entry";
  onSubmit: (code: string) => void;
  error?: string | null;
  loading?: boolean;
}

type Props = DisplayProps | EntryProps;

export default function InviteCode(props: Props) {
  if (props.mode === "display") return <DisplayCode code={props.code} />;
  return <EntryCode onSubmit={props.onSubmit} error={props.error} loading={props.loading} />;
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Clipboard API failed — try fallback
  }
  return fallbackCopy(text);
}

function DisplayCode({ code }: { code: string }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const joinUrl = `${window.location.origin}/games/join?code=${code}`;

  async function handleCopyCode() {
    const ok = await copyText(code);
    if (ok) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  async function handleCopyLink() {
    const ok = await copyText(joinUrl);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Play a game with me!",
          text: `Join my game on Daily Guardian! Use code ${code} or tap the link:`,
          url: joinUrl,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    // Fallback: copy link
    handleCopyLink();
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
        Your invite code
      </p>

      {/* Code boxes */}
      <div className="flex items-center gap-2">
        {code.split("").map((char, i) => (
          <span
            key={i}
            className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-card border-2 border-primary/30 flex items-center justify-center text-2xl sm:text-3xl font-black text-foreground shadow-sm"
          >
            {char}
          </span>
        ))}
        <button
          onClick={handleCopyCode}
          aria-label="Copy invite code"
          className="ml-1 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors min-h-[44px]"
        >
          {codeCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {codeCopied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Shareable link — visible to user */}
      <div className="w-full max-w-sm">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 text-center">
          Or share this link
        </p>
        <div className="flex items-center gap-2 w-full bg-muted/60 border border-border rounded-xl px-3 py-2.5">
          <span className="flex-1 text-sm text-muted-foreground font-medium truncate select-all">
            {joinUrl}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity min-h-[52px]"
          >
            {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {linkCopied ? "Link Copied!" : "Copy Link"}
          </button>
          {navigator.share !== undefined && (
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-border font-bold text-base text-foreground hover:bg-muted transition-colors min-h-[52px]"
            >
              Share
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground/70">Link expires in 48 hours</p>
    </div>
  );
}

function EntryCode({
  onSubmit,
  error,
  loading,
}: {
  onSubmit: (code: string) => void;
  error?: string | null;
  loading?: boolean;
}) {
  const [chars, setChars] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const newChars = [...chars];
    newChars[index] = char;
    setChars(newChars);

    // Auto-advance
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (char && index === 5 && newChars.every((c) => c)) {
      onSubmit(newChars.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !chars[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const code = chars.join("");
      if (code.length === 6) onSubmit(code);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    const newChars = [...chars];
    for (let i = 0; i < 6; i++) {
      newChars[i] = pasted[i] || "";
    }
    setChars(newChars);
    if (pasted.length === 6) {
      onSubmit(pasted);
    } else {
      inputsRef.current[pasted.length]?.focus();
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
        Enter invite code
      </p>
      <div className="flex items-center gap-2">
        {chars.map((char, i) => (
          <input
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={char}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={loading}
            aria-label={`Invite code character ${i + 1} of 6`}
            className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-card border-2 border-border focus:border-primary text-center text-2xl sm:text-3xl font-black text-foreground outline-none transition-colors"
          />
        ))}
      </div>
      {error && (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
      )}
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Enter the 6-character code from your friend to join their game.
      </p>
    </div>
  );
}
