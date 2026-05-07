import { GAME_WORDS } from "@/data/game-words";
import { CARD_SETS, type CardPair } from "@/data/game-cards";
import type { MemoryCard } from "@/types/games";

/** Generate a 6-char invite code (no O/0/I/1 confusion) */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/** Fisher-Yates shuffle (returns new array) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick N random unique words from the word list */
export function pickWords(count: number): string[] {
  const shuffled = shuffle(GAME_WORDS);
  return shuffled.slice(0, count);
}

/** Scramble a word — guaranteed different from original */
export function scrambleWord(word: string): string[] {
  const letters = word.split("");
  if (letters.length <= 1) return letters;
  let scrambled: string[];
  let attempts = 0;
  do {
    scrambled = shuffle(letters);
    attempts++;
  } while (scrambled.join("") === word && attempts < 20);
  return scrambled;
}

/** Build a memory match card deck */
export function buildCardDeck(pairCount: 8 | 6): MemoryCard[] {
  // Pick a random card set
  const set = CARD_SETS[Math.floor(Math.random() * CARD_SETS.length)];
  const pairs: CardPair[] = shuffle(set).slice(0, pairCount);

  // Create two cards per pair, then shuffle all
  const cards: MemoryCard[] = [];
  pairs.forEach((pair, i) => {
    cards.push({ id: i * 2, pairKey: pair.key, label: pair.label, flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, pairKey: pair.key, label: pair.label, flipped: false, matched: false });
  });
  return shuffle(cards);
}

/** Seeded daily challenge (normal): deterministic word selection based on date */
export function seedDailyWords(dateStr: string, count: number): string[] {
  // Simple hash from date string for deterministic seed
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  // Use hash to pick starting index
  const start = Math.abs(hash) % GAME_WORDS.length;
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(GAME_WORDS[(start + i * 7) % GAME_WORDS.length]);
  }
  return words;
}

/** Seeded daily hard-mode words: only 6+ letter words, harder to unscramble */
export function seedDailyHardWords(dateStr: string, count: number): string[] {
  const hardWords = GAME_WORDS.filter((w) => w.length >= 6);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const start = Math.abs(hash) % hardWords.length;
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(hardWords[(start + i * 7) % hardWords.length]);
  }
  return words;
}

/** Seeded daily challenge: deterministic card deck based on date */
export function buildDailyCardDeck(dateStr: string): MemoryCard[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const absHash = Math.abs(hash);

  // Pick a card set deterministically
  const setIndex = absHash % CARD_SETS.length;
  const set = CARD_SETS[setIndex];

  // Pick 8 pairs by striding through the set
  const pairs: CardPair[] = [];
  const usedIndices = new Set<number>();
  let pos = (absHash >> 4) % set.length;
  while (pairs.length < 8) {
    const idx = pos % set.length;
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      pairs.push(set[idx]);
    }
    pos++;
  }

  // Create card objects
  const cards: MemoryCard[] = [];
  pairs.forEach((pair, i) => {
    cards.push({ id: i * 2, pairKey: pair.key, label: pair.label, flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, pairKey: pair.key, label: pair.label, flipped: false, matched: false });
  });

  // Deterministic shuffle with seeded LCG
  const result = [...cards];
  let s = absHash;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Format score with commas */
export function formatScore(score: number): string {
  return score.toLocaleString();
}
