import { useState, useEffect, useCallback } from "react";
import { Plus, HelpCircle, Pencil, Trash2, MessageSquare, Mail, Phone, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AddEditContactModal from "@/components/contacts/AddEditContactModal";
import type { ContactData } from "@/components/contacts/ContactCard";

const priorityColors = ["hsl(0 72% 51%)", "hsl(36 90% 50%)", "hsl(220 10% 50%)"];
const autoDelays = [0, 30, 60];
const delayLabels = ["Notified immediately", "Notified if no response in 30 min", "Notified if no response in 60 min"];

interface Props {
  seniorId: string;
  seniorName: string;
  onContactCountChange?: (count: number) => void;
}

export default function EmergencyContactsSection({ seniorId, seniorName, onContactCountChange }: Props) {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const loadContacts = useCallback(async () => {
    const { data } = await supabase
      .from("managed_senior_contacts")
      .select("*")
      .eq("managed_senior_id", seniorId)
      .order("sort_order", { ascending: true });
    if (data) {
      const mapped = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship || "",
        phone: c.phone,
        email: c.email,
        notifyViaSms: c.notify_via_sms,
        notifyViaEmail: c.notify_via_email,
        delayMinutes: c.delay_minutes,
        sortOrder: c.sort_order,
      }));
      setContacts(mapped);
      onContactCountChange?.(mapped.length);
    }
    setLoading(false);
  }, [seniorId, onContactCountChange]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const handleSave = async (c: ContactData) => {
    const existing = contacts.find((p) => p.id === c.id);
    if (existing) {
      const { error } = await supabase.from("managed_senior_contacts").update({
        name: c.name, relationship: c.relationship, phone: c.phone, email: c.email,
        notify_via_sms: c.notifyViaSms, notify_via_email: c.notifyViaEmail,
      }).eq("id", c.id);
      if (error) { toast({ title: "Could not save contact — please try again.", variant: "destructive" }); return; }
      toast({ title: "Contact updated." });
    } else {
      const sortOrder = contacts.length;
      const { error } = await supabase.from("managed_senior_contacts").insert({
        managed_senior_id: seniorId, name: c.name, relationship: c.relationship,
        phone: c.phone, email: c.email, notify_via_sms: c.notifyViaSms,
        notify_via_email: c.notifyViaEmail, sort_order: sortOrder,
        delay_minutes: autoDelays[sortOrder] ?? 60,
      });
      if (error) { toast({ title: "Could not save contact — please try again.", variant: "destructive" }); return; }
      toast({ title: "Contact saved." });
    }
    setModalOpen(false);
    setEditingContact(null);
    await loadContacts();
  };

  const handleRemove = async (cid: string) => {
    await supabase.from("managed_senior_contacts").delete().eq("id", cid);
    setConfirmRemoveId(null);
    toast({ title: "Contact removed." });
    await loadContacts();
  };

  if (loading) return null;

  const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder);
  const isFirstContact = editingContact ? editingContact.sortOrder === 0 : contacts.length === 0;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black">Emergency Contacts</h3>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors" aria-label="Help">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[320px] text-sm leading-relaxed">
              <p>If {seniorName} misses a check-in, Contact 1 is notified immediately. If they don't respond within 30 minutes, Contact 2 is notified — and so on. At least 1 contact is required.</p>
              <div className="flex justify-end mt-3">
                <Button size="sm" className="rounded-xl font-bold" onClick={() => document.dispatchEvent(new Event("close-popover"))}>Got it</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Notified automatically if {seniorName} misses a check-in.</p>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center gap-3">
          <UserX className="w-10 h-10 text-muted-foreground" />
          <p className="font-black text-base">No emergency contacts yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">Add at least one contact so we know who to notify if {seniorName} misses a check-in.</p>
          <Button onClick={() => { setEditingContact(null); setModalOpen(true); }} className="rounded-xl font-black gap-1.5 mt-1">
            <Plus className="w-4 h-4" /> Add First Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((contact, i) => (
            <div key={contact.id} className="bg-background rounded-xl border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: priorityColors[Math.min(i, 2)], color: "#fff" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm">{contact.name}</p>
                        {i === 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: "hsl(var(--status-checked) / 0.12)", color: "hsl(var(--status-checked))" }}>PRIMARY</span>
                        )}
                      </div>
                      {contact.relationship && <p className="text-xs text-muted-foreground">{contact.relationship}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => { setEditingContact(contact); setModalOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-destructive hover:text-destructive" onClick={() => setConfirmRemoveId(contact.id)} disabled={sorted.length === 1}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                  {contact.phone && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1.5"><Phone className="w-3.5 h-3.5" /> {contact.phone}</span>
                  )}
                  {contact.email && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1 ml-3"><Mail className="w-3.5 h-3.5" /> {contact.email}</span>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {contact.notifyViaSms && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                        <MessageSquare className="w-3 h-3" /> SMS ✓
                      </span>
                    )}
                    {contact.notifyViaEmail && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                        <Mail className="w-3 h-3" /> Email ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-2">{delayLabels[Math.min(i, 2)]}</p>
                </div>
              </div>
              {confirmRemoveId === contact.id && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm text-muted-foreground">Remove {contact.name}?</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 font-bold" onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
                    <Button variant="destructive" size="sm" className="h-8 font-bold" onClick={() => handleRemove(contact.id)}>Remove</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {sorted.length < 3 && (
            <button
              onClick={() => { setEditingContact(null); setModalOpen(true); }}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Emergency Contact
            </button>
          )}
        </div>
      )}

      <AddEditContactModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingContact(null); }}
        contact={editingContact}
        onSave={handleSave}
        isFirstContact={isFirstContact}
        isMobile={isMobile}
      />
    </div>
  );
}
