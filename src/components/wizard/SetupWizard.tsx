import { useState } from "react";
import { ShieldCheck, ChevronLeft, Plus, AlertTriangle, Info, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import TimePicker from "./TimePicker";

interface SetupContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notifyViaSms: boolean;
  notifyViaEmail: boolean;
}

interface SetupWizardProps {
  onComplete: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    relationship: string;
    reminderHour: string;
    reminderMinute: string;
    reminderPeriod: "AM" | "PM";
    timezone: string;
    gracePeriodMinutes: number;
    contacts: SetupContact[];
  }) => void;
  onSkip: () => void;
  saving?: boolean;
}

const RELATIONSHIPS = ["Mother", "Father", "Grandmother", "Grandfather", "Aunt", "Uncle", "Spouse", "Partner", "Friend", "Neighbor", "Other"];
const GRACE_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
];

function InviteCodeSection({ onConnected }: { onConnected: (first: string, last: string, phone?: string) => void }) {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; name?: string; error?: string } | null>(null);

  const handleConnect = async () => {
    if (!inviteCode.trim() || !user) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.rpc("connect_via_invite_code", {
        p_code: inviteCode.trim(),
        p_caregiver_id: user.id,
      });
      if (error) throw error;
      const parsed = data as { success: boolean; error?: string };
      if (!parsed.success) {
        setResult({ success: false, error: parsed.error || "Code not found. Check with your loved one and try again." });
        setLoading(false);
        return;
      }

      // Connection succeeded — try to fetch the newly connected senior's profile
      // We use senior_connections (which the caregiver CAN read) to find the senior_id
      const { data: connections } = await supabase
        .from("senior_connections")
        .select("senior_id")
        .eq("caregiver_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (connections?.senior_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", connections.senior_id)
          .maybeSingle();

        if (profile?.full_name) {
          const parts = profile.full_name.split(" ");
          onConnected(parts[0] || "", parts.slice(1).join(" ") || "");
          setResult({ success: true, name: profile.full_name });
        } else {
          onConnected("", "");
          setResult({ success: true, name: "your loved one" });
        }
      } else {
        onConnected("", "");
        setResult({ success: true, name: "your loved one" });
      }
    } catch {
      setResult({ success: false, error: "Something went wrong. Please try again or add manually." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border rounded-2xl p-5 bg-card">
      <p className="text-sm font-semibold mb-1">Have an invite code?</p>
      <p className="text-xs text-muted-foreground mb-4">
        Ask your loved one to share their code with you.
      </p>
      <Input
        placeholder="e.g. PARK-7291"
        value={inviteCode}
        onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setResult(null); }}
        className="text-center rounded-xl text-base tracking-wider"
      />
      <Button
        onClick={handleConnect}
        disabled={loading || !inviteCode.trim()}
        className="w-full h-12 mt-3 rounded-xl font-semibold"
        style={{ background: "hsl(142, 71%, 45%)", color: "#fff" }}
      >
        {loading ? "Connecting…" : "Connect ✓"}
      </Button>
      {result && (
        <p className={`text-sm mt-2 flex items-center gap-1 ${result.success ? "text-green-600" : "text-red-500"}`}>
          {result.success ? (
            <><Check className="w-4 h-4" /> Connected to {result.name}</>
          ) : (
            <><AlertCircle className="w-3 h-3" /> {result.error}</>
          )}
        </p>
      )}
    </div>
  );
}

