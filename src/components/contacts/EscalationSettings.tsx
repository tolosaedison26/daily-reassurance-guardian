import { useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface EscalationSettingsProps {
  delayMinutes: number;
  setDelayMinutes: (v: number) => void;
  loopEnabled: boolean;
  setLoopEnabled: (v: boolean) => void;
  enable911: boolean;
  setEnable911: (v: boolean) => void;
  quietHoursEnabled: boolean;
  setQuietHoursEnabled: (v: boolean) => void;
  quietFrom: string;
  setQuietFrom: (v: string) => void;
  quietUntil: string;
  setQuietUntil: (v: string) => void;
  isMobile: boolean;
}

const delayOptions = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
  { label: "2 hrs", value: 120 },
];

export default function EscalationSettings(props: EscalationSettingsProps) {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(props.isMobile);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => props.isMobile && setCollapsed(!collapsed)}
      >
        <p className="font-black text-base">Escalation Rules</p>
        {props.isMobile && (
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-180"}`} />
        )}
      </button>

      {(!collapsed || !props.isMobile) && (
        <div className="mt-5 space-y-6">
          {/* Delay between contacts */}
          <div>
            <p className="font-bold text-sm mb-1">Time between each escalation step</p>
            <p className="text-xs text-muted-foreground mb-3">How long to wait for a response before notifying the next contact</p>
            <div className="flex flex-wrap gap-2">
              {delayOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => props.setDelayMinutes(opt.value)}
                  className="px-4 py-2 rounded-full text-xs font-black transition-colors"
                  style={{
                    background: props.delayMinutes === opt.value ? "hsl(var(--primary))" : "hsl(var(--muted))",
                    color: props.delayMinutes === opt.value ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loop escalation */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-sm">Restart escalation loop if no one responds</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {props.loopEnabled
                  ? "We'll restart from Contact 1 after all contacts have been tried"
                  : "Escalation stops after the last contact is notified"}
              </p>
            </div>
            <Switch checked={props.loopEnabled} onCheckedChange={props.setLoopEnabled} />
          </div>

          {/* 911 */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Enable 911 last-resort alert</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {props.enable911
                    ? "If no contact responds, we'll display a prompt to call 911. We do not auto-call emergency services."
                    : "Disabled"}
                </p>
              </div>
              <Switch checked={props.enable911} onCheckedChange={props.setEnable911} />
            </div>
            {props.enable911 && (
              <div
                className="mt-3 rounded-xl p-3 flex items-start gap-2 text-xs"
                style={{ background: "hsl(var(--status-alert) / 0.08)", color: "hsl(var(--status-alert))" }}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>This feature reminds you to call 911 — it does not make the call automatically.</span>
              </div>
            )}
          </div>

          {/* Quiet hours */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Quiet Hours</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Contacts won't be notified during these hours (held until quiet hours end)
                </p>
              </div>
              <Switch checked={props.quietHoursEnabled} onCheckedChange={props.setQuietHoursEnabled} />
            </div>
            {props.quietHoursEnabled && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <Input type="time" value={props.quietFrom} onChange={(e) => props.setQuietFrom(e.target.value)} className="rounded-xl" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Until</label>
                  <Input type="time" value={props.quietUntil} onChange={(e) => props.setQuietUntil(e.target.value)} className="rounded-xl" />
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <Button
              className="rounded-xl font-black"
              onClick={() => toast({ title: "Escalation settings updated." })}
            >
              Save Escalation Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
