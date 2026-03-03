import { useState, useEffect } from "react";
import { Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  name: string;
  relationship: string | null;
  sort_order: number;
}

interface SeniorEmergencyContactsCardProps {
  seniorId: string;
  onViewSettings?: () => void;
}

export default function SeniorEmergencyContactsCard({ seniorId, onViewSettings }: SeniorEmergencyContactsCardProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, [seniorId]);

  const loadContacts = async () => {
    const { data } = await supabase
      .from("emergency_contacts")
      .select("id, name, relationship, sort_order")
      .eq("senior_id", seniorId)
      .order("sort_order", { ascending: true });

    if (data) {
      setContacts(data);
    }
    setLoading(false);
  };

  if (loading) return null;

  const priorityColors = [
    "hsl(var(--status-alert))",
    "hsl(var(--status-pending))",
    "hsl(var(--muted-foreground))",
  ];

  return (
    <div className="w-full rounded-2xl bg-card border border-border shadow-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="font-bold" style={{ fontSize: "18px" }}>My Emergency Contacts</h2>
      </div>

      {contacts.length === 0 ? (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
            <div>
              <p className="font-semibold" style={{ fontSize: "16px", color: "hsl(var(--status-pending))" }}>No emergency contacts set up yet.</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "16px", lineHeight: "24px" }}>Ask your caregiver to add someone who can be notified if you miss a check-in.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground" style={{ fontSize: "16px", lineHeight: "24px" }}>If I miss a check-in, these people are notified automatically — in order:</p>
          <div className="space-y-2">
            {contacts.map((contact, i) => (
              <div key={contact.id} className="flex items-center gap-3 py-2">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: priorityColors[i] || priorityColors[2] }}>{i + 1}</span>
                <p className="font-semibold" style={{ fontSize: "16px" }}>{contact.name}{contact.relationship && (<span className="text-muted-foreground font-normal"> · {contact.relationship}</span>)}</p>
              </div>
            ))}
          </div>
          {onViewSettings && (
            <button onClick={onViewSettings} className="text-sm font-bold min-h-[48px] flex items-center" style={{ color: "hsl(var(--primary))" }}>View in Settings →</button>
          )}
        </>
      )}
    </div>
  );
}
