export type ScoringMode = 'RANK_BASED' | 'DIFFERENTIAL';
export type TournamentMode = 'FREE_FOR_ALL' | 'TEAMS';
export type TeamId = 'RED' | 'BLUE';

export type RaceState =
  | 'IDLE'
  | 'WAITING_FOR_ALL'
  | 'LOCKED_IN'
  | 'DRAG_COUNTDOWN'
  | 'RACING'
  | 'FINISHED';

export type PenaltyType = 'NONE' | 'PLUS_2' | 'DNF';

export interface Player {
  id: string;
  name: string;
  key: string; // e.g. 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'
  color: string; // Tailwind color token or hex
  accentColor: string;
  active: boolean;
  team?: TeamId;
}

export interface Solve {
  id: string;
  playerId: string;
  gameId: string;
  roundIndex: number;
  rawTimeMs: number;
  penalty: PenaltyType;
  falseStartDeltaMs: number; // >0 if released before green
  finalTimeMs: number;
  score: number;
  rank: number;
  isDNF: boolean;
  completedAt: number;
}

export interface Round {
  id: string;
  roundIndex: number;
  solves: Record<string, Solve>;
  completed: boolean;
  completedAt: number | null;
}

export interface Game {
  id: string;
  setIndex: number;
  gameIndex: number;
  rounds: Round[];
  solves: Record<string, Solve>; // Latest round solves
  gamePoints: Record<string, number>; // playerId -> accumulated points in this game
  teamGamePoints?: Record<TeamId, number>; // Team points in this game
  completed: boolean;
  completedAt: number | null;
  winnerPlayerId?: string;
  winnerTeamId?: TeamId;
}

export interface TournamentSet {
  id: string;
  setIndex: number;
  games: Game[];
  completed: boolean;
  winnerPlayerId?: string;
  winnerTeamId?: TeamId;
}

export interface TournamentSettings {
  tournamentMode: TournamentMode;
  scoringMode: ScoringMode;
  targetSets: number; // Sets needed to win match (e.g. 2)
  targetGames: number; // Games needed to win a set (e.g. 3)
  rankPointsFloor: number; // Point floor to win a game in Rank-Based (e.g. 20, 5-100)
  differentialGapThreshold: number; // Point gap between 1st and 2nd to win a game in Differential (e.g. 500, 100-10000)
  firstPlaceBonus: number; // Extra points for 1st in rank-based (default 2)
  differentialDNFScore: number; // Max point penalty for DNF in differential (default 5000)
  falseStartMultiplier: number; // Penalty multiplier for false starts (default 5)
  lockInDurationMs: number; // Hold duration before countdown (default 1000ms)
  countdownStageIntervalMs: number; // Time per yellow countdown light (default 500ms)
  pointsCarryOver: boolean; // Whether points carry over within set or reset every game
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
}

export const DEFAULT_HOME_ROW_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];

export const DEFAULT_PLAYER_COLORS = [
  { color: 'text-amber-400', accentColor: '#f59e0b', bgGradient: 'from-amber-500/20 to-amber-950/40', border: 'border-amber-500/50' },
  { color: 'text-cyan-400', accentColor: '#06b6d4', bgGradient: 'from-cyan-500/20 to-cyan-950/40', border: 'border-cyan-500/50' },
  { color: 'text-emerald-400', accentColor: '#10b981', bgGradient: 'from-emerald-500/20 to-emerald-950/40', border: 'border-emerald-500/50' },
  { color: 'text-violet-400', accentColor: '#8b5cf6', bgGradient: 'from-violet-500/20 to-violet-950/40', border: 'border-violet-500/50' },
  { color: 'text-rose-400', accentColor: '#f43f5e', bgGradient: 'from-rose-500/20 to-rose-950/40', border: 'border-rose-500/50' },
  { color: 'text-blue-400', accentColor: '#3b82f6', bgGradient: 'from-blue-500/20 to-blue-950/40', border: 'border-blue-500/50' },
  { color: 'text-orange-400', accentColor: '#f97316', bgGradient: 'from-orange-500/20 to-orange-950/40', border: 'border-orange-500/50' },
  { color: 'text-teal-400', accentColor: '#14b8a6', bgGradient: 'from-teal-500/20 to-teal-950/40', border: 'border-teal-500/50' },
  { color: 'text-fuchsia-400', accentColor: '#d946ef', bgGradient: 'from-fuchsia-500/20 to-fuchsia-950/40', border: 'border-fuchsia-500/50' },
  { color: 'text-lime-400', accentColor: '#84cc16', bgGradient: 'from-lime-500/20 to-lime-950/40', border: 'border-lime-500/50' },
];
