import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Lock, Moon, Bell, Eye, EyeOff, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AccountSettingsPage({ onBack }: { onBack?: () => void } = {}) {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Name
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [nameSaving, setNameSaving] = useState(false);

  // Email
  const [email, setEmail] = useState(user?.email || "");
  const [emailSaving, setEmailSaving] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notifications
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleSaveName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed || !user) return;
    setNameSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("user_id", user.id);
    if (!error) {
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
      await refreshProfile();
      toast({ title: "Name updated", description: "Your display name has been saved." });
    } else {
      toast({ title: "Error", description: "Failed to update name.", variant: "destructive" });
    }
    setNameSaving(false);
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

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-1 text-muted-foreground hover:text-foreground -ml-2 min-h-[44px]"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Button>

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

      {/* Role info */}
      <div className="bg-muted/50 rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-bold capitalize">{profile?.role || "user"}</span> · {user?.email}
        </p>
      </div>
    </div>
  );
}
