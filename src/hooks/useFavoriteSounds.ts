import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFavoriteSounds(userId: string | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    
    const fetch = async () => {
      const { data } = await supabase
        .from("favorite_sounds")
        .select("sound_id")
        .eq("user_id", userId);
      if (data) setFavoriteIds(new Set(data.map((r) => r.sound_id)));
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const toggleFavorite = useCallback(async (soundId: string) => {
    if (!userId) return;
    const isFav = favoriteIds.has(soundId);

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(soundId);
      else next.add(soundId);
      return next;
    });

    if (isFav) {
      await supabase
        .from("favorite_sounds")
        .delete()
        .eq("user_id", userId)
        .eq("sound_id", soundId);
    } else {
      await supabase
        .from("favorite_sounds")
        .insert({ user_id: userId, sound_id: soundId });
    }
  }, [userId, favoriteIds]);

  return { favoriteIds, toggleFavorite, loading };
}
