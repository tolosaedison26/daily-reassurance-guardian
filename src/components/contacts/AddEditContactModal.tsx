import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Mail } from "lucide-react";
import type { ContactData } from "./ContactCard";

interface AddEditContactModalProps {
  open: boolean;
  onClose: () => void;
  contact: ContactData | null; // null = add mode
  onSave: (contact: ContactData) => void;
  isFirstContact: boolean;
  isMobile: boolean;
}

export default function AddEditContactModal({ open, onClose, contact, onSave, isFirstContact, isMobile }: AddEditContactModalProps) {
  const isEdit = !!contact;
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sms, setSms] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [delay, setDelay] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setRelationship(contact.relationship);
      setPhone(contact.phone || "");
      setEmail(contact.email || "");
      setSms(contact.notifyViaSms);
      setEmailEnabled(contact.notifyViaEmail);
      setDelay(String(contact.delayMinutes));
    } else {
      setName(""); setRelationship(""); setPhone(""); setEmail("");
      setSms(true); setEmailEnabled(false); setDelay(isFirstContact ? "0" : "30");
    }
    setErrors({});
  }, [contact, open, isFirstContact]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!relationship.trim()) e.relationship = "Relationship is required";
    if (sms && !phone.trim()) e.phone = "Phone required when SMS enabled";
    if (emailEnabled && !email.trim()) e.email = "Email required when Email enabled";
    if (!sms && !emailEnabled) e.channel = "At least one channel required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: contact?.id || crypto.randomUUID(),
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      notifyViaSms: sms,
      notifyViaEmail: emailEnabled,
      delayMinutes: isFirstContact ? 0 : Number(delay),
      sortOrder: contact?.sortOrder ?? 999,
    });
    onClose();
  };

  const formContent = (
    <div className="space-y-4 p-1">
      <div>
        <Label className="text-sm font-bold">Name *</Label>
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl" />
        {errors.name && <p className="text-xs mt-1" style={{ color: "hsl(var(--status-alert))" }}>{errors.name}</p>}
      </div>
      <div>
        <Label className="text-sm font-bold">Relationship *</Label>
        <Input placeholder="e.g. Daughter, Neighbor, Physician" value={relationship} onChange={(e) => setRelationship(e.target.value)} className="mt-1 rounded-xl" />
        {errors.relationship && <p className="text-xs mt-1" style={{ color: "hsl(var(--status-alert))" }}>{errors.relationship}</p>}
      </div>
      <div>
        <Label className="text-sm font-bold">Phone Number</Label>
        <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 rounded-xl" />
        {errors.phone && <p className="text-xs mt-1" style={{ color: "hsl(var(--status-alert))" }}>{errors.phone}</p>}
      </div>
      <div>
        <Label className="text-sm font-bold">Email Address</Label>
        <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-xl" />
        {errors.email && <p className="text-xs mt-1" style={{ color: "hsl(var(--status-alert))" }}>{errors.email}</p>}
      </div>

      {/* Channels */}
      <div>
        <Label className="text-sm font-bold mb-2 block">Notify Via *</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setSms(!sms)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-colors"
            style={{
              background: sms ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted))",
              color: sms ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" /> SMS
          </button>
          <button
            onClick={() => setEmailEnabled(!emailEnabled)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-colors"
            style={{
              background: emailEnabled ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted))",
              color: emailEnabled ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
        </div>
        {errors.channel && <p className="text-xs mt-1" style={{ color: "hsl(var(--status-alert))" }}>{errors.channel}</p>}
      </div>

      {/* Delay */}
      <div>
        <Label className="text-sm font-bold mb-2 block">Escalation Delay</Label>
        {isFirstContact ? (
          <p className="text-xs text-muted-foreground">Contact 1 is always notified immediately.</p>
        ) : (
          <RadioGroup value={delay} onValueChange={setDelay} className="grid grid-cols-2 gap-2">
            {[
              { label: "Immediately", value: "0" },
              { label: "+30 minutes", value: "30" },
              { label: "+60 minutes", value: "60" },
              { label: "+2 hours", value: "120" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <RadioGroupItem value={opt.value} />
                {opt.label}
              </label>
            ))}
          </RadioGroup>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
        <Button onClick={handleSave} className="rounded-xl font-black">
          {isEdit ? "Save Contact" : "Add Contact"}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{isEdit ? `Edit Contact — ${contact?.name}` : "Add Emergency Contact"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Contact — ${contact?.name}` : "Add Emergency Contact"}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
