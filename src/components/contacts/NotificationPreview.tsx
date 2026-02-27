import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ContactData } from "./ContactCard";

interface NotificationPreviewProps {
  seniorName: string;
  firstContact: ContactData | null;
}

export default function NotificationPreview({ seniorName, firstContact }: NotificationPreviewProps) {
  const { toast } = useToast();

  if (!firstContact) return null;

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

      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl font-bold text-xs gap-1.5"
          onClick={() =>
            toast({
              title: `Test message sent to ${firstContact.name} (${firstContact.phone || firstContact.email}).`,
            })
          }
        >
          <Send className="w-3.5 h-3.5" />
          Send Test SMS to {firstContact.name.split(" ")[0]} →
        </Button>
      </div>
    </div>
  );
}
