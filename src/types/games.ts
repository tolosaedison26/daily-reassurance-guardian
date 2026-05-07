export type GameType = "word_scramble" | "memory_match";
export type GameMode = "solo" | "vs" | "daily_challenge";
export type MatchStatus = "active" | "finished" | "abandoned";

export interface GamesMatch {
  id: string;
  game_type: GameType;
  mode: GameMode;
  player_a_id: string;
  player_b_id: string | null;
  status: MatchStatus;
  current_turn_user_id: string | null;
  game_state: Record<string, unknown>;
  score_a: number;
  score_b: number;
  daily_date: string | null;
  last_move_at: string;
  created_at: string;
}

export interface GamesMove {
  id: string;
  match_id: string;
  user_id: string;
  round_number: number | null;
  move_data: Record<string, unknown>;
  committed_at: string;
}

export interface GamesUserPrefs {
  user_id: string;
  big_text: boolean;
  high_contrast: boolean;
  dyslexia_font: boolean;
  reduced_motion: boolean;
  sms_turn_notify: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  grid_size: "standard" | "easy";
}

export interface GamesDailyActivity {
  user_id: string;
  date: string;
  turns_played: number;
  matches_completed: number;
}

export interface GameResult {
  gameType: GameType;
  score: number;
  rounds?: number;
  perfectRounds?: number;
  hintsUsed?: number;
  pairsMatched?: number;
  totalPairs?: number;
  moves?: number;
}

export interface MemoryCard {
  id: number;
  pairKey: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}
