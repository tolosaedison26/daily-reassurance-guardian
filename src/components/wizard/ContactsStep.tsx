import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Info } from "lucide-react";
import ContactCard from "./ContactCard";
import type { SeniorFormData, EmergencyContact } from "./types";

interface Props {
  data: SeniorFormData;
  onChange: (patch: Partial<SeniorFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}

export default function ContactsStep({ data, onChange, onNext, onBack, errors }: Props) {
  const contacts = data.contacts;

  const updateContact = (idx: number, updated: EmergencyContact) => {
    const next = [...contacts];
    next[idx] = updated;
    onChange({ contacts: next });
  };

  const removeContact = (idx: number) => {
    onChange({ contacts: contacts.filter((_, i) => i !== idx) });
  };

  const addContact = () => {
    if (contacts.length >= 3) return;
    const defaultDelay = contacts.length === 1 ? 30 : 60;
    onChange({
      contacts: [
        ...contacts,
        {
          id: crypto.randomUUID(),
          name: "",
          relationship: "",
          phone: "",
          email: "",
          notifyViaSms: true,
          notifyViaEmail: false,
          delayMinutes: defaultDelay,
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div
        className="flex items-start gap-3 rounded-xl p-3 text-sm"
        style={{
          background: "hsl(var(--status-pending) / 0.08)",
          border: "1px solid hsl(var(--status-pending) / 0.2)",
        }}
      >
        <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
        <span className="text-muted-foreground">
          We'll wait 30 minutes between each contact attempt before moving to the next person.
        </span>
      </div>

      {/* Contact cards */}
      {contacts.map((contact, i) => (
        <div key={contact.id}>
          {i > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              → if no response within {contacts[i - 1]?.delayMinutes || 30} min
            </p>
          )}
          <ContactCard
            contact={contact}
            index={i}
            totalContacts={contacts.length}
            onChange={(u) => updateContact(i, u)}
            onRemove={() => removeContact(i)}
            errors={errors[`contact_${i}`] ? JSON.parse(errors[`contact_${i}`]) : {}}
          />
        </div>
      ))}

      {contacts.length < 3 && (
        <button
          type="button"
          onClick={addContact}
          className="w-full border-2 border-dashed border-input rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-4 h-4" /> Add another contact
        </button>
      )}

      {errors.contacts && (
        <p className="text-xs text-destructive">{errors.contacts}</p>
      )}

      {/* Nav */}
      <div className="flex flex-col-reverse md:flex-row gap-3 justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={onNext} className="w-full md:w-auto gap-1">
          Continue → Review <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
