import { useState, useEffect, useCallback } from "react";
import { Send, MessageSquare, Loader2, Tag, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SeniorContext {
  name: string;
  age: number;
  streak: number;
  weekRate: number;
  avgResponseTime: string;
  avgMoodScore: string;
  email?: string;
}

interface ComposeMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senior: SeniorContext | null;
  channel: "email" | "sms";
  weekLabel: string;
}

const SMART_TAGS: { label: string; tag: string; description: string }[] = [
  { label: "Name", tag: "{{name}}", description: "Senior's full name" },
  { label: "First Name", tag: "{{firstName}}", description: "Senior's first name" },
  { label: "Age", tag: "{{age}}", description: "Senior's age" },
  { label: "Week", tag: "{{week}}", description: "Report week range" },
  { label: "Check-in Rate", tag: "{{checkInRate}}", description: "Weekly check-in %" },
  { label: "Streak", tag: "{{streak}}", description: "Current streak days" },
  { label: "Avg Response", tag: "{{avgResponse}}", description: "Average response time" },
  { label: "Mood", tag: "{{mood}}", description: "Average mood this week" },
];

function buildDefaultMessage(channel: "email" | "sms", senior: SeniorContext, weekLabel: string): string {
  if (channel === "sms") {
    return `Hi — here's {{firstName}}'s weekly update (${weekLabel}):\n\n` +
      `✅ Check-in rate: {{checkInRate}}%\n` +
      `🔥 Streak: {{streak}} days\n` +
      `⏱ Avg response: {{avgResponse}}\n` +
      `{{mood}}\n\n` +
      `— Daily Guardian`;
  }
  return `Weekly Report for {{name}} (Age {{age}})\nWeek of ${weekLabel}\n\n` +
    `Dear Caregiver,\n\n` +
    `Here is {{firstName}}'s weekly wellness summary:\n\n` +
    `• Check-in Rate: {{checkInRate}}%\n` +
    `• Current Streak: {{streak}} days\n` +
    `• Avg Response Time: {{avgResponse}}\n` +
    `• Mood Summary: {{mood}}\n\n` +
    `Please don't hesitate to reach out if you have any concerns.\n\n` +
    `Best regards,\nDaily Guardian`;
}

function resolveTags(message: string, senior: SeniorContext): string {
  return message
    .replace(/\{\{name\}\}/g, senior.name)
    .replace(/\{\{firstName\}\}/g, senior.name.split(" ")[0])
    .replace(/\{\{age\}\}/g, String(senior.age))
    .replace(/\{\{checkInRate\}\}/g, String(senior.weekRate))
    .replace(/\{\{streak\}\}/g, String(senior.streak))
    .replace(/\{\{avgResponse\}\}/g, senior.avgResponseTime)
    .replace(/\{\{mood\}\}/g, senior.avgMoodScore);
}

export default function ComposeMessageModal({
  open,
  onOpenChange,
  senior,
  channel,
  weekLabel,
}: ComposeMessageModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const defaultMessage = senior ? buildDefaultMessage(channel, senior, weekLabel) : "";

  useEffect(() => {
    if (open && senior) {
      setMessage(buildDefaultMessage(channel, senior, weekLabel));
    }
  }, [open, senior, channel, weekLabel]);

  const handleInsertTag = useCallback((tag: string) => {
    setMessage((prev) => prev + tag);
  }, []);

  const handleReset = () => {
    setMessage(defaultMessage);
  };

  const isModified = message !== defaultMessage;

  const handleSend = async () => {
    if (!senior) return;
    setSending(true);
    const resolved = resolveTags(message, senior);
    // Simulate send
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    onOpenChange(false);
    toast({
      title: channel === "email" ? "Report Emailed" : "SMS Sent",
      description: `${channel === "email" ? "Email" : "SMS"} sent to ${senior.name}${channel === "email" && senior.email ? ` (${senior.email})` : ""}.`,
    });
  };

  if (!senior) return null;

  const preview = resolveTags(message, senior);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {channel === "email" ? (
              <Send className="w-4 h-4 text-primary" />
            ) : (
              <MessageSquare className="w-4 h-4 text-primary" />
            )}
            {channel === "email" ? "Compose Email" : "Compose SMS"} — {senior.name.split(" ")[0]}
          </DialogTitle>
          <DialogDescription>
            Customize the message or use the default template. Smart tags auto-fill with {senior.name.split(" ")[0]}'s data.
          </DialogDescription>
        </DialogHeader>

        {/* Smart Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Tag className="w-3 h-3" /> Insert Smart Tag
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SMART_TAGS.map((t) => (
              <Badge
                key={t.tag}
                variant="outline"
                className="cursor-pointer text-[10px] hover:bg-accent transition-colors"
                onClick={() => handleInsertTag(t.tag)}
                title={t.description}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground">Message</label>
            {isModified && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={handleReset}>
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            )}
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={channel === "sms" ? 6 : 10}
            className="text-sm font-mono resize-none"
            placeholder="Type your message…"
          />
          <p className="text-[10px] text-muted-foreground">
            {channel === "sms" && `${resolveTags(message, senior).length} characters`}
            {isModified && " · Modified from default"}
          </p>
        </div>

        {/* Live Preview */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">Preview</label>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
            {preview}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-1.5 font-bold"
            disabled={sending || !message.trim()}
            onClick={handleSend}
          >
            {sending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
            ) : (
              <>
                {channel === "email" ? <Send className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                Send {channel === "email" ? "Email" : "SMS"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
