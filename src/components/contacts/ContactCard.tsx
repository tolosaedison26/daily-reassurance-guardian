import { GripVertical, Pencil, Trash2, ChevronUp, ChevronDown, Phone, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface ContactData {
  id: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  notifyViaSms: boolean;
  notifyViaEmail: boolean;
  delayMinutes: number;
  sortOrder: number;
}

interface ContactCardProps {
  contact: ContactData;
  index: number;
  total: number;
  onEdit: (contact: ContactData) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isMobile: boolean;
}

const priorityColors = ["hsl(0 72% 51%)", "hsl(36 90% 50%)", "hsl(220 10% 50%)"];

function getDelayLabel(minutes: number) {
  if (minutes === 0) return "Immediately";
  if (minutes < 60) return `+${minutes} min`;
  return `+${minutes / 60} hr${minutes > 60 ? "s" : ""}`;
}

export default function ContactCard({
  contact, index, total, onEdit, onRemove, onMoveUp, onMoveDown, isMobile,
}: ContactCardProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const color = priorityColors[Math.min(index, 2)];
  const isOnly = total === 1;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-4 transition-all">
      <div className="flex items-start gap-3">
        {/* Drag handle / arrows */}
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          {isMobile ? (
            <>
              <button
                onClick={() => onMoveUp(index)}
                disabled={index === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => onMoveDown(index)}
                disabled={index === total - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Priority badge */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
          style={{ background: color, color: "#fff" }}
        >
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-black text-sm">{contact.name}</p>
              <p className="text-xs text-muted-foreground">{contact.relationship}</p>
            </div>
            <div className="flex gap-1">
              {isMobile ? (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(contact)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => setConfirmRemove(true)}
                    disabled={isOnly}
                    title={isOnly ? "At least one contact required" : undefined}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => onEdit(contact)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="h-8 text-xs font-bold text-destructive hover:text-destructive"
                    onClick={() => setConfirmRemove(true)}
                    disabled={isOnly}
                    title={isOnly ? "At least one contact required" : undefined}
                  >
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Phone / Email row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
            {contact.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {contact.phone}
              </span>
            )}
            {contact.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {contact.email}
              </span>
            )}
          </div>

          {/* Channels + timing */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: contact.notifyViaSms ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted))",
                color: contact.notifyViaSms ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              <MessageSquare className="w-3 h-3" /> SMS{contact.notifyViaSms ? " ✓" : ""}
            </span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: contact.notifyViaEmail ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted))",
                color: contact.notifyViaEmail ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              <Mail className="w-3 h-3" /> Email{contact.notifyViaEmail ? " ✓" : ""}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground"
            >
              {getDelayLabel(contact.delayMinutes)}
            </span>
          </div>
        </div>
      </div>

      {/* Inline remove confirmation */}
      {confirmRemove && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">Remove {contact.name}? This cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 font-bold" onClick={() => setConfirmRemove(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="h-8 font-bold" onClick={() => onRemove(contact.id)}>Remove</Button>
          </div>
        </div>
      )}
    </div>
  );
}
