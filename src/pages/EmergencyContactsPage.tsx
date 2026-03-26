import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Trash2, Loader2, AlertTriangle, Info, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { normalizePhone, formatPhoneDisplay, triggerEmergencyContactWebhook } from "@/lib/supabase-helpers";

interface Contact {
  id?: string;
  name: string;
  phone: string;
}

const MAX_CONTACTS = 3;

const PRIORITY_LABELS = [
  "First to notify",
  "Second to notify",
  "Third to notify",
];

export default function EmergencyContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seniorId, setSeniorId] = useState<string | null>(null);
  const [seniorName, setSeniorName] = useState<string>("");
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: senior } = await supabase
      .from("seniors")
      .select("id, name")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (senior) {
      setSeniorId(senior.id);
      setSeniorName(senior.name || "");
      const { data: existing } = await supabase
        .from("emergency_contacts")
        .select("id, name, phone")
        .eq("senior_id", senior.id)
        .order("priority", { ascending: true });

      if (existing && existing.length > 0) {
        setContacts(existing.map((c) => ({ id: c.id, name: c.name || "", phone: c.phone || "" })));
        setExistingPhones(new Set(existing.map((c) => c.phone || "")));
      } else {
        setContacts([{ name: "", phone: "" }]);
        setExistingPhones(new Set());
      }
    } else {
      setContacts([{ name: "", phone: "" }]);
    }
    setLoading(false);
  };

  const updateContact = (index: number, field: "name" | "phone", value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addContact = () => {
    if (contacts.length >= MAX_CONTACTS) return;
    setContacts((prev) => [...prev, { name: "", phone: "" }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length <= 1) return;
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const moveContact = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= contacts.length) return;
    setContacts((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSave = async () => {
    if (!seniorId || !user) return;

    const filled = contacts.filter((c) => c.name.trim() && c.phone.trim());
    if (filled.length === 0) {
      toast({ title: "At least one contact is required", description: "Please enter a name and phone number.", variant: "destructive" });
      return;
    }

    for (let i = 0; i < contacts.length; i++) {
      const c = contacts[i];
      if (c.name.trim() && !c.phone.trim()) {
        toast({ title: `Contact ${i + 1} needs a phone number`, variant: "destructive" });
        return;
      }
      if (!c.name.trim() && c.phone.trim()) {
        toast({ title: `Contact ${i + 1} needs a name`, variant: "destructive" });
        return;
      }
    }

    setSaving(true);

    // Capture old contact IDs before save (for safe delete-after-insert)
    const oldIds = contacts.filter((c) => c.id).map((c) => c.id!);

    const rows = filled.map((c, i) => ({
      senior_id: seniorId,
      name: c.name.trim(),
      phone: normalizePhone(c.phone) || c.phone.trim(),
      priority: i,
      sort_order: i,
      user_id: user.id,
    }));

    // Insert new rows first — if this fails, old contacts remain intact
    const { data: inserted, error } = await supabase.from("emergency_contacts").insert(rows).select("id, name, phone");
    if (error) {
      toast({ title: "Failed to save contacts", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Insert succeeded — now safe to delete old rows
    if (oldIds.length > 0) {
      await supabase.from("emergency_contacts").delete().in("id", oldIds);
    }

    toast({ title: "Emergency contacts saved" });

    // Notify new contacts via n8n webhook (fire-and-forget)
    if (inserted) {
      const newContacts = inserted.filter((c) => !existingPhones.has(c.phone));
      for (const c of newContacts) {
        triggerEmergencyContactWebhook({
          senior_name: seniorName,
          contact_name: c.name,
          contact_phone: c.phone,
          senior_id: seniorId,
          contact_id: c.id,
        });
      }
    }

    await loadData();
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-black text-foreground">Emergency Contacts</h1>
        </div>
        <p className="text-base text-muted-foreground">
          If you miss a check-in, these people will be notified automatically in the order shown below.
        </p>
      </div>

      {/* Escalation explanation */}
      <div className="rounded-2xl p-4 space-y-3" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
        <h2 className="font-bold text-base text-foreground">How Escalation Works</h2>
        <div className="space-y-2">
          {PRIORITY_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: i === 0 ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm text-muted-foreground">{label}</span>
              {i < 2 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {i === 0 ? "Immediately" : `If #${i} doesn't respond`}
                </span>
              )}
              {i === 2 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  If #2 doesn't respond
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact cards */}
      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div key={index} className="bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Contact {index + 1}
                  {index === 0 && <span className="text-xs text-primary ml-2 font-semibold">(Required)</span>}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{PRIORITY_LABELS[index]}</p>
              </div>
              <div className="flex items-center gap-1">
                {/* Move up */}
                {index > 0 && (
                  <button
                    onClick={() => moveContact(index, "up")}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                )}
                {/* Move down */}
                {index < contacts.length - 1 && (
                  <button
                    onClick={() => moveContact(index, "down")}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                )}
                {/* Remove */}
                {index > 0 && (
                  <button
                    onClick={() => removeContact(index)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Remove contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Name</Label>
              <Input
                value={contact.name}
                onChange={(e) => updateContact(index, "name", e.target.value)}
                placeholder="Contact name"
                className="mt-1 h-12 text-base rounded-xl"
                maxLength={100}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Phone Number</Label>
              <Input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateContact(index, "phone", formatPhoneDisplay(e.target.value))}
                placeholder="+1 (555) 000-0000"
                className="mt-1 h-12 text-base rounded-xl"
                maxLength={20}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add contact button */}
      {contacts.length < MAX_CONTACTS && (
        <button
          onClick={addContact}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[56px] font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Another Contact ({contacts.length}/{MAX_CONTACTS})
        </button>
      )}

      {/* Opt-out notice */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Emergency contacts will receive SMS notifications if you miss a check-in.
          They can opt out at any time by replying STOP to any notification they receive.
        </p>
      </div>

      {/* No contacts warning */}
      {contacts.every((c) => !c.name.trim() || !c.phone.trim()) && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "hsl(var(--status-alert) / 0.06)", border: "1px solid hsl(var(--status-alert) / 0.2)" }}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--status-alert))" }} />
          <p className="text-sm font-semibold" style={{ color: "hsl(var(--status-alert))" }}>
            You need at least one emergency contact. Without contacts, no one will be notified if you miss a check-in.
          </p>
        </div>
      )}

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 text-lg font-black rounded-2xl border-0"
        style={{ background: "hsl(var(--status-checked))", color: "#fff" }}
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Contacts"}
      </Button>
    </div>
  );
}
