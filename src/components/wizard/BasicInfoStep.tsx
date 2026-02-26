import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronRight, AlertCircle } from "lucide-react";
import type { SeniorFormData } from "./types";

const RELATIONSHIPS = [
  "Mother", "Father", "Grandmother", "Grandfather",
  "Aunt", "Uncle", "Neighbor", "Friend", "Client", "Other",
];

interface Props {
  data: SeniorFormData;
  onChange: (patch: Partial<SeniorFormData>) => void;
  onNext: () => void;
  errors: Record<string, string>;
}

export default function BasicInfoStep({ data, onChange, onNext, errors }: Props) {
  const initials =
    (data.firstName.charAt(0) + data.lastName.charAt(0)).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-black text-primary-foreground"
          style={{ background: "hsl(var(--primary))" }}
        >
          {initials}
        </div>
        <span className="text-xs text-muted-foreground">Photo optional</span>
      </div>

      {/* Name row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">First Name *</label>
          <Input
            placeholder="e.g. Margaret"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.firstName}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Last Name *</label>
          <Input
            placeholder="e.g. Ross"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="text-sm font-medium mb-1 block">Mobile Phone Number *</label>
        <Input
          type="tel"
          placeholder="+1 (555) 000-0000"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className={errors.phone ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground mt-1">Used to send daily check-in SMS</p>
        {errors.phone && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.phone}
          </p>
        )}
      </div>

      {/* Relationship */}
      <div>
        <label className="text-sm font-medium mb-1 block">Relationship *</label>
        <Select value={data.relationship} onValueChange={(v) => onChange({ relationship: v })}>
          <SelectTrigger className={errors.relationship ? "border-destructive" : ""}>
            <SelectValue placeholder="Select relationship" />
          </SelectTrigger>
          <SelectContent>
            {RELATIONSHIPS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.relationship && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.relationship}
          </p>
        )}
      </div>

      {/* Date of birth */}
      <div>
        <label className="text-sm font-medium mb-1 block">Date of Birth</label>
        <Input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => onChange({ dateOfBirth: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">Optional — used to personalize messages</p>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium mb-1 block">Notes</label>
        <Textarea
          placeholder="Any important context (medical notes, preferences, living situation…)"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value.slice(0, 500) })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{data.notes.length}/500</p>
      </div>

      {/* Nav */}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="w-full md:w-auto gap-1">
          Continue → Schedule <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
