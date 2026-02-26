
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emergency contacts"
ON public.emergency_contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts"
ON public.emergency_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts"
ON public.emergency_contacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts"
ON public.emergency_contacts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Caregivers can view connected seniors emergency contacts"
ON public.emergency_contacts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM senior_connections
  WHERE senior_connections.caregiver_id = auth.uid()
    AND senior_connections.senior_id = emergency_contacts.user_id
));
