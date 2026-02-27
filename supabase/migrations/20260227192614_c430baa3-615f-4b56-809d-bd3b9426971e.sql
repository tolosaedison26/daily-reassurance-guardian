
-- Create caregiver_notes table
CREATE TABLE public.caregiver_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL,
  managed_senior_id uuid NOT NULL REFERENCES public.managed_seniors(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.caregiver_notes ENABLE ROW LEVEL SECURITY;

-- Only the note author can CRUD their own notes
CREATE POLICY "Caregivers can manage own notes"
  ON public.caregiver_notes
  FOR ALL
  USING (auth.uid() = caregiver_id)
  WITH CHECK (auth.uid() = caregiver_id);

-- Auto-update updated_at
CREATE TRIGGER update_caregiver_notes_updated_at
  BEFORE UPDATE ON public.caregiver_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
