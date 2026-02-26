import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Phone, Plus, Trash2, X, UserPlus } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

interface Props {
  userId: string;
}

export default function EmergencyContacts({ userId }: Props) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);
  const [callContact, setCallContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    loadContacts();
  }, [userId]);

  const loadContacts = async () => {
    const { data } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (data) setContacts(data);
  };

  const handleAdd = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) return;
    setSaving(true);
    await supabase.from("emergency_contacts").insert({
      user_id: userId,
      name: trimmedName,
      phone: trimmedPhone,
      relationship: relationship.trim() || null,
    });
    setName("");
    setPhone("");
    setRelationship("");
    setShowAdd(false);
    setSaving(false);
    loadContacts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Emergency Contacts</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-2xl bg-card border border-border shadow-card p-4 space-y-3 animate-bounce-in">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            maxLength={100}
            className="h-12 rounded-xl text-base"
          />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            maxLength={20}
            className="h-12 rounded-xl text-base"
          />
          <Input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Relationship (optional)"
            maxLength={50}
            className="h-12 rounded-xl text-base"
          />
          <Button
            onClick={handleAdd}
            disabled={saving || !name.trim() || !phone.trim()}
            className="w-full h-12 rounded-xl font-bold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : "Add Contact"}
          </Button>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground text-center py-3">
          No emergency contacts yet. Tap "Add" to create one.
        </p>
      )}

      {contacts.map((contact) => (
        <button
          key={contact.id}
          onClick={() => setCallContact(contact)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-card text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{contact.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {contact.relationship ? `${contact.relationship} · ` : ""}
              {contact.phone}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(contact.id);
            }}
            className="p-2 rounded-full hover:bg-destructive/10 shrink-0"
            aria-label={`Delete ${contact.name}`}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </button>
      ))}

      {/* Call confirmation dialog */}
      <AlertDialog open={!!callContact} onOpenChange={(open) => !open && setCallContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              📞 Call {callContact?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              This will dial {callContact?.phone}
              {callContact?.relationship ? ` (${callContact.relationship})` : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction asChild>
              <a
                href={`tel:${callContact?.phone}`}
                className="w-full h-14 text-lg font-black rounded-xl border-0 bg-primary text-primary-foreground flex items-center justify-center"
              >
                Yes, Call Now
              </a>
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-xl mt-0">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
