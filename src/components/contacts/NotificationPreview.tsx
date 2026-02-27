import { useState } from "react";
import { Send, MessageSquare, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ContactData } from "./ContactCard";

interface NotificationPreviewProps {
  seniorName: string;
  firstContact: ContactData | null;
}

export default function NotificationPreview({ seniorName, firstContact }: NotificationPreviewProps) {
  const { toast } = useToast();
  const [sendingSms, setSendingSms] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  if (!firstContact) return null;

  const handleSendTestSms = async () => {
    setSendingSms(true);
    await new Promise(r => setTimeout(r, 1000));
    setSendingSms(false);
    toast({
      title: `Test SMS sent to ${firstContact.name}`,
      description: firstContact.phone || "via SMS",
    });
  };

  const handleSendEmail = async () => {
    if (!firstContact.email) {
      toast({
        title: "No email address",
        description: `${firstContact.name} doesn't have an email address configured.`,
        variant: "destructive",
      });
      return;
    }
    setSendingEmail(true);
    await new Promise(r => setTimeout(r, 1200));
    setSendingEmail(false);
    toast({
      title: `Notification emailed to ${firstContact.name}`,
      description: firstContact.email,
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <p className="font-black text-base mb-1">Preview Notification</p>
      <p className="text-xs text-muted-foreground mb-4">
        This is what your contacts receive when {seniorName} misses a check-in.
      </p>

      <div className="rounded-xl border border-border p-4" style={{ background: "hsl(var(--muted) / 0.4)" }}>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">SMS Preview</span>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border shadow-sm text-sm space-y-1.5">
          <p className="text-xs text-muted-foreground font-bold">Daily Guardian · Today at 9:05 AM</p>
          <p>
            Hi {firstContact.name.split(" ")[0]} — {seniorName} missed their 8:00 AM check-in.
            Please check on them.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Reply SAFE if you've confirmed they're okay, or call Daily Guardian at …
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold text-xs gap-1.5"
          disabled={sendingSms}
          onClick={handleSendTestSms}
        >
          {sendingSms ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
          ) : (
            <><Send className="w-3.5 h-3.5" /> Send Test SMS to {firstContact.name.split(" ")[0]} →</>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold text-xs gap-1.5"
          disabled={sendingEmail}
          onClick={handleSendEmail}
        >
          {sendingEmail ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
          ) : (
            <><Mail className="w-3.5 h-3.5" /> Send Email to {firstContact.name.split(" ")[0]} →</>
          )}
        </Button>
      </div>
    </div>
  );
}
