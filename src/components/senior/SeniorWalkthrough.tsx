import { useState, useEffect } from "react";
import { ShieldCheck, Users, CheckCircle, MessageSquare, Pill, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { triggerSmsWebhook, triggerEmergencyContactWebhook, normalizePhone, formatPhoneDisplay } from "@/lib/supabase-helpers";

interface SeniorWalkthroughProps {
  firstName: string;
  seniorId?: string;
  onComplete: () => void;
  onCheckIn: () => void;
}

interface DraftContact {
  name: string;
  phone: string;
}

export default function SeniorWalkthrough({ firstName, seniorId, onComplete, onCheckIn }: SeniorWalkthroughProps) {
  const { user } = useAuth();
  const [screen, setScreen] = useState(0);
  const [practiced, setPracticed] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string>("none");

  // Emergency contact form state
  const [draftContacts, setDraftContacts] = useState<DraftContact[]>([{ name: "", phone: "" }]);
  const [savedContacts, setSavedContacts] = useState<{ name: string; phone: string }[]>([]);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsSaved, setContactsSaved] = useState(false);

  const totalScreens = 5;

  // Escape key skips the walkthrough
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onComplete();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onComplete]);

  useEffect(() => {
    if (seniorId) {
      loadExistingContacts();
      loadSmsStatus();
    }
  }, [seniorId]);

  const loadExistingContacts = async () => {
    if (!seniorId) return;
    const { data } = await supabase
      .from("emergency_contacts")
      .select("name, phone, sort_order")
      .eq("senior_id", seniorId)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) {
      setSavedContacts(data.map((c) => ({ name: c.name || "", phone: c.phone || "" })));
      setDraftContacts(data.map((c) => ({ name: c.name || "", phone: c.phone || "" })));
      setContactsSaved(true);
    }
  };

  const loadSmsStatus = async () => {
    if (!seniorId) return;
    const { data } = await supabase
      .from("seniors")
      .select("sms_consent_status")
      .eq("id", seniorId)
      .maybeSingle();
    if (data) setSmsStatus(data.sms_consent_status || "none");
  };

  const handleToggleSms = async () => {
    if (!seniorId) return;
    if (smsStatus === "confirmed" || smsStatus === "requested") {
      const { error } = await supabase.from("seniors").update({ sms_consent_status: "opted_out" }).eq("id", seniorId);
      if (error) { toast({ title: "Error", description: "Failed to update SMS settings.", variant: "destructive" }); return; }
      setSmsStatus("opted_out");
      triggerSmsWebhook(seniorId, "opt_out");
      toast({ title: "SMS disabled", description: "You will no longer receive check-in SMS." });
    } else {
      const { error } = await supabase.from("seniors").update({ sms_consent_status: "requested" }).eq("id", seniorId);
      if (error) { toast({ title: "Error", description: "Failed to update SMS settings.", variant: "destructive" }); return; }
      setSmsStatus("requested");
      triggerSmsWebhook(seniorId, "opt_in");
      toast({ title: "SMS enabled", description: "You'll receive a confirmation text shortly. Reply YES to activate." });
    }
  };

  const handlePractice = () => {
    // Purely visual — do NOT call onCheckIn() as that writes a real check_ins row
    setPracticed(true);
  };

  // Contact form helpers
  const updateDraft = (index: number, field: "name" | "phone", value: string) => {
    setDraftContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addDraftContact = () => {
    if (draftContacts.length >= 3) return;
    setDraftContacts((prev) => [...prev, { name: "", phone: "" }]);
  };

  const removeDraftContact = (index: number) => {
    if (draftContacts.length <= 1) return;
    setDraftContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveContacts = async () => {
    if (!seniorId || !user) return;
    const filled = draftContacts.filter((c) => c.name.trim() && c.phone.trim());
    if (filled.length === 0) {
      toast({ title: "Enter at least one contact", description: "Please provide a name and phone number.", variant: "destructive" });
      return;
    }

    setContactsSaving(true);

    const seniorData = await supabase.from("seniors").select("name").eq("id", seniorId).maybeSingle();
    const seniorName = seniorData.data?.name || "";

    // Capture old contact IDs before save
    const { data: oldContacts } = await supabase
      .from("emergency_contacts")
      .select("id")
      .eq("senior_id", seniorId);
    const oldIds = (oldContacts || []).map((c) => c.id);

    const rows = filled.map((c, i) => ({
      senior_id: seniorId,
      name: c.name.trim(),
      phone: normalizePhone(c.phone) || c.phone.trim(),
      priority: i,
      sort_order: i,
      user_id: user.id,
    }));

    // Insert new rows first — if this fails, old contacts remain intact
    const { data: inserted, error } = await supabase.from("emergency_contacts").insert(rows).select("id, name, phone");
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      setContactsSaving(false);
      return;
    }

    // Insert succeeded — now safe to delete old rows
    if (oldIds.length > 0) {
      await supabase.from("emergency_contacts").delete().in("id", oldIds);
    }

    setSavedContacts(filled);
    setContactsSaved(true);
    toast({ title: "Emergency contacts saved" });

    // Notify new contacts via webhook (fire-and-forget)
    if (inserted) {
      for (const c of inserted) {
        triggerEmergencyContactWebhook({
          senior_name: seniorName,
          contact_name: c.name,
          contact_phone: c.phone,
          senior_id: seniorId,
          contact_id: c.id,
        });
      }
    }
    setContactsSaving(false);
  };

  const hasFilledContact = draftContacts.some((c) => c.name.trim() && c.phone.trim());

  const currentStep = screen + 1;
  const dots = Array.from({ length: totalScreens }, (_, i) => i);

  const DotIndicator = () => (
    <div className="flex justify-center gap-2 mt-6">
      {dots.map((i) => (
        <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i === currentStep - 1 ? "hsl(var(--primary))" : "hsl(var(--muted))" }} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center px-6 overflow-y-auto pt-16 pb-8">
      {/* Skip link */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center z-10"
      >
        Skip intro
      </button>

      {/* Screen 1 — Welcome */}
      {screen === 0 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in py-8">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <ShieldCheck className="w-10 h-10" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Welcome to Daily Guardian, {firstName}!
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            Each day you'll get a simple text message. Just reply to confirm you're safe. If you don't respond, your emergency contacts are notified automatically.
          </p>
          <Button
            onClick={() => setScreen(1)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Get Started →
          </Button>
          <DotIndicator />
        </div>
      )}

      {/* Screen 2 — Emergency Contacts (inline form) */}
      {screen === 1 && (
        <div className="max-w-md w-full space-y-5 animate-bounce-in py-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <Users className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
              Add your emergency contacts
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: "16px", lineHeight: "24px" }}>
              Add at least 1 person you trust. They'll be notified if you miss a check-in. You can add up to 2 more later from your Dashboard or Contacts tab.
            </p>
          </div>

          {/* Contact saved confirmation */}
          {contactsSaved && savedContacts.length > 0 && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--status-checked) / 0.06)", border: "1px solid hsl(var(--status-checked) / 0.25)" }}>
              <p className="font-bold text-sm" style={{ color: "hsl(var(--status-checked))" }}>Contacts saved!</p>
              {savedContacts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "hsl(var(--primary))" }}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contact form */}
          {!contactsSaved && (
            <div className="space-y-3">
              {draftContacts.map((contact, index) => (
                <div key={index} className="bg-card rounded-2xl p-4 border border-border shadow-card space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">
                      Contact {index + 1}
                      {index === 0 && <span className="text-primary ml-1 text-xs">(Required)</span>}
                    </p>
                    {index > 0 && (
                      <button onClick={() => removeDraftContact(index)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Name</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateDraft(index, "name", e.target.value)}
                      placeholder="Contact name"
                      className="mt-1 h-11 text-base rounded-xl"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Phone</Label>
                    <Input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateDraft(index, "phone", formatPhoneDisplay(e.target.value))}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1 h-11 text-base rounded-xl"
                      maxLength={20}
                    />
                  </div>
                </div>
              ))}

              {draftContacts.length < 3 && (
                <button
                  onClick={addDraftContact}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm font-semibold min-h-[48px]"
                >
                  <Plus className="w-4 h-4" />
                  Add Another ({draftContacts.length}/3)
                </button>
              )}

              {/* Save contacts button */}
              <Button
                onClick={handleSaveContacts}
                disabled={contactsSaving || !hasFilledContact}
                className="w-full rounded-2xl font-bold border-0"
                style={{ minHeight: "56px", fontSize: "16px", background: "hsl(var(--status-checked))", color: "#fff" }}
              >
                {contactsSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Contacts"}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="space-y-2">
            {contactsSaved ? (
              <Button
                onClick={() => setScreen(2)}
                className="w-full rounded-2xl font-bold border-0"
                style={{ minHeight: "56px", fontSize: "16px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                Next →
              </Button>
            ) : (
              <button
                onClick={() => setScreen(2)}
                className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-[48px]"
              >
                Skip for now — I'll add them later
              </button>
            )}
          </div>
          <DotIndicator />
        </div>
      )}

      {/* Screen 3 — SMS Check-Ins */}
      {screen === 2 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in py-8">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <MessageSquare className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Enable SMS Check-Ins
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            We'll send you a text message every day at your check-in time. Just reply to let us know you're safe.
          </p>

          {/* SMS toggle card */}
          <div className="rounded-2xl p-5 text-left space-y-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold" style={{ fontSize: "16px" }}>Daily SMS</p>
                <p className="text-sm" style={{
                  color: smsStatus === "confirmed" ? "hsl(var(--status-checked))" :
                         smsStatus === "requested" ? "hsl(var(--status-pending))" :
                         "hsl(var(--muted-foreground))",
                  fontWeight: 600,
                }}>
                  {smsStatus === "confirmed" ? "Active" :
                   smsStatus === "requested" ? "Pending confirmation" :
                   smsStatus === "opted_out" ? "Opted out" : "Not enabled"}
                </p>
              </div>
              <Switch
                checked={smsStatus === "confirmed" || smsStatus === "requested"}
                onCheckedChange={handleToggleSms}
              />
            </div>
            {smsStatus === "requested" && (
              <p className="text-xs text-muted-foreground rounded-lg p-3" style={{ background: "hsl(var(--status-pending) / 0.08)" }}>
                We sent a confirmation text to your phone. Reply <span className="font-bold">YES</span> to activate.
              </p>
            )}
          </div>

          <div className="space-y-2 text-left">
            <p className="text-muted-foreground" style={{ fontSize: "16px", lineHeight: "24px" }}>
              <span className="font-bold text-foreground">How it works:</span>
            </p>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>1</span>
              <p className="text-sm text-foreground">We text you daily: "How are you feeling today?"</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>2</span>
              <p className="text-sm text-foreground">Reply <span className="font-bold">YES</span> (great), <span className="font-bold">OK</span> (okay), or <span className="font-bold">NO</span> (not well)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>3</span>
              <p className="text-sm text-foreground">If you don't reply, your emergency contacts are alerted</p>
            </div>
          </div>

          <Button
            onClick={() => setScreen(3)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Next →
          </Button>
          <DotIndicator />
        </div>
      )}

      {/* Screen 4 — Medications */}
      {screen === 3 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in py-8">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Pill className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Track Your Medications
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            Add your daily medications and keep track of every dose — right from your dashboard.
          </p>

          <div className="space-y-2 text-left">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>1</span>
              <p className="text-sm text-foreground">Go to the <span className="font-bold">Medications</span> tab to add your medications</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>2</span>
              <p className="text-sm text-foreground">Set how often you take each one and what time</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>3</span>
              <p className="text-sm text-foreground">Each day, tap <span className="font-bold">Take</span> or <span className="font-bold">Skip</span> for each dose</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>4</span>
              <p className="text-sm text-foreground">With SMS enabled, you'll get a <span className="font-bold">daily morning text</span> reminding you to check your schedule</p>
            </div>
          </div>

          <Button
            onClick={() => setScreen(4)}
            className="w-full rounded-2xl font-bold border-0"
            style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Next →
          </Button>
          <DotIndicator />
        </div>
      )}

      {/* Screen 5 — Practice Check-in */}
      {screen === 4 && (
        <div className="max-w-md w-full text-center space-y-6 animate-bounce-in py-8">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--status-checked) / 0.12)" }}>
            <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--status-checked))" }} />
          </div>
          <h1 className="font-black text-foreground" style={{ fontSize: "24px", lineHeight: "32px" }}>
            Let's do a quick practice!
          </h1>
          <p className="text-foreground" style={{ fontSize: "20px", lineHeight: "30px" }}>
            Each morning, pick the mood that matches how you feel. That's your daily check-in!
          </p>

          {!practiced ? (
            <div className="w-full space-y-3">
              <p className="text-center font-bold text-foreground" style={{ fontSize: "18px" }}>
                How are you feeling today?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { emoji: "😊", label: "Great" },
                  { emoji: "😐", label: "Okay" },
                  { emoji: "😔", label: "Not Great" },
                ]).map((m) => (
                  <button
                    key={m.label}
                    onClick={handlePractice}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card shadow-card hover:border-primary/50 hover:shadow-md transition-all"
                    style={{ minHeight: "90px" }}
                  >
                    <span style={{ fontSize: "36px", lineHeight: "44px" }}>{m.emoji}</span>
                    <span className="text-sm font-bold text-foreground mt-1">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 border text-center" style={{ background: "hsl(var(--status-checked) / 0.06)", borderColor: "hsl(var(--status-checked) / 0.25)" }}>
                <p className="font-black" style={{ fontSize: "18px", color: "hsl(var(--status-checked))" }}>
                  You've got it! That's all there is to it.
                </p>
              </div>
              <Button
                onClick={onComplete}
                className="w-full rounded-2xl font-bold border-0"
                style={{ minHeight: "64px", fontSize: "18px", background: "hsl(var(--status-checked))", color: "#fff" }}
              >
                I'm ready — let's go!
              </Button>
            </div>
          )}
          <DotIndicator />
        </div>
      )}
    </div>
  );
}
