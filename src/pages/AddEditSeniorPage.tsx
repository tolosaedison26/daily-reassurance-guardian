import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
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

  const [step, setStep] = useState(0);
  const [data, setData] = useState<SeniorFormData>(isEdit ? MOCK_SENIOR : defaultFormData);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(isEdit ? new Set([0, 1, 2, 3]) : new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Unsaved changes blocker
  const blocker = useBlocker(dirty && !saving);

  const onChange = useCallback((patch: Partial<SeniorFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  // Validation helpers
  const validateStep1 = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!data.firstName.trim()) e.firstName = "First name is required";
    if (!data.lastName.trim()) e.lastName = "Last name is required";
    if (!data.phone.trim()) e.phone = "Phone number is required";
    else if (!/^\+?\d[\d\s\-()]{7,}$/.test(data.phone.trim()))
      e.phone = "Please enter a valid phone number with country code (e.g. +1 555 000 0000)";
    if (!data.relationship) e.relationship = "Please select a relationship";
    return e;
  };

  const validateStep3 = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (data.contacts.length === 0) {
      e.contacts = "At least one emergency contact is required";
      return e;
    }
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
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    setDirty(false);

    toast({
      title: isEdit ? "Changes saved successfully." : `${data.firstName} ${data.lastName} has been added.`,
      description: isEdit
        ? undefined
        : `First check-in tomorrow at ${data.reminderHour}:${data.reminderMinute} ${data.reminderPeriod}.`,
    });

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="w-full max-w-[680px] mx-auto px-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4" /> {isEdit ? "Back" : "Dashboard"}
        </button>
        <h1 className="text-2xl font-black">
          {isEdit ? `Editing: ${data.firstName} ${data.lastName}` : "Add Senior"}
        </h1>
      </div>

      {/* Stepper */}
      <div className="w-full max-w-[680px] mx-auto px-4">
        <WizardStepper
          currentStep={step}
          completedSteps={completedSteps}
          onStepClick={(s) => setStep(s)}
          allowJump={isEdit}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-[680px] mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{STEP_TITLES[step].title}</CardTitle>
            <CardDescription>{STEP_TITLES[step].desc}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 0 && (
              <BasicInfoStep data={data} onChange={onChange} onNext={goNext} errors={errors} />
            )}
            {step === 1 && (
              <ScheduleStep data={data} onChange={onChange} onNext={goNext} onBack={goBack} />
            )}
            {step === 2 && (
              <ContactsStep data={data} onChange={onChange} onNext={goNext} onBack={goBack} errors={errors} />
            )}
            {step === 3 && (
              <ReviewStep
                data={data}
                isEdit={isEdit}
                saving={saving}
                onSave={handleSave}
                onBack={goBack}
                onJumpToStep={(s) => setStep(s)}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unsaved changes dialog */}
      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
