import { create } from 'zustand';
import {
  DEFAULT_HOME_ROW_KEYS,
  DEFAULT_PLAYER_COLORS,
  Game,
  PenaltyType,
  Player,
  Round,
  Solve,
  TeamId,
  TournamentMode,
  TournamentSet,
  TournamentSettings,
} from '@/types/tournament';
import { calculateGameScores } from '@/utils/scoring';

interface TournamentState {
  players: Player[];
  settings: TournamentSettings;
  sets: TournamentSet[];
  currentSetIndex: number;
  currentGameIndex: number;
  currentRoundIndex: number;
  matchWinnerPlayerId: string | null;
  matchWinnerTeamId: TeamId | null;
  isAdminOpen: boolean;

  // Computed state caches
  totalPoints: Record<string, number>; // playerId -> total cumulative points in match
  lastRoundScores: Record<string, number>; // playerId -> score added in latest round
  currentGamePoints: Record<string, number>; // playerId -> points accumulated in current Game
  setWins: Record<string, number>; // playerId -> number of sets won
  gameWins: Record<string, number>; // playerId -> number of games won in current set
  currentGameSolves: Record<string, Solve>; // latest round solves

  // Team caches
  teamTotalPoints: Record<TeamId, number>;
  teamGamePoints: Record<TeamId, number>;
  teamSetWins: Record<TeamId, number>;
  teamGameWins: Record<TeamId, number>;

  // Actions
  toggleAdmin: (open?: boolean) => void;
  updateSettings: (partial: Partial<TournamentSettings>) => void;
  setTournamentMode: (mode: TournamentMode) => void;
  setPlayerTeam: (playerId: string, team: TeamId) => void;
  addPlayer: (name: string, team?: TeamId) => void;
  removePlayer: (playerId: string) => void;
  togglePlayerActive: (playerId: string) => void;
  reorderPlayers: (startIndex: number, endIndex: number) => void;
  updatePlayerName: (playerId: string, name: string) => void;
  
  // Game & solve flow
  recordCompletedGame: (
    solvesData: Record<string, { rawTimeMs: number; falseStartDeltaMs?: number; penalty?: PenaltyType }>
  ) => { gameWinnerId?: string; setWinnerId?: string; matchWinnerId?: string; gameWinnerTeam?: TeamId; setWinnerTeam?: TeamId; matchWinnerTeam?: TeamId; isGameWon: boolean };
  
  // Solve Grid Penalty modifications
  applyPenalty: (gameId: string, playerId: string, penalty: PenaltyType, roundId?: string) => void;
  
  // Navigation & resets
  startNextGame: () => void;
  resetCurrentGame: () => void;
  resetTournament: () => void;
  recalculateAllScores: () => void;
}

const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', name: 'ALEX', key: 'a', color: 'text-red-400', accentColor: '#ef4444', active: true, team: 'RED' },
  { id: 'p2', name: 'MAYA', key: 's', color: 'text-rose-400', accentColor: '#f43f5e', active: true, team: 'RED' },
  { id: 'p3', name: 'LEO', key: 'd', color: 'text-cyan-400', accentColor: '#06b6d4', active: true, team: 'BLUE' },
  { id: 'p4', name: 'ZANE', key: 'f', color: 'text-blue-400', accentColor: '#3b82f6', active: true, team: 'BLUE' },
];

const DEFAULT_SETTINGS: TournamentSettings = {
  tournamentMode: 'FREE_FOR_ALL',
  scoringMode: 'RANK_BASED',
  targetSets: 2,
  targetGames: 3,
  rankPointsFloor: 20, // 5 - 100 points
  differentialGapThreshold: 500, // 100 - 10000 points
  firstPlaceBonus: 2,
  differentialDNFScore: 5000,
  falseStartMultiplier: 5,
  lockInDurationMs: 1000,
  countdownStageIntervalMs: 500,
  pointsCarryOver: false,
  soundEnabled: true,
  soundVolume: 0.7,
};

