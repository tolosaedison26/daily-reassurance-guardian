import { Phone, Mail, MessageSquare } from "lucide-react";

interface EscalationStep {
  level: number;
  contactName: string;
  relationship: string;
  channels: ("sms" | "email")[];
  status: "active" | "pending" | "completed" | "stopped";
  timeSent?: string;
  scheduledTime?: string;
  countdownText?: string;
}

interface EscalationLadderProps {
  steps: EscalationStep[];
}

const channelIcon = {
  sms: <MessageSquare className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
};

const channelLabel = { sms: "SMS", email: "Email" };

export default function EscalationLadder({ steps }: EscalationLadderProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <p className="font-black text-base mb-5">Escalation Status</p>
      <div className="relative">
        {steps.map((step, i) => {
          const isActive = step.status === "active";
          const isCompleted = step.status === "completed";
          const isPending = step.status === "pending";
          const isStopped = step.status === "stopped";
          const isLast = i === steps.length - 1;

          return (
            <div key={step.level} className="flex gap-4 relative">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className="absolute left-[13px] top-[28px] w-0.5 bottom-0"
                  style={{
                    background: isActive || isCompleted
                      ? "hsl(var(--status-alert) / 0.4)"
                      : "hsl(var(--border))",
                  }}
                />
              )}

              {/* Step circle */}
              <div className="shrink-0 z-10 mt-0.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={{
                    background: isActive
                      ? "hsl(var(--status-alert))"
                      : isCompleted
                      ? "hsl(var(--status-checked))"
                      : isStopped
                      ? "hsl(var(--muted))"
                      : "hsl(var(--muted))",
                    color: isActive || isCompleted ? "#fff" : "hsl(var(--muted-foreground))",
                    animation: isActive ? "pulse-alert 2s ease-in-out infinite" : undefined,
                    opacity: isStopped ? 0.6 : 1,
                  }}
                >
                  {step.level}
                </div>
              </div>

              {/* Step content */}
              <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-6"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-sm">
                    Contact #{step.level} — {step.contactName}
                  </p>
                  <span className="text-xs text-muted-foreground">({step.relationship})</span>
                </div>

                {/* Channels */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {step.channels.map((ch) => (
                    <span
                      key={ch}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                    >
                      {channelIcon[ch]} {channelLabel[ch]}
                    </span>
                  ))}
                  {step.timeSent && (
                    <span className="text-xs text-muted-foreground">· Sent {step.timeSent}</span>
                  )}
                </div>

                {/* Status badge */}
                <div className="mt-2">
                  {isActive && (
                    <>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black"
                        style={{
                          background: "hsl(var(--status-pending) / 0.12)",
                          color: "hsl(var(--status-pending))",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--status-pending))" }} />
                        Waiting for response
                      </span>
                      {step.countdownText && (
                        <p className="text-xs text-muted-foreground mt-1.5">{step.countdownText}</p>
                      )}
                    </>
                  )}
                  {isPending && (
                    <p className="text-xs text-muted-foreground">
                      Will be alerted if previous contact doesn't respond
                      {step.scheduledTime && ` · Scheduled ${step.scheduledTime}`}
                    </p>
                  )}
                  {isStopped && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black"
                      style={{
                        background: "hsl(var(--muted))",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      ✕ Cancelled
                    </span>
                  )}
                  {isCompleted && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black"
                      style={{
                        background: "hsl(var(--status-checked) / 0.12)",
                        color: "hsl(var(--status-checked))",
                      }}
                    >
                      ✓ Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
