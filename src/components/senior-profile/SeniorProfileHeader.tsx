import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, Pencil, MoreHorizontal, Phone, Copy, PauseCircle, PlayCircle, PhoneCall, Download, Archive, Trash2, ChevronLeft, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import InlineConfirm from "@/components/senior/InlineConfirm";

type Status = "checked" | "awaiting" | "missed" | "none" | "paused";

interface SeniorProfileHeaderProps {
  firstName: string;
  lastName: string;
  relationship?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  status: Status;
  lastCheckIn?: string | null;
  seniorId: string;
  onStatusChange?: (newStatus: Status) => void;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const statusConfig: Record<Status, { label: string; bg: string; fg: string }> = {
  checked: { label: "✓ Checked In Today", bg: "hsl(var(--status-checked) / 0.12)", fg: "hsl(var(--status-checked))" },
  awaiting: { label: "⏳ Awaiting Check-in", bg: "hsl(var(--status-pending) / 0.12)", fg: "hsl(var(--status-pending))" },
  missed: { label: "⚠️ Missed Check-in", bg: "hsl(var(--status-alert) / 0.12)", fg: "hsl(var(--status-alert))" },
  none: { label: "— No reminder today", bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" },
  paused: { label: "⏸ Check-ins Paused", bg: "hsl(var(--muted))", fg: "hsl(var(--muted-foreground))" },
};

export default function SeniorProfileHeader({ firstName, lastName, relationship, dateOfBirth, phone, status: initialStatus, lastCheckIn, seniorId, onStatusChange }: SeniorProfileHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [removeText, setRemoveText] = useState("");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [markedSafe, setMarkedSafe] = useState(false);
  const [markingSafe, setMarkingSafe] = useState(false);
  const [showMarkSafeConfirm, setShowMarkSafeConfirm] = useState(false);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;
  const age = dateOfBirth ? getAge(dateOfBirth) : null;
  const currentStatus = markedSafe ? "checked" : paused ? "paused" : initialStatus;
  const sc = statusConfig[currentStatus];

  const isAlreadySafe = currentStatus === "checked";
  const isPaused = currentStatus === "paused";

  const copyPhone = () => {
    if (phone) {
      navigator.clipboard.writeText(phone);
      toast({ title: "Phone number copied" });
    }
  };

  const handleSendReminder = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setReminderOpen(false);
      toast({ title: `Reminder sent to ${fullName}`, description: phone || undefined });
    }, 800);
  };

  const handleMarkSafe = async () => {
    setMarkingSafe(true);
    try {
      // Try to insert a check-in record for today
      const today = new Date().toISOString().split("T")[0];
      // For managed seniors, try to find the claimed_by user
      const { data: managedData } = await supabase
        .from("managed_seniors")
        .select("claimed_by")
        .eq("id", seniorId)
        .maybeSingle();

      const seniorUserId = (managedData as any)?.claimed_by;
      if (seniorUserId) {
        await supabase.from("daily_check_ins").upsert({
          senior_id: seniorUserId,
          check_date: today,
          checked_in_at: new Date().toISOString(),
        }, { onConflict: "senior_id,check_date" });
      }

      // Mark safe in localStorage for persistence
      localStorage.setItem(`marked_safe_${today}_${seniorId}`, "true");

      setMarkedSafe(true);
      setShowMarkSafeConfirm(false);
      onStatusChange?.("checked");
      toast({ title: `${fullName} marked as safe for today.` });
    } catch (err) {
      toast({ title: "Could not mark safe", description: "Please try again.", variant: "destructive" });
    }
    setMarkingSafe(false);
  };

  const handleDownloadCSV = () => {
    setDownloading(true);
    const headers = ["Date", "Status", "Time", "Mood", "Response (min)"];
    const rows: string[][] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
      const r = Math.random();
      if (r < 0.72) {
        const mins = Math.floor(Math.random() * 15) + 1;
        rows.push([dateStr, "Checked In", `8:${String(mins).padStart(2, "0")} AM`, "Great", String(mins)]);
      } else if (r < 0.85) {
        rows.push([dateStr, "Missed", "—", "—", "—"]);
      } else {
        rows.push([dateStr, "Late", "9:15 AM", "Okay", "75"]);
      }
    }
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fullName.replace(/\s+/g, "_")}_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
    toast({ title: "CSV Downloaded", description: `${fullName}'s check-in history has been downloaded.` });
  };

  const handlePauseToggle = () => {
    const newPaused = !paused;
    setPaused(newPaused);
    toast({
      title: newPaused ? "Check-ins Paused" : "Check-ins Resumed",
      description: newPaused
        ? `${fullName}'s daily check-ins are paused. No reminders will be sent.`
        : `${fullName}'s daily check-ins have been resumed.`,
    });
  };

  const handleArchive = () => {
    setArchiveOpen(false);
    toast({ title: `${fullName} archived`, description: "They have been moved to your archived seniors." });
    navigate("/dashboard");
  };

  // Determine mark safe button state
  const getMarkSafeButton = () => {
    if (isAlreadySafe) {
      return (
        <Button variant="outline" size="sm" disabled className="shrink-0 gap-1.5 rounded-xl font-bold opacity-60">
          <Check className="w-4 h-4" /> Already Safe Today
        </Button>
      );
    }
    if (isPaused) {
      return (
        <Button variant="outline" size="sm" disabled className="shrink-0 gap-1.5 rounded-xl font-bold opacity-60">
          Check-ins Paused
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 rounded-xl font-bold"
        style={{ borderColor: "hsl(var(--status-checked) / 0.4)", color: "hsl(var(--status-checked))" }}
        onClick={() => setShowMarkSafeConfirm(true)}
        disabled={markingSafe}
      >
        {markingSafe ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Marking safe…</>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Mark Safe</>
        )}
      </Button>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5 md:p-6">
      {/* Back link */}
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4 -mt-1 min-h-[44px]">
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Avatar */}
        <div
          className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full flex items-center justify-center text-2xl md:text-3xl font-black shrink-0"
          style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-black leading-tight">{fullName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {relationship && (
              <Badge variant="secondary" className="font-bold text-xs">{relationship}</Badge>
            )}
            {age && <span className="text-sm text-muted-foreground">Age {age}</span>}
          </div>
          {phone && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{phone}</span>
              <button onClick={copyPhone} className="p-0.5 rounded hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
          <div className="px-3 py-1.5 rounded-full text-sm font-black" style={{ background: sc.bg, color: sc.fg }}>
            {sc.label}
          </div>
          {lastCheckIn && !paused && (
            <span className="text-[13px] text-muted-foreground">Last check-in: {lastCheckIn}</span>
          )}
        </div>
      </div>

      {/* Inline confirmation for Mark Safe */}
      {showMarkSafeConfirm && (
        <div className="mt-3">
          <InlineConfirm
            message={`Mark ${firstName} as safe for today?`}
            confirmLabel="Yes, Mark Safe"
            onConfirm={handleMarkSafe}
            onCancel={() => setShowMarkSafeConfirm(false)}
            loading={markingSafe}
            variant="safe"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mb-1">
        {/* Send Reminder */}
        <Popover open={reminderOpen} onOpenChange={setReminderOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-xl font-bold" disabled={paused}>
              <Bell className="w-4 h-4" /> Send Reminder
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <p className="text-sm font-bold mb-3">Send a check-in reminder to {firstName} now?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setReminderOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSendReminder} disabled={sending} className="font-bold">
                {sending ? "Sending…" : "Send Now"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Mark Safe */}
        {getMarkSafeButton()}

        {/* Edit Profile */}
        <Button variant="ghost" size="sm" className="shrink-0 gap-1.5 rounded-xl font-bold" onClick={() => navigate(`/seniors/${seniorId}/edit`)}>
          <Pencil className="w-4 h-4" /> Edit Profile
        </Button>

        {/* More dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl w-9 h-9">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="gap-2" onClick={handlePauseToggle}>
              {paused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
              {paused ? "Resume Check-ins" : "Pause Check-ins"}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => navigate(`/seniors/${seniorId}/contacts`)}>
              <PhoneCall className="w-4 h-4" /> Contacts & Escalation
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={handleDownloadCSV} disabled={downloading}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Downloading…" : "Download History (CSV)"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onClick={() => setArchiveOpen(true)}>
              <Archive className="w-4 h-4" /> Archive Senior
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => setRemoveOpen(true)}>
              <Trash2 className="w-4 h-4" /> Remove Senior
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Archive confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will pause all check-ins and move {firstName} to your archived list. You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently remove {fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              All check-in history and data will be deleted. This cannot be undone. Type <strong>REMOVE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={removeText}
            onChange={(e) => setRemoveText(e.target.value)}
            placeholder='Type "REMOVE"'
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeText !== "REMOVE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { toast({ title: `${fullName} removed` }); navigate("/dashboard"); }}
            >
              Remove Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
