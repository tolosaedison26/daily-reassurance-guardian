import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Lock, Moon, Bell, Eye, EyeOff, Loader2, LogOut, Phone, MessageSquare, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { triggerSmsWebhook, normalizePhone, formatPhoneDisplay } from "@/lib/supabase-helpers";
import CheckInTimeEditor from "@/components/CheckInTimeEditor";

export default function AccountSettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Name
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [nameSaving, setNameSaving] = useState(false);

  // Email
  const [email, setEmail] = useState(user?.email || "");
  const [emailSaving, setEmailSaving] = useState(false);

  // Phone
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notifications — initialize from browser permission state
  const [notifEnabled, setNotifEnabled] = useState(
    () => "Notification" in window && Notification.permission === "granted"
  );

  // SMS
  const [smsStatus, setSmsStatus] = useState<string>("none");
  const [seniorId, setSeniorId] = useState<string | null>(null);

  // Pause
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (user) {
      loadSeniorData();
    }
  }, [user]);

  const loadSeniorData = async () => {
    if (!user) return;
    const { data: senior } = await supabase
      .from("seniors")
      .select("id, phone, sms_consent_status, paused")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (senior) {
      setSeniorId(senior.id);
      setPhone(senior.phone || "");
      setSmsStatus(senior.sms_consent_status || "none");
      setPaused(!!senior.paused);
    }
  };

  const handleSaveName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed || !user) return;
    setNameSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("user_id", user.id);
    if (!error) {
      // Keep seniors.name in sync with profiles.full_name
      if (seniorId) {
        await supabase.from("seniors").update({ name: trimmed }).eq("id", seniorId);
      }
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      await refreshProfile();
      toast({ title: "Name updated", description: "Your display name has been saved." });
    } else {
      toast({ title: "Error", description: "Failed to update name.", variant: "destructive" });
    }
    setNameSaving(false);
  };

  const handleSavePhone = async () => {
    const cleaned = normalizePhone(phone);
    if (!cleaned || cleaned.length < 10 || !seniorId || !user) {
      toast({ title: "Invalid phone", description: "Please enter a valid phone number with country code.", variant: "destructive" });
      return;
    }
    setPhoneSaving(true);
    // Check if phone actually changed — if so, reset SMS consent
    const { data: current } = await supabase.from("seniors").select("phone").eq("id", seniorId).maybeSingle();
    const phoneChanged = current?.phone !== cleaned;
    const updates: Record<string, any> = { phone: cleaned };
    if (phoneChanged && (smsStatus === "confirmed" || smsStatus === "requested")) {
      updates.sms_consent_status = "none";
    }
    const { error } = await supabase.from("seniors").update(updates).eq("id", seniorId);
    if (error) {
      toast({ title: "Error", description: "Failed to update phone.", variant: "destructive" });
      setPhoneSaving(false);
      return;
    }
    await supabase.from("profiles").update({ phone: cleaned }).eq("user_id", user.id);
    setPhone(cleaned);
    if (phoneChanged && (smsStatus === "confirmed" || smsStatus === "requested")) {
      setSmsStatus("none");
      toast({ title: "Phone updated", description: "Phone saved. Please re-enable SMS check-ins for your new number." });
    } else {
      toast({ title: "Phone updated", description: "Your phone number has been saved." });
    }
    setPhoneSaving(false);
  };

  const handleSaveEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed || trimmed === user?.email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    if (!error) {
      toast({ title: "Confirmation sent", description: "Check your new email to confirm the change." });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setEmailSaving(false);
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setPasswordSaving(false);
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

  const handleTogglePause = async () => {
    if (!seniorId) return;
    const newVal = !paused;
    const { error } = await supabase.from("seniors").update({ paused: newVal }).eq("id", seniorId);
    if (error) {
      toast({ title: "Error", description: "Failed to update pause setting.", variant: "destructive" });
      return;
    }
    setPaused(newVal);
    toast({
      title: newVal ? "Check-ins paused" : "Check-ins resumed",
      description: newVal ? "You won't receive check-ins or trigger alerts while paused." : "Daily check-ins are active again.",
    });
  };

  const smsLabel = smsStatus === "confirmed" ? "Active" : smsStatus === "requested" ? "Pending confirmation" : smsStatus === "opted_out" ? "Opted out" : "Not enabled";
  const smsIsOn = smsStatus === "confirmed" || smsStatus === "requested";

  return (
    <div className="space-y-5 max-w-2xl mx-auto px-4 sm:px-5 pt-4 pb-8">
      <h1 className="text-xl font-black">Settings</h1>

      {/* Phone Number */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">Phone Number</h2>
        </div>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhoneDisplay(e.target.value))}
          className="h-12 rounded-xl text-base"
          placeholder="+1 (555) 123-4567"
        />
        <p className="text-xs text-muted-foreground">
          This is the number where you'll receive daily check-in SMS.
        </p>
        <Button
          onClick={handleSavePhone}
          disabled={phoneSaving || !phone.trim()}
          className="w-full h-12 rounded-xl font-bold"
        >
          {phoneSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Phone"}
        </Button>
      </div>

      {/* SMS Settings */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">SMS Check-Ins</h2>
        </div>
        <div className="flex items-center justify-between min-h-[44px]">
          <div>
            <span className="text-sm font-semibold">Daily SMS</span>
            <p className="text-xs text-muted-foreground">Status: {smsLabel}</p>
          </div>
          <Switch checked={smsIsOn} onCheckedChange={handleToggleSms} />
        </div>
        {smsStatus === "requested" && (
          <p className="text-xs text-muted-foreground rounded-lg p-3" style={{ background: "hsl(var(--status-pending) / 0.08)" }}>
            We sent a confirmation text to your phone. Reply <span className="font-bold">YES</span> to activate SMS check-ins.
          </p>
        )}
      </div>

      {/* Pause Check-Ins */}
      {seniorId && (
        <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Pause className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base">Pause Check-Ins</h2>
          </div>
          <div className="flex items-center justify-between min-h-[44px]">
            <div>
              <span className="text-sm font-semibold">{paused ? "Paused" : "Active"}</span>
              <p className="text-xs text-muted-foreground">
                {paused ? "No SMS sent and no alerts while paused" : "Daily check-ins are running normally"}
              </p>
            </div>
            <Switch checked={paused} onCheckedChange={handleTogglePause} />
          </div>
          {paused && (
            <p className="text-xs text-amber-600 font-semibold rounded-lg p-3" style={{ background: "hsl(var(--status-pending) / 0.08)" }}>
              Your check-ins are paused. Toggle off to resume.
            </p>
          )}
        </div>
      )}

      {/* Check-In Time */}
      {seniorId && (
        <CheckInTimeEditor seniorId={seniorId} />
      )}

      {/* Display Name */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">Display Name</h2>
        </div>
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={100}
          className="h-12 rounded-xl text-base"
          placeholder="Your name"
        />
        <Button
          onClick={handleSaveName}
          disabled={nameSaving || !fullName.trim() || fullName.trim() === profile?.full_name}
          className="w-full h-12 rounded-xl font-bold"
        >
          {nameSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Name"}
        </Button>
      </div>

      {/* Email */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">Email Address</h2>
        </div>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          className="h-12 rounded-xl text-base"
          placeholder="your@email.com"
        />
        <p className="text-xs text-muted-foreground">
          Changing email requires confirmation via the new address.
        </p>
        <Button
          onClick={handleSaveEmail}
          disabled={emailSaving || !email.trim() || email.trim() === user?.email}
          className="w-full h-12 rounded-xl font-bold"
        >
          {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Email"}
        </Button>
      </div>

      {/* Password */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-base">Change Password</h2>
        </div>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-12 rounded-xl text-base pr-12"
            placeholder="New password (min 6 chars)"
            maxLength={128}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl text-base pr-12"
            placeholder="Confirm new password"
            maxLength={128}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <Button
          onClick={handleSavePassword}
          disabled={passwordSaving || !newPassword || !confirmPassword}
          className="w-full h-12 rounded-xl font-bold"
        >
          {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
        </Button>
      </div>

      {/* Preferences */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-4">
        <h2 className="font-bold text-base">Preferences</h2>
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Dark Mode</span>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
        <div className="flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Push Notifications</span>
          </div>
          <Switch
            checked={notifEnabled}
            onCheckedChange={async (v) => {
              setNotifEnabled(v);
              if (v && "Notification" in window && Notification.permission === "default") {
                const perm = await Notification.requestPermission();
                if (perm !== "granted") {
                  setNotifEnabled(false);
                  toast({ title: "Notifications blocked", description: "Please enable notifications in your browser settings.", variant: "destructive" });
                  return;
                }
              }
              toast({ title: v ? "Notifications enabled" : "Notifications disabled" });
            }}
          />
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
        <Button
          variant="outline"
          onClick={signOut}
          className="w-full h-12 rounded-xl font-bold text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Account info */}
      <div className="bg-muted/50 rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {user?.email}
        </p>
      </div>
    </div>
  );
}
