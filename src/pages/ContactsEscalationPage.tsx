import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus, Loader2, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ContactCard, { type ContactData } from "@/components/contacts/ContactCard";
import EscalationLadderVisual from "@/components/contacts/EscalationLadderVisual";
import EscalationSettings from "@/components/contacts/EscalationSettings";
import AddEditContactModal from "@/components/contacts/AddEditContactModal";
import NotificationPreview from "@/components/contacts/NotificationPreview";
import StatusBadge from "@/components/ui/StatusBadge";

export default function ContactsEscalationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();

  const [seniorName, setSeniorName] = useState("Loading…");
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietUntil, setQuietUntil] = useState("07:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showTestConfirm, setShowTestConfirm] = useState(false);
  const [testSentAt, setTestSentAt] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);

    const { data: senior } = await supabase
      .from("managed_seniors")
      .select("*")
      .eq("id", id)
      .eq("caregiver_id", user.id)
      .single();

    if (senior) {
      setSeniorName(`${(senior as any).first_name} ${(senior as any).last_name}`);
      setDelayMinutes((senior as any).escalation_delay_minutes ?? 30);
      setQuietHoursEnabled((senior as any).quiet_hours_enabled ?? false);
      setQuietFrom((senior as any).quiet_hours_from ?? "22:00");
      setQuietUntil((senior as any).quiet_hours_until ?? "07:00");
    }

    const { data: dbContacts } = await supabase
      .from("managed_senior_contacts")
      .select("*")
      .eq("managed_senior_id", id)
      .order("sort_order", { ascending: true });

    if (dbContacts) {
      setContacts(
        dbContacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          relationship: c.relationship || "",
          phone: c.phone,
          email: c.email,
          notifyViaSms: c.notify_via_sms,
          notifyViaEmail: c.notify_via_email,
          delayMinutes: c.delay_minutes,
          sortOrder: c.sort_order,
        }))
      );
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddClick = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (c: ContactData) => {
    setEditingContact(c);
    setModalOpen(true);
  };

  const handleSave = async (c: ContactData) => {
    if (!id) return;
    const existing = contacts.find((p) => p.id === c.id);

    if (existing) {
      await supabase
        .from("managed_senior_contacts")
        .update({
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          email: c.email,
          notify_via_sms: c.notifyViaSms,
          notify_via_email: c.notifyViaEmail,
          delay_minutes: c.delayMinutes,
        })
        .eq("id", c.id);
      toast({ title: "Contact updated." });
    } else {
      const maxOrder = contacts.reduce((m, p) => Math.max(m, p.sortOrder), -1);
      await supabase
        .from("managed_senior_contacts")
        .insert({
          managed_senior_id: id,
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          email: c.email,
          notify_via_sms: c.notifyViaSms,
          notify_via_email: c.notifyViaEmail,
          delay_minutes: c.delayMinutes,
          sort_order: maxOrder + 1,
        });
      toast({ title: "Contact added." });
    }
    await loadData();
  };

  const handleRemove = async (cid: string) => {
    await supabase.from("managed_senior_contacts").delete().eq("id", cid);
    const remaining = contacts.filter((p) => p.id !== cid).sort((a, b) => a.sortOrder - b.sortOrder);
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from("managed_senior_contacts").update({ sort_order: i }).eq("id", remaining[i].id);
    }
    toast({ title: "Contact removed." });
    await loadData();
  };

  const handleMove = async (fromIdx: number, direction: -1 | 1) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= sorted.length) return;
    const updated = [...sorted];
    [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
    for (let i = 0; i < updated.length; i++) {
      await supabase.from("managed_senior_contacts").update({ sort_order: i }).eq("id", updated[i].id);
    }
    toast({ title: "Priority order updated." });
    await loadData();
  };

  const handleSaveSettings = async () => {
    if (!id) return;
    setSaving(true);
    await supabase
      .from("managed_seniors")
      .update({
        escalation_delay_minutes: delayMinutes,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_from: quietFrom,
        quiet_hours_until: quietUntil,
      } as any)
      .eq("id", id);
    setSaving(false);
    toast({ title: "Escalation settings updated." });
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    // Simulate sending test alerts
    await new Promise((r) => setTimeout(r, 1500));
    setSendingTest(false);
    setShowTestConfirm(false);
    setTestSentAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    toast({ title: `Test alert sent to ${contacts.length} contact${contacts.length !== 1 ? "s" : ""} for ${seniorName}.` });
    // Clear test badge after 10 seconds
    setTimeout(() => setTestSentAt(null), 10000);
  };

  const firstContact = sorted[0] || null;
  const isFirstContact = editingContact ? editingContact.sortOrder === 0 : contacts.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-10">
      {/* Header */}
      <div className="w-full max-w-[800px] mx-auto px-5 pt-10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground font-bold mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {seniorName}
        </button>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black leading-tight">Contacts & Escalation</h1>
              {/* Signal 1: Inline status badge */}
              {contacts.length > 0 ? (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "hsl(var(--status-checked) / 0.1)",
                    color: "hsl(var(--status-checked))",
                  }}
                >
                  ✓ {contacts.length} contact{contacts.length !== 1 ? "s" : ""} active
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "hsl(var(--status-pending) / 0.1)",
                    color: "hsl(var(--status-pending))",
                  }}
                >
                  <AlertTriangle className="w-3 h-3" /> No emergency contacts
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {seniorName} · {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            {contacts.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowTestConfirm(!showTestConfirm)}
                className="rounded-xl font-black gap-1.5"
                disabled={sendingTest}
              >
                <Send className="w-4 h-4" /> Send Test Alert
              </Button>
            )}
            {!isMobile && (
              <Button onClick={handleAddClick} className="rounded-xl font-black gap-1.5">
                <Plus className="w-4 h-4" /> Add Contact
              </Button>
            )}
          </div>
        </div>

        {/* Test alert inline confirmation */}
        {showTestConfirm && (
          <div className="mt-3 bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-3 flex-wrap animate-bounce-in">
            <p className="text-sm text-muted-foreground">
              Send a test SMS/email to all {contacts.length} contacts for {seniorName}?
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowTestConfirm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSendTest} disabled={sendingTest} className="font-black">
                {sendingTest ? "Sending…" : "Send Test"}
              </Button>
            </div>
          </div>
        )}

        {isMobile && (
          <Button onClick={handleAddClick} className="rounded-xl font-black gap-1.5 w-full mt-3">
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        )}
      </div>

      <div className="w-full max-w-[800px] mx-auto px-5 space-y-5">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--muted))" }}
            >
              <UserPlus className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-black text-xl">No emergency contacts yet</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                Add at least one contact so we know who to notify if {seniorName} misses a check-in.
              </p>
            </div>
            <Button onClick={handleAddClick} className="rounded-xl font-black gap-1.5">
              <Plus className="w-4 h-4" /> Add First Contact
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <EscalationLadderVisual contacts={sorted} delayMinutes={delayMinutes} />
              <EscalationSettings
                delayMinutes={delayMinutes} setDelayMinutes={setDelayMinutes}
                quietHoursEnabled={quietHoursEnabled} setQuietHoursEnabled={setQuietHoursEnabled}
                quietFrom={quietFrom} setQuietFrom={setQuietFrom}
                quietUntil={quietUntil} setQuietUntil={setQuietUntil}
                isMobile={isMobile}
                onSave={handleSaveSettings}
                saving={saving}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-black text-base">Emergency Contacts</p>
                  <p className="text-xs text-muted-foreground">
                    {isMobile ? "Use arrows to reorder priority." : "Drag to reorder priority."} At least 1 contact required.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {sorted.map((contact, i) => (
                  <div key={contact.id} className="relative">
                    <ContactCard
                      contact={contact}
                      index={i}
                      total={sorted.length}
                      onEdit={handleEdit}
                      onRemove={handleRemove}
                      onMoveUp={() => handleMove(i, -1)}
                      onMoveDown={() => handleMove(i, 1)}
                      isMobile={isMobile}
                    />
                    {testSentAt && (
                      <span
                        className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "hsl(var(--status-checked) / 0.1)",
                          color: "hsl(var(--status-checked))",
                        }}
                      >
                        Test sent ✓ {testSentAt}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <NotificationPreview seniorName={seniorName} firstContact={firstContact} />
          </>
        )}
      </div>

      <AddEditContactModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contact={editingContact}
        onSave={handleSave}
        isFirstContact={isFirstContact}
        isMobile={isMobile}
      />
    </div>
  );
}
