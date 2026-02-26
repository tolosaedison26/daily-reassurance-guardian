import { useState } from "react";
import { ShieldCheck, CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AcknowledgmentCardProps {
  seniorName: string;
  seniorAge: number;
  missedTime: string;
  alertSentTime: string;
  contactName: string;
  contactRelationship: string;
  seniorPhone: string;
}

export default function AcknowledgmentCard({
  seniorName,
  seniorAge,
  missedTime,
  alertSentTime,
  contactName,
  contactRelationship,
  seniorPhone,
}: AcknowledgmentCardProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );

  if (acknowledged) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card p-8 text-center max-w-md mx-auto">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: "hsl(var(--status-checked) / 0.12)",
            animation: "scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
        </div>

        <h2 className="text-2xl font-black">Acknowledged</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Thank you, {contactName.split(" ")[0]}. Escalation stopped. Logged {ackTime}.
        </p>

        <div
          className="rounded-xl p-4 mt-5 text-left text-sm space-y-1"
          style={{ background: "hsl(var(--status-checked) / 0.06)" }}
        >
          <p style={{ color: "hsl(var(--status-checked))" }}>✓ Escalation stopped</p>
          <p style={{ color: "hsl(var(--status-checked))" }}>✓ Contact #2 will not be alerted</p>
        </div>

        <a href={`tel:${seniorPhone}`} className="block mt-5">
          <Button variant="outline" className="w-full h-14 font-black rounded-xl text-base">
            <Phone className="w-5 h-5 mr-2" />
            Call {seniorName.split(" ")[0]} — {seniorPhone}
          </Button>
        </a>

        <p className="text-xs text-muted-foreground mt-4">
          If {seniorName.split(" ")[0]} needs emergency help, call 911.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-8 text-center max-w-md mx-auto">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "hsl(var(--primary) / 0.12)" }}
      >
        <ShieldCheck className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
      </div>

      <h2 className="text-2xl font-black">Confirm You're Handling This</h2>
      <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
        By tapping below, you confirm you are personally checking on{" "}
        <strong>{seniorName}</strong> and that no further automated alerts need to be sent.
      </p>

      {/* Info box */}
      <div className="rounded-xl border border-border p-4 mt-5 text-left text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Senior</span>
          <span className="font-black">{seniorName}, {seniorAge}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Missed check-in</span>
          <span className="font-black">Today at {missedTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Alert sent</span>
          <span className="font-black">{alertSentTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Your name</span>
          <span className="font-black">{contactName} ({contactRelationship})</span>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={() => setAcknowledged(true)}
        className="w-full h-16 mt-6 font-black rounded-xl border-0 text-base"
        style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
      >
        ✓ I'm Handling This — Stop All Alerts
      </Button>
      <p className="text-xs text-muted-foreground mt-3">
        This will immediately halt escalation to other contacts.
      </p>
    </div>
  );
}
