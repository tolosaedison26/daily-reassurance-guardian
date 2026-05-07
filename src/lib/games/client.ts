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

/** Join a VS match via invite code */
export async function joinVsMatch(inviteCode: string, userId: string) {
  // Find the invitation
  const { data: invitation, error: findErr } = await supabase
    .from("games_invitations")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase().trim())
    .eq("status", "pending")
    .maybeSingle();

  if (findErr) throw findErr;
  if (!invitation) throw new Error("Invalid or expired invite code");

  const inv = invitation as unknown as GamesInvitation;
  if (inv.inviter_id === userId) throw new Error("You can't join your own game");
  if (!inv.match_id) throw new Error("No match linked to this invitation");

  // Accept invitation
  await supabase
    .from("games_invitations")
    .update({ invitee_id: userId, status: "accepted" } as never)
    .eq("id", inv.id);

  // Join the match
  const { error: joinErr } = await supabase
    .from("games_matches")
    .update({ player_b_id: userId } as never)
    .eq("id", inv.match_id);

  if (joinErr) throw joinErr;

  return inv.match_id;
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

/** Submit VS player result */
export async function submitVsResult(
  matchId: string,
  userId: string,
  isPlayerA: boolean,
  result: GameResult
) {
  const match = await getMatch(matchId);
  if (!match) throw new Error("Match not found");

  const state = match.game_state as unknown as VsGameState;
  const otherDone = isPlayerA ? state.playerBDone : state.playerADone;

  const updates: Record<string, unknown> = {
    last_move_at: new Date().toISOString(),
  };

  if (isPlayerA) {
    updates.score_a = result.score;
    updates.game_state = {
      ...state,
      playerADone: true,
      playerAResult: result,
    };
  } else {
    updates.score_b = result.score;
    updates.game_state = {
      ...state,
      playerBDone: true,
      playerBResult: result,
    };
  }

  // If both done, mark match as finished
  if (otherDone) {
    updates.status = "finished";
  }

  const { error } = await supabase
    .from("games_matches")
    .update(updates as never)
    .eq("id", matchId);

  if (error) throw error;
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

/** Look up a user's display name from profiles */
export async function getPlayerName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as { full_name: string } | null)?.full_name || "Player";
}
