-- Voice messages metadata table
CREATE TABLE public.voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL,
  audio_path TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seniors can insert own voice messages"
ON public.voice_messages FOR INSERT
WITH CHECK (auth.uid() = senior_id);

CREATE POLICY "Seniors can view own voice messages"
ON public.voice_messages FOR SELECT
USING (auth.uid() = senior_id);

CREATE POLICY "Caregivers can view connected seniors voice messages"
ON public.voice_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.senior_connections
    WHERE caregiver_id = auth.uid() AND senior_id = voice_messages.senior_id
  )
);

-- Storage bucket for voice messages (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', false);

CREATE POLICY "Seniors can upload voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Seniors can view own voice messages in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Caregivers can view connected seniors voice messages in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages'
  AND EXISTS (
    SELECT 1 FROM public.senior_connections
    WHERE caregiver_id = auth.uid()
    AND senior_id::text = (storage.foldername(name))[1]
  )
);