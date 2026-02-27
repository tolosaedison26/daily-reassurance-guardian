import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactCard, { type ContactData } from "@/components/contacts/ContactCard";
import EscalationLadderVisual from "@/components/contacts/EscalationLadderVisual";
import EscalationSettings from "@/components/contacts/EscalationSettings";
import AddEditContactModal from "@/components/contacts/AddEditContactModal";
import NotificationPreview from "@/components/contacts/NotificationPreview";

const MOCK_CONTACTS: ContactData[] = [
  {
    id: "c1", name: "Sarah Ross", relationship: "Daughter",
    phone: "+1 (555) 234-5678", email: "sarah@email.com",
    notifyViaSms: true, notifyViaEmail: true, delayMinutes: 0, sortOrder: 0,
  },
  {
    id: "c2", name: "Tom Ross", relationship: "Son",
    phone: "+1 (555) 345-6789", email: null,
    notifyViaSms: true, notifyViaEmail: false, delayMinutes: 30, sortOrder: 1,
  },
  {
    id: "c3", name: "Dr. Kim", relationship: "Physician",
    phone: null, email: "dr.kim@clinic.com",
    notifyViaSms: false, notifyViaEmail: true, delayMinutes: 60, sortOrder: 2,
  },
];

export default function ContactsEscalationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const seniorName = "Margaret Ross";

  const [contacts, setContacts] = useState<ContactData[]>(MOCK_CONTACTS);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [enable911, setEnable911] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietUntil, setQuietUntil] = useState("07:00");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);

  const sorted = [...contacts].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddClick = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (c: ContactData) => {
    setEditingContact(c);
    setModalOpen(true);
  };

  const handleSave = (c: ContactData) => {
    setContacts((prev) => {
      const existing = prev.find((p) => p.id === c.id);
      if (existing) {
        return prev.map((p) => (p.id === c.id ? { ...c, sortOrder: p.sortOrder } : p));
      }
      const maxOrder = prev.reduce((m, p) => Math.max(m, p.sortOrder), -1);
      return [...prev, { ...c, sortOrder: maxOrder + 1 }];
    });
    toast({ title: editingContact ? "Contact updated." : "Contact added." });
  };

  const handleRemove = (cid: string) => {
    setContacts((prev) => {
      const filtered = prev.filter((p) => p.id !== cid);
      return filtered.map((p, i) => ({ ...p, sortOrder: i }));
    });
    toast({ title: "Contact removed." });
  };

  const handleMove = (fromIdx: number, direction: -1 | 1) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= sorted.length) return;
    const updated = [...sorted];
    [updated[fromIdx], updated[toIdx]] = [updated[toIdx], updated[fromIdx]];
    setContacts(updated.map((c, i) => ({ ...c, sortOrder: i })));
    toast({ title: "Priority order updated." });
  };

  const firstContact = sorted[0] || null;
  const isFirstContact = editingContact ? editingContact.sortOrder === 0 : contacts.length === 0;

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
            <h1 className="text-2xl font-black leading-tight">Contacts & Escalation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {seniorName} · {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            </p>
          </div>
          {!isMobile && (
            <Button onClick={handleAddClick} className="rounded-xl font-black gap-1.5">
              <Plus className="w-4 h-4" /> Add Contact
            </Button>
          )}
        </div>
        {isMobile && (
          <Button onClick={handleAddClick} className="rounded-xl font-black gap-1.5 w-full mt-3">
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        )}
      </div>

      <div className="w-full max-w-[800px] mx-auto px-5 space-y-5">
        {contacts.length === 0 ? (
          /* Empty state */
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
            {/* Section 1 & 2: Ladder + Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <EscalationLadderVisual contacts={sorted} delayMinutes={delayMinutes} enable911={enable911} />
              <EscalationSettings
                delayMinutes={delayMinutes} setDelayMinutes={setDelayMinutes}
                loopEnabled={loopEnabled} setLoopEnabled={setLoopEnabled}
                enable911={enable911} setEnable911={setEnable911}
                quietHoursEnabled={quietHoursEnabled} setQuietHoursEnabled={setQuietHoursEnabled}
                quietFrom={quietFrom} setQuietFrom={setQuietFrom}
                quietUntil={quietUntil} setQuietUntil={setQuietUntil}
                isMobile={isMobile}
              />
            </div>

            {/* Section 3: Contact Cards */}
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
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    index={i}
                    total={sorted.length}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                    onMoveUp={() => handleMove(i, -1)}
                    onMoveDown={() => handleMove(i, 1)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </div>

            {/* Section 5: Notification Preview */}
            <NotificationPreview seniorName={seniorName} firstContact={firstContact} />
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
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