export default function SetupWizard({ onComplete, onSkip, saving }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  // Step 2 - Senior info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [codeConnected, setCodeConnected] = useState(false);
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // Step 3 - Schedule
  const [reminderHour, setReminderHour] = useState("08");
  const [reminderMinute, setReminderMinute] = useState("00");
  const [reminderPeriod, setReminderPeriod] = useState<"AM" | "PM">("AM");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(60);

  // Step 4 - Contacts
  const [contacts, setContacts] = useState<SetupContact[]>([
    { id: crypto.randomUUID(), name: "", relationship: "", phone: "", email: "", notifyViaSms: true, notifyViaEmail: false },
  ]);
  const [showContactSkipWarning, setShowContactSkipWarning] = useState(false);
  const [step4Errors, setStep4Errors] = useState<Record<string, string>>({});

  // Global skip warning (inline)
  const [showGlobalSkipWarning, setShowGlobalSkipWarning] = useState(false);

  const validateStep2 = () => {
    if (codeConnected) return true;
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!phone.trim()) e.phone = "Required";
    else if (!/^\+?\d[\d\s\-()]{7,}$/.test(phone.trim())) e.phone = "Invalid phone";
    if (!relationship) e.relationship = "Required";
    setStep2Errors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep4 = () => {
    const e: Record<string, string> = {};
    contacts.forEach((c, i) => {
      if (!c.name.trim()) e[`name_${i}`] = "Required";
      if (c.notifyViaSms && !c.phone.trim()) e[`phone_${i}`] = "Phone required for SMS";
      if (c.notifyViaEmail && !c.email.trim()) e[`email_${i}`] = "Email required";
    });
    setStep4Errors(e);
    return Object.keys(e).length === 0;
  };

  const handleComplete = () => {
    const validContacts = contacts.filter((c) => c.name.trim());
    if (validContacts.length === 0) {
      setShowContactSkipWarning(true);
      return;
    }
    if (!validateStep4()) return;
    onComplete({
      firstName, lastName, phone, relationship,
      reminderHour, reminderMinute, reminderPeriod, timezone, gracePeriodMinutes,
      contacts: validContacts,
    });
  };

  const handleSkipContacts = () => {
    onComplete({
      firstName, lastName, phone, relationship,
      reminderHour, reminderMinute, reminderPeriod, timezone, gracePeriodMinutes,
      contacts: [],
    });
  };

  const progressValue = ((step + 1) / 5) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar: progress + back + skip */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-muted-foreground">Step {step + 1} of 4</span>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => { setStep(step - 1); setShowGlobalSkipWarning(false); }}
                className="text-sm text-muted-foreground font-bold flex items-center gap-1 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={() => setShowGlobalSkipWarning(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
            >
              Skip setup
            </button>
          </div>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Global skip warning (inline) */}
      {showGlobalSkipWarning && (
        <div className="px-4 pb-2 shrink-0">
          <div
            className="rounded-xl p-3 text-sm space-y-2"
            style={{ background: "hsl(var(--status-pending) / 0.08)", border: "1px solid hsl(var(--status-pending) / 0.2)" }}
          >
            <p className="text-muted-foreground">
              Skipping now means no one will be monitored. You can restart from Settings → Setup Guide.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={onSkip} className="text-sm font-bold" style={{ color: "hsl(var(--status-alert))" }}>
                Continue skipping
              </button>
              <button onClick={() => setShowGlobalSkipWarning(false)} className="text-sm font-bold text-muted-foreground">
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28" style={{ maxHeight: "calc(100vh - 160px)" }}>
        <div className="w-full max-w-lg mx-auto">

          {/* Step 1: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6 animate-bounce-in">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "hsl(var(--primary) / 0.12)" }}
              >
                <ShieldCheck className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h1 className="text-2xl font-black">Welcome to Daily Guardian</h1>
              <p className="text-muted-foreground text-base max-w-sm mx-auto">
                We'll help you set up daily check-ins for your loved one in 4 quick steps. You can always change these later.
              </p>
            </div>
          )}

          {/* Step 2: Add Senior */}
          {step === 1 && (
            <div className="space-y-5 animate-bounce-in">
              <div>
                <h1 className="text-xl font-black">Who are you monitoring?</h1>
                <p className="text-sm text-muted-foreground mt-1">Enter basic details about the person you want to check in on.</p>
              </div>

              {/* Invite Code Card */}
              <InviteCodeSection
                onConnected={(first, last, ph) => {
                  setFirstName(first);
                  setLastName(last);
                  if (ph) setPhone(ph);
                  setCodeConnected(true);
                  setStep2Errors({});
                }}
              />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or add manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <p className="text-xs text-muted-foreground italic">
                Don't have the code yet? Fill in the details below. You can connect via invite code later from your dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">First name *</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={step2Errors.firstName ? "border-destructive" : ""} />
                  {step2Errors.firstName && <p className="text-xs text-destructive mt-1">{step2Errors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Last name *</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={step2Errors.lastName ? "border-destructive" : ""} />
                  {step2Errors.lastName && <p className="text-xs text-destructive mt-1">{step2Errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone number *</label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={step2Errors.phone ? "border-destructive" : ""} />
                {step2Errors.phone && <p className="text-xs text-destructive mt-1">{step2Errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Relationship *</label>
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRelationship(r)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                        relationship === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-input hover:bg-muted"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {step2Errors.relationship && <p className="text-xs text-destructive mt-1">{step2Errors.relationship}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 2 && (
            <div className="space-y-5 animate-bounce-in">
              <div>
                <h1 className="text-xl font-black">When should we check in?</h1>
                <p className="text-sm text-muted-foreground mt-1">We'll send a daily SMS at this time. They reply to confirm they're okay.</p>
              </div>
              <TimePicker
                hour={reminderHour} minute={reminderMinute} period={reminderPeriod}
                onHourChange={setReminderHour} onMinuteChange={setReminderMinute} onPeriodChange={setReminderPeriod}
              />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Grace period</label>
                <div className="flex flex-wrap gap-2">
                  {GRACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGracePeriodMinutes(opt.value)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-black transition-colors",
                        gracePeriodMinutes === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Emergency Contacts */}
          {step === 3 && !showContactSkipWarning && (
            <div className="space-y-5 animate-bounce-in">
              <div>
                <h1 className="text-xl font-black">Who should we contact if {firstName} misses a check-in?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll notify this person automatically if there's no response. You can add up to 3 contacts.
                </p>
              </div>

              {/* Urgency nudge */}
              <div
                className="rounded-xl p-3 flex items-start gap-2 text-xs"
                style={{ background: "hsl(var(--status-pending) / 0.08)", border: "1px solid hsl(var(--status-pending) / 0.2)" }}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-pending))" }} />
                <span className="text-muted-foreground">We strongly recommend at least 2 contacts in case the first is unreachable.</span>
              </div>

              {contacts.map((contact, i) => {
                const autoDelay = i === 0 ? "Notified immediately" : i === 1 ? "Notified if no response in 30 min" : "Notified if no response in 60 min";
                return (
                  <div key={contact.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: i === 0 ? "hsl(var(--status-alert))" : i === 1 ? "hsl(var(--status-pending))" : "hsl(var(--muted-foreground))" }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-bold">Contact {i + 1}</span>
                      </div>
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setContacts(contacts.filter((_, idx) => idx !== i))}
                          className="text-xs text-destructive font-bold min-h-[44px] px-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
                        <Input
                          value={contact.name}
                          onChange={(e) => {
                            const next = [...contacts]; next[i] = { ...next[i], name: e.target.value }; setContacts(next);
                          }}
                          placeholder="Contact name"
                          className={step4Errors[`name_${i}`] ? "border-destructive" : ""}
                        />
                        {step4Errors[`name_${i}`] && <p className="text-xs text-destructive mt-1">{step4Errors[`name_${i}`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Relationship</label>
                        <Input
                          value={contact.relationship}
                          onChange={(e) => {
                            const next = [...contacts]; next[i] = { ...next[i], relationship: e.target.value }; setContacts(next);
                          }}
                          placeholder="e.g. Daughter"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                        <Input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => {
                            const next = [...contacts]; next[i] = { ...next[i], phone: e.target.value }; setContacts(next);
                          }}
                          placeholder="+1 (555) 000-0000"
                          className={step4Errors[`phone_${i}`] ? "border-destructive" : ""}
                        />
                        {step4Errors[`phone_${i}`] && <p className="text-xs text-destructive mt-1">{step4Errors[`phone_${i}`]}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => {
                            const next = [...contacts]; next[i] = { ...next[i], email: e.target.value }; setContacts(next);
                          }}
                          placeholder="email@example.com"
                          className={step4Errors[`email_${i}`] ? "border-destructive" : ""}
                        />
                        {step4Errors[`email_${i}`] && <p className="text-xs text-destructive mt-1">{step4Errors[`email_${i}`]}</p>}
                      </div>
                    </div>
                    {/* Notify via */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notify via</label>
                      <div className="flex gap-2">
                        {[
                          { key: "notifyViaSms" as const, label: "SMS" },
                          { key: "notifyViaEmail" as const, label: "Email" },
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const next = [...contacts];
                              const other = key === "notifyViaSms" ? "notifyViaEmail" : "notifyViaSms";
                              if (next[i][key] && !next[i][other]) return;
                              next[i] = { ...next[i], [key]: !next[i][key] };
                              setContacts(next);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                              contact[key]
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-input hover:bg-muted"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Auto delay label */}
                    <p className="text-xs text-muted-foreground italic">{autoDelay}</p>
                  </div>
                );
              })}

              {contacts.length < 3 && (
                <button
                  type="button"
                  onClick={() =>
                    setContacts([
                      ...contacts,
                      { id: crypto.randomUUID(), name: "", relationship: "", phone: "", email: "", notifyViaSms: true, notifyViaEmail: false },
                    ])
                  }
                  className="w-full border-2 border-dashed border-input rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add another contact
                </button>
              )}
            </div>
          )}

          {/* Skip contacts warning */}
          {step === 3 && showContactSkipWarning && (
            <div className="space-y-5 animate-bounce-in text-center">
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "hsl(var(--status-pending) / 0.12)" }}
              >
                <AlertTriangle className="w-7 h-7" style={{ color: "hsl(var(--status-pending))" }} />
              </div>
              <h2 className="text-lg font-black">Are you sure?</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Without emergency contacts, no one will be notified if {firstName} misses a check-in.
              </p>
              <Button
                onClick={() => setShowContactSkipWarning(false)}
                className="w-full rounded-2xl font-bold"
                style={{ minHeight: "48px" }}
              >
                Go Back — Add Contact
              </Button>
              <button
                onClick={handleSkipContacts}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip Anyway
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom button bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4 z-50">
        <div className="max-w-lg mx-auto">
          {step === 0 && (
            <Button
              onClick={() => setStep(1)}
              className="w-full rounded-2xl font-bold border-0"
              style={{ minHeight: "56px", fontSize: "16px" }}
            >
              Let's get started →
            </Button>
          )}
          {step === 1 && (
            <Button
              onClick={() => validateStep2() && setStep(2)}
              className="w-full rounded-2xl font-bold"
              style={{ minHeight: "48px" }}
            >
              Save & Continue →
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={() => setStep(3)}
              className="w-full rounded-2xl font-bold"
              style={{ minHeight: "48px" }}
            >
              Save & Continue →
            </Button>
          )}
          {step === 3 && !showContactSkipWarning && (
            <div className="space-y-2">
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="w-full rounded-2xl font-bold border-0"
                style={{ minHeight: "56px", fontSize: "16px", background: "hsl(var(--status-checked))", color: "#fff" }}
              >
                {saving ? "Setting up…" : "Complete Setup →"}
              </Button>
              <button
                onClick={() => setShowContactSkipWarning(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors block mx-auto"
              >
                Skip for now — I'll add contacts later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
