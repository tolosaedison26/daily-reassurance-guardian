import { supabase } from "@/integrations/supabase/client";
import type { GameType, GameMode, GamesMatch } from "@/types/games";

/** Create a new solo match */
export async function createMatch(
  userId: string,
  gameType: GameType,
  mode: GameMode,
  gameState: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("games_matches")
    .insert({
      game_type: gameType,
      mode,
      player_a_id: userId,
      game_state: gameState,
      status: "active",
    } as never)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as GamesMatch;
}

/** Finish a match with final score */
export async function finishMatch(matchId: string, score: number) {
  const { error } = await supabase
    .from("games_matches")
    .update({
      status: "finished",
      score_a: score,
      last_move_at: new Date().toISOString(),
    } as never)
    .eq("id", matchId);

  if (error) throw error;
}

/** Record a move */
export async function recordMove(
  matchId: string,
  userId: string,
  roundNumber: number,
  moveData: Record<string, unknown>
) {
  const { error } = await supabase
    .from("games_moves")
    .insert({
      match_id: matchId,
      user_id: userId,
      round_number: roundNumber,
      move_data: moveData,
    } as never);

  if (error) throw error;
}

/** Upsert daily activity */
export async function trackDailyActivity(
  userId: string,
  turnsPlayed: number,
  matchCompleted: boolean
) {
  const today = new Date().toISOString().split("T")[0];

  // Try upsert: increment turns, conditionally increment matches
  const { data: existing } = await supabase
    .from("games_daily_activity")
    .select("turns_played, matches_completed")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("games_daily_activity")
      .update({
        turns_played: (existing as { turns_played: number }).turns_played + turnsPlayed,
        matches_completed: (existing as { matches_completed: number }).matches_completed + (matchCompleted ? 1 : 0),
      } as never)
      .eq("user_id", userId)
      .eq("date", today);
  } else {
    await supabase
      .from("games_daily_activity")
      .insert({
        user_id: userId,
        date: today,
        turns_played: turnsPlayed,
        matches_completed: matchCompleted ? 1 : 0,
      } as never);
  }
}

/** Get recent match history */
export async function getRecentMatches(userId: string, limit = 10): Promise<GamesMatch[]> {
  const { data, error } = await supabase
    .from("games_matches")
    .select("*")
    .eq("player_a_id", userId)
    .eq("status", "finished")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as unknown as GamesMatch[]) || [];
}

/** Get stats summary for a user */
export async function getGameStats(userId: string) {
  const { data, error } = await supabase
    .from("games_matches")
    .select("game_type, score_a, status")
    .eq("player_a_id", userId)
    .eq("status", "finished");

  if (error) throw error;
  const matches = (data || []) as unknown as { game_type: GameType; score_a: number }[];

  const stats = {
    word_scramble: { played: 0, totalScore: 0, bestScore: 0 },
    memory_match: { played: 0, totalScore: 0, bestScore: 0 },
  };

  for (const m of matches) {
    const s = stats[m.game_type];
    s.played++;
    s.totalScore += m.score_a;
    if (m.score_a > s.bestScore) s.bestScore = m.score_a;
  }

  return stats;
}
