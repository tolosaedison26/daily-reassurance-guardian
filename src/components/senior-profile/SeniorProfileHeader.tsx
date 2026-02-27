import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Bell, CheckCircle, Pencil, MoreHorizontal, Phone, Copy, PauseCircle, PhoneCall, Download, Archive, Trash2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Status = "checked" | "awaiting" | "missed" | "none";

interface SeniorProfileHeaderProps {
  firstName: string;
  lastName: string;
  relationship?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  status: Status;
  lastCheckIn?: string | null;
  seniorId: string;
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
};

export default function SeniorProfileHeader({ firstName, lastName, relationship, dateOfBirth, phone, status, lastCheckIn, seniorId }: SeniorProfileHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [safeOpen, setSafeOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeText, setRemoveText] = useState("");
  const [sending, setSending] = useState(false);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`;
  const age = dateOfBirth ? getAge(dateOfBirth) : null;
  const sc = statusConfig[status];

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

  const handleMarkSafe = () => {
    setSafeOpen(false);
    toast({ title: `${fullName} marked safe` });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5 md:p-6">
      {/* Back link */}
      <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-4 -mt-1">
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
              <button onClick={copyPhone} className="p-0.5 rounded hover:bg-muted">
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
          {lastCheckIn && (
            <span className="text-[13px] text-muted-foreground">Last check-in: {lastCheckIn}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1 -mb-1">
        {/* Send Reminder */}
        <Popover open={reminderOpen} onOpenChange={setReminderOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-xl font-bold">
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
        <Popover open={safeOpen} onOpenChange={setSafeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 rounded-xl font-bold" style={{ borderColor: "hsl(var(--status-checked) / 0.4)", color: "hsl(var(--status-checked))" }}>
              <CheckCircle className="w-4 h-4" /> Mark Safe
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <p className="text-sm font-bold mb-3">Mark {firstName} as safe for today's check-in?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSafeOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleMarkSafe} className="font-bold" style={{ background: "hsl(var(--status-checked))", color: "#fff" }}>Mark Safe</Button>
            </div>
          </PopoverContent>
        </Popover>

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
            <DropdownMenuItem className="gap-2"><PauseCircle className="w-4 h-4" /> Pause Check-ins</DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => navigate(`/seniors/${seniorId}/contacts`)}>
              <PhoneCall className="w-4 h-4" /> Contacts & Escalation
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2"><Download className="w-4 h-4" /> Download History (CSV)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2"><Archive className="w-4 h-4" /> Archive Senior</DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => setRemoveOpen(true)}>
              <Trash2 className="w-4 h-4" /> Remove Senior
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
              onClick={() => { toast({ title: `${fullName} removed` }); navigate("/"); }}
            >
              Remove Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