function createInitialSet(setIndex: number = 0): TournamentSet {
  return {
    id: `set-${setIndex + 1}`,
    setIndex,
    games: [
      {
        id: `game-${setIndex + 1}-1`,
        setIndex,
        gameIndex: 0,
        rounds: [
          {
            id: `round-${setIndex + 1}-1-1`,
            roundIndex: 0,
            solves: {},
            completed: false,
            completedAt: null,
          },
        ],
        solves: {},
        gamePoints: {},
        teamGamePoints: { RED: 0, BLUE: 0 },
        completed: false,
        completedAt: null,
      },
    ],
    completed: false,
  };
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  players: DEFAULT_PLAYERS,
  settings: DEFAULT_SETTINGS,
  sets: [createInitialSet(0)],
  currentSetIndex: 0,
  currentGameIndex: 0,
  currentRoundIndex: 0,
  matchWinnerPlayerId: null,
  matchWinnerTeamId: null,
  isAdminOpen: false,

  totalPoints: { p1: 0, p2: 0, p3: 0, p4: 0 },
  lastRoundScores: {},
  currentGamePoints: { p1: 0, p2: 0, p3: 0, p4: 0 },
  setWins: { p1: 0, p2: 0, p3: 0, p4: 0 },
  gameWins: { p1: 0, p2: 0, p3: 0, p4: 0 },
  currentGameSolves: {},

  teamTotalPoints: { RED: 0, BLUE: 0 },
  teamGamePoints: { RED: 0, BLUE: 0 },
  teamSetWins: { RED: 0, BLUE: 0 },
  teamGameWins: { RED: 0, BLUE: 0 },

  toggleAdmin: (open) => {
    set((state) => ({ isAdminOpen: open !== undefined ? open : !state.isAdminOpen }));
  },

  updateSettings: (partial) => {
    set((state) => {
      const nextSettings = { ...state.settings, ...partial };
      return { settings: nextSettings };
    });
    get().recalculateAllScores();
  },

  setTournamentMode: (mode) => {
    set((state) => ({
      settings: { ...state.settings, tournamentMode: mode },
    }));
    get().recalculateAllScores();
  },

  setPlayerTeam: (playerId, team) => {
    const { players } = get();
    const updated = players.map((p) => {
      if (p.id !== playerId) return p;
      const isRed = team === 'RED';
      return {
        ...p,
        team,
        color: isRed ? 'text-red-400' : 'text-cyan-400',
        accentColor: isRed ? '#ef4444' : '#06b6d4',
      };
    });
    set({ players: updated });
    get().recalculateAllScores();
  },

  addPlayer: (name, team) => {
    const { players, settings } = get();
    if (players.length >= 10) return;

    const nextIndex = players.length;
    const defaultTeam: TeamId = team || (nextIndex % 2 === 0 ? 'RED' : 'BLUE');
    const colorTheme = DEFAULT_PLAYER_COLORS[nextIndex % DEFAULT_PLAYER_COLORS.length];
    const key = DEFAULT_HOME_ROW_KEYS[nextIndex] || String.fromCharCode(97 + nextIndex);

    const isTeamMode = settings.tournamentMode === 'TEAMS';
    const playerColor = isTeamMode ? (defaultTeam === 'RED' ? 'text-red-400' : 'text-cyan-400') : colorTheme.color;
    const playerAccent = isTeamMode ? (defaultTeam === 'RED' ? '#ef4444' : '#06b6d4') : colorTheme.accentColor;

    const newPlayer: Player = {
      id: `p-${Date.now()}-${nextIndex + 1}`,
      name: name.trim().toUpperCase().slice(0, 10) || `P${nextIndex + 1}`,
      key,
      color: playerColor,
      accentColor: playerAccent,
      active: true,
      team: defaultTeam,
    };

    const updated = [...players, newPlayer];
    set({ players: updated });
    get().recalculateAllScores();
  },

  removePlayer: (playerId) => {
    const { players } = get();
    if (players.length <= 2) return;

    const filtered = players.filter((p) => p.id !== playerId);
    const reassigned = filtered.map((p, idx) => ({
      ...p,
      key: DEFAULT_HOME_ROW_KEYS[idx] || p.key,
    }));

    set({ players: reassigned });
    get().recalculateAllScores();
  },

  togglePlayerActive: (playerId) => {
    const { players } = get();
    const updated = players.map((p) => (p.id === playerId ? { ...p, active: !p.active } : p));
    set({ players: updated });
    get().recalculateAllScores();
  },

  reorderPlayers: (startIndex, endIndex) => {
    const { players } = get();
    const result = Array.from(players);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reassigned = result.map((p, idx) => ({
      ...p,
      key: DEFAULT_HOME_ROW_KEYS[idx] || p.key,
    }));

    set({ players: reassigned });
  },

  updatePlayerName: (playerId, name) => {
    const { players } = get();
    const updated = players.map((p) =>
      p.id === playerId ? { ...p, name: name.trim().toUpperCase().slice(0, 10) } : p
    );
    set({ players: updated });
  },

  recordCompletedGame: (solvesData) => {
    const {
      sets,
      currentSetIndex,
      currentGameIndex,
      currentRoundIndex,
      players,
      settings,
      setWins,
      gameWins,
      currentGamePoints,
      totalPoints,
      teamGamePoints,
      teamTotalPoints,
      teamGameWins,
      teamSetWins,
    } = get();

    const currentSet = sets[currentSetIndex];
    const currentGame = currentSet.games[currentGameIndex];

    // Compute round scores
    const calculated = calculateGameScores(solvesData, players, settings);

    const roundSolves: Record<string, Solve> = {};
    const updatedGamePoints = { ...currentGamePoints };
    const updatedTotalPoints = { ...totalPoints };
    const roundScores: Record<string, number> = {};

    const updatedTeamGamePts: Record<TeamId, number> = { ...teamGamePoints };
    const updatedTeamTotalPts: Record<TeamId, number> = { ...teamTotalPoints };

    Object.entries(calculated).forEach(([pid, res]) => {
      roundSolves[pid] = {
        id: `solve-${currentGame.id}-r${currentRoundIndex + 1}-${pid}`,
        playerId: pid,
        gameId: currentGame.id,
        roundIndex: currentRoundIndex,
        rawTimeMs: res.rawTimeMs,
        penalty: res.penalty,
        falseStartDeltaMs: res.falseStartDeltaMs,
        finalTimeMs: res.finalTimeMs,
        score: res.score,
        rank: res.rank,
        isDNF: res.isDNF,
        completedAt: Date.now(),
      };

      roundScores[pid] = res.score;
      updatedGamePoints[pid] = (updatedGamePoints[pid] || 0) + res.score;
      updatedTotalPoints[pid] = (updatedTotalPoints[pid] || 0) + res.score;

      // Add to team score if team mode
      const playerObj = players.find((p) => p.id === pid);
      if (playerObj?.team) {
        updatedTeamGamePts[playerObj.team] = (updatedTeamGamePts[playerObj.team] || 0) + res.score;
        updatedTeamTotalPts[playerObj.team] = (updatedTeamTotalPts[playerObj.team] || 0) + res.score;
      }
    });

    const activePlayers = players.filter((p) => p.active);

    // Check Multi-Round Game Win Conditions:
    let isGameWon = false;
    let gameWinnerId: string | undefined = undefined;
    let gameWinnerTeam: TeamId | undefined = undefined;

    if (settings.tournamentMode === 'TEAMS') {
      // TEAM MODE WIN EVALUATION:
      if (settings.scoringMode === 'RANK_BASED') {
        const redPts = updatedTeamGamePts.RED || 0;
        const bluePts = updatedTeamGamePts.BLUE || 0;
        const floor = settings.rankPointsFloor;

        if (redPts >= floor || bluePts >= floor) {
          if (redPts > bluePts) {
            isGameWon = true;
            gameWinnerTeam = 'RED';
          } else if (bluePts > redPts) {
            isGameWon = true;
            gameWinnerTeam = 'BLUE';
          }
          // Tie at or above floor -> triggers another round!
        }
      } else {
        // Differential in Teams: leading team (lower total score) needs gap
        const redPts = updatedTeamGamePts.RED || 0;
        const bluePts = updatedTeamGamePts.BLUE || 0;
        const gap = Math.abs(redPts - bluePts);

        if (gap >= settings.differentialGapThreshold) {
          isGameWon = true;
          gameWinnerTeam = redPts < bluePts ? 'RED' : 'BLUE';
        }
      }
    } else {
      // FREE FOR ALL MODE WIN EVALUATION:
      if (settings.scoringMode === 'RANK_BASED') {
        const qualifiers = activePlayers
          .map((p) => ({ id: p.id, points: updatedGamePoints[p.id] || 0 }))
          .filter((q) => q.points >= settings.rankPointsFloor)
          .sort((a, b) => b.points - a.points);

        if (qualifiers.length > 0) {
          if (qualifiers.length === 1 || qualifiers[0].points > qualifiers[1].points) {
            isGameWon = true;
            gameWinnerId = qualifiers[0].id;
          }
        }
      } else {
        const standings = activePlayers
          .map((p) => ({ id: p.id, points: updatedGamePoints[p.id] || 0 }))
          .sort((a, b) => a.points - b.points);

        if (standings.length >= 2) {
          const gap = standings[1].points - standings[0].points;
          if (gap >= settings.differentialGapThreshold) {
            isGameWon = true;
            gameWinnerId = standings[0].id;
          }
        } else if (standings.length === 1) {
          isGameWon = true;
          gameWinnerId = standings[0].id;
        }
      }
    }

    const currentRound: Round = {
      id: `round-${currentGame.id}-${currentRoundIndex + 1}`,
      roundIndex: currentRoundIndex,
      solves: roundSolves,
      completed: true,
      completedAt: Date.now(),
    };

    const updatedRounds = [...currentGame.rounds];
    updatedRounds[currentRoundIndex] = currentRound;

    const updatedGame: Game = {
      ...currentGame,
      rounds: updatedRounds,
      solves: roundSolves,
      gamePoints: updatedGamePoints,
      teamGamePoints: updatedTeamGamePts,
      completed: isGameWon,
      completedAt: isGameWon ? Date.now() : null,
      winnerPlayerId: gameWinnerId,
      winnerTeamId: gameWinnerTeam,
    };

    const updatedGames = [...currentSet.games];
    updatedGames[currentGameIndex] = updatedGame;

    // Track game and set wins
    const nextGameWins = { ...gameWins };
    const nextTeamGameWins = { ...teamGameWins };
    let setWinnerId: string | undefined = undefined;
    let matchWinnerId: string | undefined = undefined;
    let setWinnerTeam: TeamId | undefined = undefined;
    let matchWinnerTeam: TeamId | undefined = undefined;

    if (isGameWon) {
      if (settings.tournamentMode === 'TEAMS' && gameWinnerTeam) {
        nextTeamGameWins[gameWinnerTeam] = (nextTeamGameWins[gameWinnerTeam] || 0) + 1;
        if (nextTeamGameWins[gameWinnerTeam] >= settings.targetGames) {
          setWinnerTeam = gameWinnerTeam;
        }
      } else if (gameWinnerId) {
        nextGameWins[gameWinnerId] = (nextGameWins[gameWinnerId] || 0) + 1;
        if (nextGameWins[gameWinnerId] >= settings.targetGames) {
          setWinnerId = gameWinnerId;
        }
      }
    }

    const nextSetWins = { ...setWins };
    const nextTeamSetWins = { ...teamSetWins };

    if (settings.tournamentMode === 'TEAMS' && setWinnerTeam) {
      nextTeamSetWins[setWinnerTeam] = (nextTeamSetWins[setWinnerTeam] || 0) + 1;
      if (nextTeamSetWins[setWinnerTeam] >= settings.targetSets) {
        matchWinnerTeam = setWinnerTeam;
      }
    } else if (setWinnerId) {
      nextSetWins[setWinnerId] = (nextSetWins[setWinnerId] || 0) + 1;
      if (nextSetWins[setWinnerId] >= settings.targetSets) {
        matchWinnerId = setWinnerId;
      }
    }

    const updatedSet: TournamentSet = {
      ...currentSet,
      games: updatedGames,
      completed: !!setWinnerId || !!setWinnerTeam,
      winnerPlayerId: setWinnerId,
      winnerTeamId: setWinnerTeam,
    };

    const updatedSets = [...sets];
    updatedSets[currentSetIndex] = updatedSet;

    set({
      sets: updatedSets,
      currentGameSolves: roundSolves,
      currentGamePoints: updatedGamePoints,
      lastRoundScores: roundScores,
      totalPoints: updatedTotalPoints,
      gameWins: nextGameWins,
      setWins: nextSetWins,
      teamGamePoints: updatedTeamGamePts,
      teamTotalPoints: updatedTeamTotalPts,
      teamGameWins: nextTeamGameWins,
      teamSetWins: nextTeamSetWins,
      matchWinnerPlayerId: matchWinnerId || null,
      matchWinnerTeamId: matchWinnerTeam || null,
    });

    return { gameWinnerId, setWinnerId, matchWinnerId, gameWinnerTeam, setWinnerTeam, matchWinnerTeam, isGameWon };
  },

  applyPenalty: (gameId, playerId, penalty, roundId) => {
    const { sets, players, settings } = get();
    const updatedSets = sets.map((s) => ({
      ...s,
      games: s.games.map((g) => {
        if (g.id !== gameId) return g;

        // Update rounds
        const updatedRounds = g.rounds.map((r) => {
          if (roundId && r.id !== roundId) return r;
          const currentSolve = r.solves[playerId];
          if (!currentSolve && roundId) return r;

          const updatedSolve = currentSolve ? { ...currentSolve, penalty } : undefined;
          const nextSolves = updatedSolve ? { ...r.solves, [playerId]: updatedSolve } : r.solves;
          const recomputed = calculateGameScores(nextSolves, players, settings);

          const finalSolves: Record<string, Solve> = {};
          Object.entries(recomputed).forEach(([pid, res]) => {
            finalSolves[pid] = {
              ...nextSolves[pid],
              penalty: res.penalty,
              finalTimeMs: res.finalTimeMs,
              score: res.score,
              rank: res.rank,
              isDNF: res.isDNF,
            };
          });

          return { ...r, solves: finalSolves };
        });

        // Also update g.solves if present
        const currentLatestSolve = g.solves[playerId];
        let nextGameSolves = g.solves;
        if (currentLatestSolve) {
          nextGameSolves = {
            ...g.solves,
            [playerId]: { ...currentLatestSolve, penalty },
          };
          const recomputed = calculateGameScores(nextGameSolves, players, settings);
          const finalSolves: Record<string, Solve> = {};
          Object.entries(recomputed).forEach(([pid, res]) => {
            finalSolves[pid] = {
              ...nextGameSolves[pid],
              penalty: res.penalty,
              finalTimeMs: res.finalTimeMs,
              score: res.score,
              rank: res.rank,
              isDNF: res.isDNF,
            };
          });
          nextGameSolves = finalSolves;
        }

        return {
          ...g,
          rounds: updatedRounds,
          solves: nextGameSolves,
        };
      }),
    }));

    set({ sets: updatedSets });
    get().recalculateAllScores();
  },

  startNextGame: () => {
    const {
      sets,
      currentSetIndex,
      currentGameIndex,
      currentRoundIndex,
      matchWinnerPlayerId,
      matchWinnerTeamId,
      players,
    } = get();

    if (matchWinnerPlayerId || matchWinnerTeamId) return;

    const currentSet = sets[currentSetIndex];
    const currentGame = currentSet.games[currentGameIndex];

    if (currentSet.completed) {
      // Start Next Set
      const nextSetIndex = currentSetIndex + 1;
      const newSet = createInitialSet(nextSetIndex);
      const freshGameWins: Record<string, number> = {};
      const freshGamePts: Record<string, number> = {};
      players.forEach((p) => {
        freshGameWins[p.id] = 0;
        freshGamePts[p.id] = 0;
      });

      set({
        sets: [...sets, newSet],
        currentSetIndex: nextSetIndex,
        currentGameIndex: 0,
        currentRoundIndex: 0,
        currentGameSolves: {},
        gameWins: freshGameWins,
        currentGamePoints: freshGamePts,
        teamGamePoints: { RED: 0, BLUE: 0 },
        teamGameWins: { RED: 0, BLUE: 0 },
      });
    } else if (currentGame.completed) {
      // Start Next Game in current Set
      const nextGameIndex = currentGameIndex + 1;
      const nextGame: Game = {
        id: `game-${currentSetIndex + 1}-${nextGameIndex + 1}`,
        setIndex: currentSetIndex,
        gameIndex: nextGameIndex,
        rounds: [
          {
            id: `round-${currentSetIndex + 1}-${nextGameIndex + 1}-1`,
            roundIndex: 0,
            solves: {},
            completed: false,
            completedAt: null,
          },
        ],
        solves: {},
        gamePoints: {},
        teamGamePoints: { RED: 0, BLUE: 0 },
        completed: false,
        completedAt: null,
      };

      const freshGamePts: Record<string, number> = {};
      players.forEach((p) => {
        freshGamePts[p.id] = 0;
      });

      const updatedSet = {
        ...currentSet,
        games: [...currentSet.games, nextGame],
      };

      const updatedSets = [...sets];
      updatedSets[currentSetIndex] = updatedSet;

      set({
        sets: updatedSets,
        currentGameIndex: nextGameIndex,
        currentRoundIndex: 0,
        currentGameSolves: {},
        currentGamePoints: freshGamePts,
        teamGamePoints: { RED: 0, BLUE: 0 },
      });
    } else {
      // Game not completed yet -> Start Next Round in current Game!
      const nextRoundIndex = currentRoundIndex + 1;
      const nextRound: Round = {
        id: `round-${currentGame.id}-${nextRoundIndex + 1}`,
        roundIndex: nextRoundIndex,
        solves: {},
        completed: false,
        completedAt: null,
      };

      const updatedGame: Game = {
        ...currentGame,
        rounds: [...currentGame.rounds, nextRound],
      };

      const updatedGames = [...currentSet.games];
      updatedGames[currentGameIndex] = updatedGame;

      const updatedSet = { ...currentSet, games: updatedGames };
      const updatedSets = [...sets];
      updatedSets[currentSetIndex] = updatedSet;

      set({
        sets: updatedSets,
        currentRoundIndex: nextRoundIndex,
        currentGameSolves: {},
      });
    }
  },

  resetCurrentGame: () => {
    const { sets, currentSetIndex, currentGameIndex, players } = get();
    const currentSet = sets[currentSetIndex];
    const currentGame = currentSet.games[currentGameIndex];

    const resetGame: Game = {
      ...currentGame,
      rounds: [
        {
          id: `round-${currentSetIndex + 1}-${currentGameIndex + 1}-1`,
          roundIndex: 0,
          solves: {},
          completed: false,
          completedAt: null,
        },
      ],
      solves: {},
      gamePoints: {},
      teamGamePoints: { RED: 0, BLUE: 0 },
      completed: false,
      completedAt: null,
      winnerPlayerId: undefined,
      winnerTeamId: undefined,
    };

    const updatedGames = [...currentSet.games];
    updatedGames[currentGameIndex] = resetGame;

    const updatedSets = [...sets];
    updatedSets[currentSetIndex] = { ...currentSet, games: updatedGames };

    const freshGamePts: Record<string, number> = {};
    players.forEach((p) => {
      freshGamePts[p.id] = 0;
    });

    set({
      sets: updatedSets,
      currentRoundIndex: 0,
      currentGameSolves: {},
      lastRoundScores: {},
      currentGamePoints: freshGamePts,
      teamGamePoints: { RED: 0, BLUE: 0 },
    });

    get().recalculateAllScores();
  },

  resetTournament: () => {
    const { players } = get();
    const initialTotals: Record<string, number> = {};
    players.forEach((p) => {
      initialTotals[p.id] = 0;
    });

    set({
      sets: [createInitialSet(0)],
      currentSetIndex: 0,
      currentGameIndex: 0,
      currentRoundIndex: 0,
      matchWinnerPlayerId: null,
      matchWinnerTeamId: null,
      totalPoints: initialTotals,
      lastRoundScores: {},
      currentGamePoints: initialTotals,
      setWins: initialTotals,
      gameWins: initialTotals,
      teamTotalPoints: { RED: 0, BLUE: 0 },
      teamGamePoints: { RED: 0, BLUE: 0 },
      teamSetWins: { RED: 0, BLUE: 0 },
      teamGameWins: { RED: 0, BLUE: 0 },
      currentGameSolves: {},
    });
  },

  recalculateAllScores: () => {
    const { sets, players } = get();
    const totalPts: Record<string, number> = {};
    const setW: Record<string, number> = {};
    const gameW: Record<string, number> = {};

    const teamTotPts: Record<TeamId, number> = { RED: 0, BLUE: 0 };
    const teamSetW: Record<TeamId, number> = { RED: 0, BLUE: 0 };
    const teamGameW: Record<TeamId, number> = { RED: 0, BLUE: 0 };

    players.forEach((p) => {
      totalPts[p.id] = 0;
      setW[p.id] = 0;
      gameW[p.id] = 0;
    });

    sets.forEach((s) => {
      s.games.forEach((g) => {
        if (g.completed) {
          if (g.winnerPlayerId) {
            gameW[g.winnerPlayerId] = (gameW[g.winnerPlayerId] || 0) + 1;
          }
          if (g.winnerTeamId) {
            teamGameW[g.winnerTeamId] = (teamGameW[g.winnerTeamId] || 0) + 1;
          }
        }

        g.rounds.forEach((r) => {
          if (r.completed) {
            Object.values(r.solves).forEach((sol) => {
              totalPts[sol.playerId] = (totalPts[sol.playerId] || 0) + sol.score;
              const p = players.find((x) => x.id === sol.playerId);
              if (p?.team) {
                teamTotPts[p.team] = (teamTotPts[p.team] || 0) + sol.score;
              }
            });
          }
        });
      });

      if (s.winnerPlayerId) {
        setW[s.winnerPlayerId] = (setW[s.winnerPlayerId] || 0) + 1;
      }
      if (s.winnerTeamId) {
        teamSetW[s.winnerTeamId] = (teamSetW[s.winnerTeamId] || 0) + 1;
      }
    });

    set({
      totalPoints: totalPts,
      setWins: setW,
      gameWins: gameW,
      teamTotalPoints: teamTotPts,
      teamSetWins: teamSetW,
      teamGameWins: teamGameW,
    });
  },
}));
