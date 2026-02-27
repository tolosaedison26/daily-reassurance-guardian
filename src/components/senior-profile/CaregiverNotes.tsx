import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { MOCK_NOTES, type CaregiverNote } from "./mock-data";

interface CaregiverNotesProps {
  firstName: string;
}

export default function CaregiverNotes({ firstName }: CaregiverNotesProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<CaregiverNote[]>(MOCK_NOTES);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newNote.trim()) return;
    const note: CaregiverNote = { id: `n-${Date.now()}`, text: newNote.trim(), createdAt: new Date() };
    setNotes([note, ...notes]);
    setNewNote("");
    toast({ title: "Note saved" });
  };

  const handleEdit = (id: string) => {
    setNotes(notes.map((n) => n.id === id ? { ...n, text: editText } : n));
    setEditingId(null);
    toast({ title: "Note updated" });
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    setDeletingId(null);
    toast({ title: "Note deleted" });
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <h3 className="text-lg font-black mb-1">Caregiver Notes</h3>
      <p className="text-xs text-muted-foreground mb-4">Private notes visible only to you.</p>

      {/* Add note */}
      <div className="mb-4">
        <Textarea
          placeholder={`Add a note about ${firstName}…`}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value.slice(0, 500))}
          rows={2}
          className="rounded-xl resize-none text-sm"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-foreground">{newNote.length}/500</span>
          <Button size="sm" onClick={handleAdd} disabled={!newNote.trim()} className="font-bold rounded-xl">
            Save Note
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="p-3 rounded-xl bg-muted/50 border border-border">
            {editingId === note.id ? (
              <>
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value.slice(0, 500))}
                  rows={2}
                  className="rounded-lg resize-none text-sm mb-2"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleEdit(note.id)} className="font-bold">Save</Button>
                </div>
              </>
            ) : deletingId === note.id ? (
              <div>
                <p className="text-sm font-bold mb-2">Delete this note?</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(note.id)} className="font-bold">Delete</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground font-semibold">{format(note.createdAt, "MMM d · h:mm a")}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(note.id); setEditText(note.text); }} className="p-1 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => setDeletingId(note.id)} className="p-1 rounded hover:bg-muted"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </div>
                <p className="text-sm">{note.text}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No notes yet.</p>
      )}
    </div>
  );
}
