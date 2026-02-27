import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import WizardStepper from "@/components/wizard/WizardStepper";
import BasicInfoStep from "@/components/wizard/BasicInfoStep";
import ScheduleStep from "@/components/wizard/ScheduleStep";
import ContactsStep from "@/components/wizard/ContactsStep";
import ReviewStep from "@/components/wizard/ReviewStep";
import { defaultFormData, MOCK_SENIOR, type SeniorFormData } from "@/components/wizard/types";
import { ChevronLeft } from "lucide-react";

const STEP_TITLES = [
  { title: "Senior's Profile", desc: "Tell us about the person you're monitoring." },
  { title: "Check-in Schedule", desc: "Set when their daily check-in reminder will be sent." },
  { title: "Emergency Contacts", desc: "If a check-in is missed, we'll contact these people in order." },
  { title: "Review & Confirm", desc: "Double-check everything before saving." },
];

export default function AddEditSeniorPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<SeniorFormData>(isEdit ? MOCK_SENIOR : defaultFormData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(isEdit ? new Set([0, 1, 2, 3]) : new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty || saving) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, saving]);

  const onChange = useCallback((patch: Partial<SeniorFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  const validateStep1 = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!data.firstName.trim()) e.firstName = "First name is required";
    if (!data.lastName.trim()) e.lastName = "Last name is required";
    if (!data.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?\d[\d\s\-()]{7,}$/.test(data.phone.trim())) e.phone = "Please enter a valid phone number";
    if (!data.relationship) e.relationship = "Please select a relationship";
    return e;
  };

  const validateStep3 = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (data.contacts.length === 0) { e.contacts = "At least one emergency contact is required"; return e; }
    data.contacts.forEach((c, i) => {
      const ce: Record<string, string> = {};
      if (!c.name.trim()) ce.name = "Name is required";
      if (c.notifyViaSms && !c.phone.trim()) ce.phone = "Phone required for SMS";
      if (c.notifyViaEmail && !c.email.trim()) ce.email = "Email required for email notification";
      if (!c.notifyViaSms && !c.notifyViaEmail) ce.channel = "Select at least one notification channel";
      if (Object.keys(ce).length > 0) e[`contact_${i}`] = JSON.stringify(ce);
    });
    return e;
  };

  const goNext = () => {
    let errs: Record<string, string> = {};
    if (step === 0) errs = validateStep1();
    if (step === 2) errs = validateStep3();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setCompletedSteps((prev) => new Set(prev).add(step));
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async () => {
    if (!user) { toast({ title: "You must be logged in to save.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const { data: senior, error: seniorError } = await supabase
        .from("managed_seniors" as any)
        .insert({
          caregiver_id: user.id, first_name: data.firstName, last_name: data.lastName,
          phone: data.phone || null, relationship: data.relationship || null, date_of_birth: data.dateOfBirth || null,
          notes: data.notes || null, reminder_hour: data.reminderHour, reminder_minute: data.reminderMinute,
          reminder_period: data.reminderPeriod, timezone: data.timezone, grace_period_minutes: data.gracePeriodMinutes,
          frequency: data.frequency, custom_days: data.customDays, mood_check_enabled: data.moodCheckEnabled,
          vacation_mode: data.vacationMode, vacation_from: data.vacationFrom || null, vacation_until: data.vacationUntil || null,
        } as any)
        .select().single();
      if (seniorError) throw seniorError;
      if (data.contacts.length > 0 && senior) {
        const contactRows = data.contacts.map((c, i) => ({
          managed_senior_id: (senior as any).id, name: c.name, relationship: c.relationship || null,
          phone: c.phone || null, email: c.email || null, notify_via_sms: c.notifyViaSms,
          notify_via_email: c.notifyViaEmail, delay_minutes: c.delayMinutes, sort_order: i,
        }));
        const { error: contactError } = await supabase.from("managed_senior_contacts" as any).insert(contactRows as any);
        if (contactError) throw contactError;
      }
      setDirty(false);
      toast({ title: isEdit ? "Changes saved successfully." : `${data.firstName} ${data.lastName} has been added.` });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> {isEdit ? "Back" : "Dashboard"}
      </button>

      <WizardStepper currentStep={step} completedSteps={completedSteps} onStepClick={(s) => setStep(s)} allowJump={isEdit} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{STEP_TITLES[step].title}</CardTitle>
          <CardDescription>{STEP_TITLES[step].desc}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && <BasicInfoStep data={data} onChange={onChange} onNext={goNext} errors={errors} />}
          {step === 1 && <ScheduleStep data={data} onChange={onChange} onNext={goNext} onBack={goBack} />}
          {step === 2 && <ContactsStep data={data} onChange={onChange} onNext={goNext} onBack={goBack} errors={errors} />}
          {step === 3 && <ReviewStep data={data} isEdit={isEdit} saving={saving} onSave={handleSave} onBack={goBack} onJumpToStep={(s) => setStep(s)} />}
        </CardContent>
      </Card>
    </div>
  );
}
