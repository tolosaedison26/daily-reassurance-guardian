import { supabase } from "@/integrations/supabase/client";
import type { GameType, GameMode, GamesMatch, GamesInvitation, VsGameState, GameResult } from "@/types/games";
import { generateInviteCode, pickWords, shuffle } from "./helpers";
import { CARD_SETS } from "@/data/game-cards";

/** Create a new match */
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

/** Create a VS match with invitation */
export async function createVsMatch(userId: string, gameType: GameType) {
  // Build game state with puzzle data
  const vsState: VsGameState = {
    playerADone: false,
    playerBDone: false,
    playerAResult: null,
    playerBResult: null,
  };

  if (gameType === "word_scramble") {
    vsState.words = pickWords(5);
  } else {
    const set = CARD_SETS[Math.floor(Math.random() * CARD_SETS.length)];
    const pairs = shuffle(set).slice(0, 8);
    vsState.cardPairs = pairs.map((p) => ({ key: p.key, label: p.label }));
    // Generate a shuffled order for 16 cards (8 pairs x 2)
    const order = Array.from({ length: 16 }, (_, i) => i);
    vsState.cardOrder = shuffle(order);
    vsState.totalPairs = 8;
  }

  // Create the match
  const match = await createMatch(userId, gameType, "vs", vsState as unknown as Record<string, unknown>);

  // Create invitation
  const code = generateInviteCode();
  const { error } = await supabase
    .from("games_invitations")
    .insert({
      inviter_id: userId,
      invite_code: code,
      match_id: match.id,
      status: "pending",
    } as never);

  if (error) throw error;

  return { match, inviteCode: code };
}

/** Join a VS match via invite code (uses SECURITY DEFINER RPC to bypass RLS) */
export async function joinVsMatch(inviteCode: string, _userId: string) {
  const { data, error } = await supabase.rpc("join_game", {
    p_invite_code: inviteCode,
  });

  if (error) {
    // Map Postgres exceptions to user-friendly messages
    const msg = error.message || "";
    if (msg.includes("Invalid or expired")) throw new Error("Invalid or expired invite code");
    if (msg.includes("your own game")) throw new Error("You can't join your own game");
    if (msg.includes("expired")) throw new Error("This invite code has expired");
    if (msg.includes("no longer available")) throw new Error("This game is no longer available");
    throw error;
  }

  return data as string;
}

/** Get a match by ID */
export async function getMatch(matchId: string): Promise<GamesMatch | null> {
  const { data, error } = await supabase
    .from("games_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as GamesMatch | null;
}

/** Submit VS player result (atomic via SECURITY DEFINER RPC) */
export async function submitVsResult(
  matchId: string,
  _userId: string,
  _isPlayerA: boolean,
  result: GameResult
) {
  const { data, error } = await supabase.rpc("submit_vs_result", {
    p_match_id: matchId,
    p_score: result.score,
    p_result: result as unknown as Record<string, unknown>,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("already finished")) return; // Idempotent
    if (msg.includes("Already submitted")) return; // Idempotent
    throw error;
  }

  return data as { finished: boolean };
}

/** Get active VS matches for a user */
export async function getActiveVsMatches(userId: string): Promise<GamesMatch[]> {
  const { data, error } = await supabase
    .from("games_matches")
    .select("*")
    .eq("mode", "vs")
    .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
    .in("status", ["active"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data as unknown as GamesMatch[]) || [];
}

/** Get invitation for a match */
export async function getMatchInvitation(matchId: string): Promise<GamesInvitation | null> {
  const { data, error } = await supabase
    .from("games_invitations")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as GamesInvitation | null;
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

/** Send a reaction */
export async function sendReaction(matchId: string, senderId: string, reactionId: number) {
  const { error } = await supabase
    .from("games_reactions")
    .insert({
      match_id: matchId,
      sender_id: senderId,
      reaction_id: reactionId,
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

  const { data: existing } = await supabase
    .from("games_daily_activity")
    .select("turns_played, matches_completed")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("games_daily_activity")
      .update({
        turns_played: (existing as { turns_played: number }).turns_played + turnsPlayed,
        matches_completed: (existing as { matches_completed: number }).matches_completed + (matchCompleted ? 1 : 0),
      } as never)
      .eq("user_id", userId)
      .eq("date", today);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("games_daily_activity")
      .insert({
        user_id: userId,
        date: today,
        turns_played: turnsPlayed,
        matches_completed: matchCompleted ? 1 : 0,
      } as never);
    if (error) throw error;
  }
}

/** Get recent match history (includes VS where user is player_a or player_b) */
export async function getRecentMatches(userId: string, limit = 10): Promise<GamesMatch[]> {
  const { data, error } = await supabase
    .from("games_matches")
    .select("*")
    .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
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
    .select("game_type, score_a, score_b, player_a_id, status")
    .or(`player_a_id.eq.${userId},player_b_id.eq.${userId}`)
    .eq("status", "finished");

  if (error) throw error;
  const matches = (data || []) as unknown as {
    game_type: GameType;
    score_a: number;
    score_b: number;
    player_a_id: string;
  }[];

  const stats = {
    word_scramble: { played: 0, totalScore: 0, bestScore: 0 },
    memory_match: { played: 0, totalScore: 0, bestScore: 0 },
  };

  for (const m of matches) {
    const s = stats[m.game_type];
    const myScore = m.player_a_id === userId ? m.score_a : m.score_b;
    s.played++;
    s.totalScore += myScore;
    if (myScore > s.bestScore) s.bestScore = myScore;
  }

  return stats;
}

/** Check if user already played today's daily challenge */
export async function getTodayDailyChallenge(
  userId: string,
  gameType: GameType,
  date: string
): Promise<GamesMatch | null> {
  const { data, error } = await supabase
    .from("games_matches")
    .select("*")
    .eq("mode", "daily_challenge")
    .eq("game_type", gameType)
    .eq("daily_date", date)
    .eq("player_a_id", userId)
    .eq("status", "finished")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data as unknown as GamesMatch[])?.[0] || null;
}

/** Save a completed daily challenge as a finished match */
export async function saveDailyChallenge(
  userId: string,
  gameType: GameType,
  dailyDate: string,
  score: number
): Promise<void> {
  const { error } = await supabase
    .from("games_matches")
    .insert({
      game_type: gameType,
      mode: "daily_challenge",
      player_a_id: userId,
      daily_date: dailyDate,
      score_a: score,
      status: "finished",
      game_state: {},
    } as never);

  if (error) throw error;
}

/** Get consecutive-day play streak from games_daily_activity */
export async function getDailyStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from("games_daily_activity")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(60);

  if (!data || data.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let current = today;

  for (const row of data as { date: string }[]) {
    if (row.date === current) {
      streak++;
      const d = new Date(current + "T12:00:00");
      d.setDate(d.getDate() - 1);
      current = d.toISOString().split("T")[0];
    } else if (row.date < current) {
      break;
    }
  }

  return streak;
}

/** Delete a match (and cascade to moves/reactions via FK) */
export async function deleteMatch(matchId: string) {
  const { error } = await supabase
    .from("games_matches")
    .delete()
    .eq("id", matchId);
  if (error) throw error;
}

/** Look up a user's display name from profiles */
export async function getPlayerName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as { full_name: string } | null)?.full_name || "Player";
}
