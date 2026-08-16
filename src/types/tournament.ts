export type TournamentMode = 'FREE_FOR_ALL' | 'TEAMS';
export type ScoringMode = 'RANK_BASED' | 'DIFFERENTIAL';
export type PenaltyType = 'NONE' | 'PLUS_2' | 'DNF';
export type TeamId = 'RED' | 'BLUE';
export type MatchStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED';
export type RaceState = 'IDLE' | 'WAITING_FOR_ALL' | 'LOCKED_IN' | 'DRAG_COUNTDOWN' | 'RACING' | 'FINISHED';

export type PlayerRole = 'HOST' | 'BOT' | 'PLAYER';
export type BotMaturity = 'NOVICE' | 'INTERMEDIATE' | 'PRO' | 'WORLD_CLASS';

export interface BotConfig {
  averageTimeMs: number; // in milliseconds (e.g. 5000 = 5.00s)
  stdDevMs: number;      // in milliseconds (e.g. 600 = 0.60s)
  maturity: BotMaturity; // controls early start, +2, and DNF probabilities
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  key: string;           // ' ' (Spacebar) for Host, or identifier
  color: string;
  accentColor: string;
  active: boolean;
  team?: TeamId;
  botConfig?: BotConfig;
}

export interface Solve {
  id: string;
  playerId: string;
  gameId: string;
  roundIndex: number;
  rawTimeMs: number;
  penalty: PenaltyType;
  falseStartDeltaMs: number;
  finalTimeMs: number;
  score: number;
  rank?: number;
  isDNF: boolean;
  completedAt: number;
}

export interface Round {
  id: string;
  roundIndex: number;
  scramble?: string;
  solves: Record<string, Solve>;
  completed: boolean;
  completedAt: number | null;
}

export interface Game {
  id: string;
  gameIndex: number;
  rounds: Round[];
  solves: Record<string, Solve>;
  scores: Record<string, number>;
  winnerId: string | null;
  winnerTeam?: TeamId | null;
  completed: boolean;
  completedAt: number | null;
}

export interface SetMatch {
  id: string;
  setIndex: number;
  games: Game[];
  winnerId: string | null;
  winnerTeam?: TeamId | null;
  completed: boolean;
  completedAt: number | null;
}

export interface TournamentSettings {
  tournamentMode: TournamentMode;
  scoringMode: ScoringMode;
  targetSets: number;
  targetGames: number;
  rankPointsFloor: number;
  firstPlaceBonus: number;
  differentialGapThreshold: number;
  falseStartMultiplier: number;
  soundEnabled: boolean;
  soundVolume?: number;
  scrambleEvent: string;
  lockInDurationMs?: number;
  differentialDNFScore?: number;
}

export interface ActivityFeedItem {
  id: string;
  type:
    | 'SOLVE_FINISHED'
    | 'FALSE_START'
    | 'PENALTY_APPLIED'
    | 'GAME_WON'
    | 'SET_WON'
    | 'MATCH_WON'
    | 'RECORD_BROKEN';
  playerId?: string;
  playerName?: string;
  playerColor?: string;
  team?: TeamId;
  timeMs?: number;
  penalty?: PenaltyType;
  rank?: number;
  gameId?: string;
  roundIndex?: number;
  recordType?: 'MATCH_RECORD' | 'SET_RECORD';
  message: string;
  timestamp: number;
}

export const DEFAULT_HOME_ROW_KEYS: string[] = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];

export const DEFAULT_PLAYER_COLORS: { color: string; accentColor: string }[] = [
  { color: 'text-amber-500 dark:text-amber-400', accentColor: '#f59e0b' },
  { color: 'text-cyan-500 dark:text-cyan-400', accentColor: '#06b6d4' },
  { color: 'text-emerald-500 dark:text-emerald-400', accentColor: '#10b981' },
  { color: 'text-violet-500 dark:text-violet-400', accentColor: '#8b5cf6' },
  { color: 'text-rose-500 dark:text-rose-400', accentColor: '#f43f5e' },
  { color: 'text-blue-500 dark:text-blue-400', accentColor: '#3b82f6' },
  { color: 'text-orange-500 dark:text-orange-400', accentColor: '#f97316' },
  { color: 'text-teal-500 dark:text-teal-400', accentColor: '#14b8a6' },
];
