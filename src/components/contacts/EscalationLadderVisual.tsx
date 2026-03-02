import { ArrowDown, MessageSquare, Mail } from "lucide-react";
import type { ContactData } from "./ContactCard";

interface EscalationLadderVisualProps {
  contacts: ContactData[];
  delayMinutes: number;
}

const priorityColors = ["hsl(0 72% 51%)", "hsl(36 90% 50%)", "hsl(220 10% 50%)"];

export default function EscalationLadderVisual({ contacts, delayMinutes }: EscalationLadderVisualProps) {
  const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <p className="font-black text-base mb-1">Escalation Order</p>
      <p className="text-xs text-muted-foreground mb-5">
        If a check-in is missed, we'll notify contacts in this order.
      </p>
      <div className="space-y-0">
        {sorted.map((contact, i) => {
          const color = priorityColors[Math.min(i, 2)];
          const cumulativeDelay = i === 0 ? 0 : delayMinutes * i;
          const delayLabel = cumulativeDelay === 0 ? "Notified immediately" : `Notified at +${cumulativeDelay} min`;
          const isLast = i === sorted.length - 1;

          return (
            <div key={contact.id}>
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: color, color: "#fff" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm">
                    {contact.name}{" "}
                    <span className="font-normal text-muted-foreground">({contact.relationship})</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {contact.notifyViaSms && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" /> SMS
                      </span>
                    )}
                    {contact.notifyViaEmail && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" /> Email
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{delayLabel}</span>
              </div>

              {/* Connector arrow */}
              {!isLast && (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-7 flex justify-center">
                    <ArrowDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    if no response within {delayMinutes} min
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
