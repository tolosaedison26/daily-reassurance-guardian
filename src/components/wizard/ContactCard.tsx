import { Input } from "@/components/ui/input";
import { X, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmergencyContact } from "./types";

interface ContactCardProps {
  contact: EmergencyContact;
  index: number;
  totalContacts: number;
  onChange: (updated: EmergencyContact) => void;
  onRemove: () => void;
  errors?: Record<string, string>;
}

const PRIORITY_COLORS = [
  "hsl(var(--status-alert))",
  "hsl(var(--status-pending))",
  "hsl(var(--muted-foreground))",
];

const DELAY_OPTIONS = [
  { label: "Immediately", value: 0 },
  { label: "+30 min", value: 30 },
  { label: "+60 min", value: 60 },
];

export default function ContactCard({ contact, index, totalContacts, onChange, onRemove, errors = {} }: ContactCardProps) {
  const canRemove = totalContacts > 1;
  const isFirst = index === 0;

  const update = (patch: Partial<EmergencyContact>) => onChange({ ...contact, ...patch });

  return (
    <div className="bg-card rounded-xl border border-border p-4 relative space-y-3">
      {/* Priority badge + remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: PRIORITY_COLORS[index] || PRIORITY_COLORS[2] }}
          >
            {index + 1}
          </span>
          <span className="text-sm font-bold">Contact {index + 1}</span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
            aria-label="Remove contact"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
          <Input
            placeholder="Contact name"
            value={contact.name}
            onChange={(e) => update({ name: e.target.value })}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Relationship</label>
          <Input
            placeholder="e.g. Daughter, Neighbor"
            value={contact.relationship}
            onChange={(e) => update({ relationship: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
          <Input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={contact.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={contact.email}
            onChange={(e) => update({ email: e.target.value })}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Notify via */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notify via</label>
        <div className="flex gap-2">
          {[
            { key: "notifyViaSms" as const, label: "SMS", icon: Phone },
            { key: "notifyViaEmail" as const, label: "Email", icon: Mail },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                const other = key === "notifyViaSms" ? "notifyViaEmail" : "notifyViaSms";
                // Ensure at least one stays on
                if (contact[key] && !contact[other]) return;
                update({ [key]: !contact[key] });
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                contact[key]
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-input hover:bg-muted"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        {errors.channel && <p className="text-xs text-destructive mt-1">{errors.channel}</p>}
      </div>

      {/* Delay */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Delay before notifying</label>
        {isFirst ? (
          <span className="text-xs font-medium text-muted-foreground italic">Always immediately (first contact)</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {DELAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ delayMinutes: opt.value })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                  contact.delayMinutes === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-input hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
