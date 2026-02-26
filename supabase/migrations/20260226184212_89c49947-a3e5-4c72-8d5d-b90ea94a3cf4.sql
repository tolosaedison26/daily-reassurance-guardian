
-- Create favorite_sounds table
CREATE TABLE public.favorite_sounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sound_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sound_id)
);

-- Enable RLS
ALTER TABLE public.favorite_sounds ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
ON public.favorite_sounds FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own favorites
CREATE POLICY "Users can insert own favorites"
ON public.favorite_sounds FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete own favorites
CREATE POLICY "Users can delete own favorites"
ON public.favorite_sounds FOR DELETE
USING (auth.uid() = user_id);
