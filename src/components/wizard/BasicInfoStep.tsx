import { useState } from "react";
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
import { ChevronRight, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeResult, setCodeResult] = useState<{ success: boolean; name?: string; error?: string } | null>(null);

  const initials =
    (data.firstName.charAt(0) + data.lastName.charAt(0)).toUpperCase() || "?";

  const handleConnect = async () => {
    if (!inviteCode.trim() || !user) return;
    setCodeLoading(true);
    setCodeResult(null);
    try {
      const { data: result, error } = await supabase.rpc("connect_via_invite_code", {
        p_code: inviteCode.trim(),
        p_caregiver_id: user.id,
      });

      if (error) throw error;

      const parsed = result as { success: boolean; error?: string };
      if (!parsed.success) {
        setCodeResult({ success: false, error: parsed.error || "Code not found. Check with your loved one and try again." });
        setCodeLoading(false);
        return;
      }

      // Code was valid — look up the connected senior's profile to pre-fill
      const { data: codeRow } = await supabase
        .from("invite_codes")
        .select("senior_id")
        .eq("code", inviteCode.trim().toUpperCase())
        .limit(1)
        .maybeSingle();

      if (codeRow) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", codeRow.senior_id)
          .maybeSingle();

        if (profile?.full_name) {
          const parts = profile.full_name.split(" ");
          const first = parts[0] || "";
          const last = parts.slice(1).join(" ") || "";
          onChange({ firstName: first, lastName: last });
          setCodeResult({ success: true, name: profile.full_name });
        } else {
          setCodeResult({ success: true, name: "your loved one" });
        }
      } else {
        setCodeResult({ success: true, name: "your loved one" });
      }
    } catch {
      setCodeResult({ success: false, error: "Code not found. Check with your loved one and try again." });
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Code Section */}
      <div className="border border-border rounded-2xl p-5 bg-card">
        <p className="text-sm font-semibold mb-1">Enter invite code</p>
        <p className="text-xs text-muted-foreground mb-4">
          Ask your loved one to open the app, tap 'Connect Family' and share their code with you.
        </p>
        <Input
          placeholder="e.g. PARK-7291"
          value={inviteCode}
          onChange={(e) => {
            setInviteCode(e.target.value.toUpperCase());
            setCodeResult(null);
          }}
          className="text-center rounded-xl text-base tracking-wider"
        />
        <Button
          onClick={handleConnect}
          disabled={codeLoading || !inviteCode.trim()}
          className="w-full h-12 mt-3 rounded-xl font-semibold"
          style={{ background: "hsl(142, 71%, 45%)", color: "#fff" }}
        >
          {codeLoading ? "Connecting…" : "Connect ✓"}
        </Button>
        {codeResult && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${codeResult.success ? "text-green-600" : "text-red-500"}`}>
            {codeResult.success ? (
              <><Check className="w-4 h-4" /> Connected to {codeResult.name}</>
            ) : (
              <><AlertCircle className="w-3 h-3" /> {codeResult.error}</>
            )}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or add manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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
