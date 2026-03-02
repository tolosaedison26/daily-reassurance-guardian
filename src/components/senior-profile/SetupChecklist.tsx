import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Circle, X } from "lucide-react";

interface SetupChecklistProps {
  seniorId: string;
  profileCreated: boolean;
  scheduleSet: boolean;
  contactAdded: boolean;
  testCheckinDone: boolean;
}

export default function SetupChecklist({ seniorId, profileCreated, scheduleSet, contactAdded, testCheckinDone }: SetupChecklistProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`checklist_dismissed_${seniorId}`) === "true";
  });

  if (dismissed) return null;

  const allDone = profileCreated && scheduleSet && contactAdded && testCheckinDone;
  if (allDone) return null;

  const items = [
    { label: "Senior profile created", done: profileCreated, onClick: undefined },
    { label: "Check-in schedule set", done: scheduleSet, onClick: undefined },
    { label: "Emergency contact added", done: contactAdded, onClick: () => navigate(`/seniors/${seniorId}/contacts`) },
    { label: "Test check-in completed", done: testCheckinDone, onClick: undefined },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(`checklist_dismissed_${seniorId}`, "true");
    setDismissed(true);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-black text-base">Setup Progress</p>
        <button
          onClick={handleDismiss}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={item.onClick}
            disabled={!item.onClick}
            className="flex items-center gap-2 w-full text-left min-h-[36px] hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors disabled:cursor-default"
          >
            {item.done ? (
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--status-checked))" }} />
            ) : (
              <Circle
                className="w-4 h-4 shrink-0"
                style={{ color: item.label.includes("Emergency") && !item.done ? "hsl(var(--status-pending))" : "hsl(var(--muted-foreground))" }}
              />
            )}
            <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "font-semibold"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "hsl(var(--status-checked))" }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">{progress}%</span>
      </div>
    </div>
  );
}
