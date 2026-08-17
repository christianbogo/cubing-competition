import React, { useMemo, useState } from 'react';
import { PenaltyType, Player, Solve } from '@/types/tournament';
import { PlayerCard } from './PlayerCard';
import { TeamCard } from './TeamCard';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { X } from 'lucide-react';

interface LeaderboardViewProps {
  onOpenAdmin?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = () => {
  const {
    players,
    localPlayerId,
    sets,
    currentSetIndex,
    currentGameIndex,
    currentRoundIndex,
    currentGamePoints,
    teamGamePoints,
    gameWins,
    teamGameWins,
    setWins,
    teamSetWins,
    teamTotalPoints,
    lastRoundScores,
    currentGameSolves,
    settings,
    applyPenalty,
  } = useTournamentStore();

  const raceState = useTimerStore((s) => s.raceState);
  const raceStartTime = useTimerStore((s) => s.raceStartTime);
  const timerPlayers = useTimerStore((s) => s.players);

  const [penaltyModalPlayer, setPenaltyModalPlayer] = useState<{
    playerId: string;
    playerName: string;
    currentPenalty: PenaltyType;
  } | null>(null);

  const [liveTimeMs, setLiveTimeMs] = useState(0);

  React.useEffect(() => {
    let frameId: number;
    const updateTime = () => {
      if (raceState === 'RACING' && raceStartTime) {
        setLiveTimeMs(Math.max(0, Date.now() - raceStartTime));
        frameId = requestAnimationFrame(updateTime);
      } else {
        setLiveTimeMs(0);
      }
    };
    if (raceState === 'RACING') {
      frameId = requestAnimationFrame(updateTime);
    }
    return () => cancelAnimationFrame(frameId);
  }, [raceState, raceStartTime]);

  const isTeamMode = settings.tournamentMode === 'TEAMS';
  const activePlayers = useMemo(() => players.filter((p) => p.active), [players]);
  const totalActive = activePlayers.length;

  const pointsFloor = settings.scoringMode === 'RANK_BASED' ? (settings.rankPointsFloor || 15) : undefined;

  // Calculate live cumulative average and std dev for each player across all completed rounds
  const playerSolveStats = useMemo(() => {
    const stats: Record<string, { averageTimeMs: number; stdDevMs: number; count: number }> = {};

    players.forEach((p) => {
      const timesMs: number[] = [];
      sets?.forEach((s) => {
        s.games?.forEach((g) => {
          g.rounds?.forEach((r) => {
            const solve = r.solves?.[p.id];
            if (solve && !solve.isDNF && solve.finalTimeMs > 0 && r.completed) {
              timesMs.push(solve.finalTimeMs);
            }
          });
        });
      });

      if (timesMs.length > 0) {
        const sum = timesMs.reduce((acc, t) => acc + t, 0);
        const mean = sum / timesMs.length;
        const variance =
          timesMs.length > 1
            ? timesMs.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / timesMs.length
            : 0;
        const stdDev = Math.sqrt(variance);
        stats[p.id] = {
          averageTimeMs: mean,
          stdDevMs: stdDev,
          count: timesMs.length,
        };
      }
    });

    return stats;
  }, [sets, players]);

  // Helper to get consistent player themes based on their color property
  const getPlayerWithTheme = (player: Player, index: number) => {
    return {
      ...player,
      key: player.key || `P${index + 1}`,
    };
  };

  // Real-time ranks and round score calculation during active round
  const liveRanksAndScores = useMemo(() => {
    const finishedList: {
      playerId: string;
      effectiveTimeMs: number;
      isDNF: boolean;
    }[] = [];

    activePlayers.forEach((p) => {
      const tp = timerPlayers[p.id];
      const solve = currentGameSolves[p.id];
      const isFinished = tp?.isFinished || (raceState === 'FINISHED' && solve?.completedAt);

      if (isFinished) {
        const isDNF = solve?.penalty === 'DNF';
        const plus2Ms = solve?.penalty === 'PLUS_2' ? 2000 : 0;
        const effective = isDNF
          ? 999999
          : (solve?.finalTimeMs ??
            (tp?.finishTimeMs || 0) +
              (tp?.falseStartDeltaMs || 0) * settings.falseStartMultiplier +
              plus2Ms);
        finishedList.push({ playerId: p.id, effectiveTimeMs: effective, isDNF });
      }
    });

    // Sort finished solvers by effective final time ascending (fastest first, DNFs last)
    finishedList.sort((a, b) => a.effectiveTimeMs - b.effectiveTimeMs);

    const ranks: Record<string, number> = {};
    const roundScores: Record<string, number> = {};
    const validFinishes = finishedList.filter((x) => !x.isDNF);
    const fastestMs = validFinishes.length > 0 ? validFinishes[0].effectiveTimeMs : 0;

    finishedList.forEach((item, idx) => {
      const rank = idx + 1;
      ranks[item.playerId] = rank;
      if (settings.scoringMode === 'RANK_BASED') {
        roundScores[item.playerId] = item.isDNF
          ? 0
          : Math.max(1, totalActive - (rank - 1)) +
            (rank === 1 ? settings.firstPlaceBonus : 0);
      } else {
        roundScores[item.playerId] = item.isDNF
          ? (settings.differentialDNFScore ?? 300)
          : Math.max(0, Math.round(((item.effectiveTimeMs - fastestMs) / 1000) * 100));
      }
    });
    return { ranks, roundScores };
  }, [activePlayers, timerPlayers, currentGameSolves, raceState, settings, totalActive]);

  const getLivePlayerScoreData = (playerId: string) => {
    const tp = timerPlayers[playerId];
    const solve = currentGameSolves[playerId];
    const storedLastScore = lastRoundScores[playerId];
    const baseGamePoints = currentGamePoints[playerId] || 0;
    if (raceState === 'FINISHED' || solve?.completedAt) {
      const finalScore = liveRanksAndScores.roundScores[playerId] ?? solve?.score ?? storedLastScore;
      return { gamePoints: baseGamePoints, roundAdd: finalScore };
    }
    if (raceState === 'RACING' && tp?.isFinished && tp.finishTimeMs !== null) {
      const instantScore = liveRanksAndScores.roundScores[playerId] || 0;
      return {
        gamePoints: baseGamePoints + instantScore,
        roundAdd: instantScore,
      };
    }
    if (storedLastScore !== undefined && storedLastScore > 0) {
      return { gamePoints: baseGamePoints, roundAdd: storedLastScore };
    }
    return { gamePoints: baseGamePoints, roundAdd: undefined };
  };

  const differentialData = useMemo(() => {
    if (settings.scoringMode !== 'DIFFERENTIAL') {
      return { playerFractions: {}, redTeamFraction: undefined, blueTeamFraction: undefined };
    }
    const threshold = settings.differentialGapThreshold || 500;
    const playerFractions: Record<string, string> = {};
    if (!isTeamMode) {
      const activeIds = activePlayers.map((p) => p.id);
      const pointsArray = activeIds.map((id) => currentGamePoints[id] || 0);
      const minPoints = Math.min(...pointsArray);
      activePlayers.forEach((player) => {
        const pPoints = currentGamePoints[player.id] || 0;
        const otherPoints = activeIds.filter((id) => id !== player.id).map((id) => currentGamePoints[id] || 0);
        const secondLowest = otherPoints.length > 0 ? Math.min(...otherPoints) : pPoints;
        if (pPoints === minPoints && secondLowest > pPoints) {
          const leadGap = secondLowest - pPoints;
          playerFractions[player.id] = `${leadGap}/${threshold}`;
        }
      });
      return { playerFractions, redTeamFraction: undefined, blueTeamFraction: undefined };
    } else {
      const redPts = teamGamePoints.RED || 0;
      const bluePts = teamGamePoints.BLUE || 0;
      let redFraction: string | undefined = undefined;
      let blueFraction: string | undefined = undefined;
      if (redPts < bluePts) {
        const lead = bluePts - redPts;
        redFraction = `${lead}/${threshold}`;
      } else if (bluePts < redPts) {
        const lead = redPts - bluePts;
        blueFraction = `${lead}/${threshold}`;
      }
      return { playerFractions: {} as Record<string, string>, redTeamFraction: redFraction, blueTeamFraction: blueFraction };
    }
  }, [settings.scoringMode, settings.differentialGapThreshold, isTeamMode, activePlayers, currentGamePoints, teamGamePoints]);

  const renderPlayerCard = (player: Player, index: number) => {
    const themedPlayer = getPlayerWithTheme(player, index);
    const tp = timerPlayers[player.id];
    const isSolveFromCurrentRound = currentGameSolves[player.id]?.roundIndex === currentRoundIndex;
    const currentRoundSolve = isSolveFromCurrentRound ? currentGameSolves[player.id] : undefined;

    let lastCompletedSolve: Solve | undefined = undefined;
    for (let sIdx = (sets?.length || 0) - 1; sIdx >= 0; sIdx--) {
      const s = sets[sIdx];
      for (let gIdx = (s.games?.length || 0) - 1; gIdx >= 0; gIdx--) {
        const g = s.games[gIdx];
        for (let rIdx = (g.rounds?.length || 0) - 1; rIdx >= 0; rIdx--) {
          const r = g.rounds[rIdx];
          if (r.completed && r.solves?.[player.id]) {
            lastCompletedSolve = r.solves[player.id];
            break;
          }
        }
        if (lastCompletedSolve) break;
      }
      if (lastCompletedSolve) break;
    }
    const currentSet = sets[currentSetIndex];
    const currentGame = currentSet?.games[currentGameIndex];
    const isGameWinner = !!currentGame?.completed && (isTeamMode ? currentGame.winnerTeam === player.team : currentGame.winnerId === player.id);
    const isSetWinner = !!currentSet?.completed && (isTeamMode ? currentSet.winnerTeam === player.team : currentSet.winnerId === player.id);
    const isCurrentlyRunning = raceState === 'RACING' && tp?.isRunning && !tp?.isFinished;
    const isFinishedThisRound = tp?.isFinished && tp.finishTimeMs !== null;
    const isSolveRecorded = raceState === 'FINISHED' && currentRoundSolve?.completedAt !== undefined;
    const isStandbyWithReference = raceState !== 'RACING' && !tp?.isRunning && !tp?.isFinished && ((tp?.lastFinishTimeMs !== null && tp?.lastFinishTimeMs !== undefined) || lastCompletedSolve !== undefined);
    const isFinishedDisplay = isFinishedThisRound || isSolveRecorded;
    const penalty: PenaltyType = isCurrentlyRunning ? 'NONE' : isFinishedDisplay ? (currentRoundSolve?.penalty || tp?.penalty || 'NONE') : isStandbyWithReference ? (tp?.lastPenalty || lastCompletedSolve?.penalty || 'NONE') : 'NONE';
    const fsDelta = isCurrentlyRunning ? 0 : (tp?.falseStartDeltaMs || (isFinishedDisplay ? currentRoundSolve?.falseStartDeltaMs : (tp?.lastFalseStartDeltaMs ?? lastCompletedSolve?.falseStartDeltaMs)) || 0);
    const fsPenaltyMs = fsDelta * settings.falseStartMultiplier;
    const plus2PenaltyMs = penalty === 'PLUS_2' ? 2000 : 0;
    let displayTimeMs = 0;
    let displayRank: number | undefined = undefined;
    let isDisplayFinished = false;
    if (isCurrentlyRunning) {
      displayTimeMs = liveTimeMs;
      displayRank = undefined;
      isDisplayFinished = false;
    } else if (isFinishedThisRound) {
      displayTimeMs = (tp.finishTimeMs || 0) + fsPenaltyMs + plus2PenaltyMs;
      displayRank = liveRanksAndScores.ranks[player.id] ?? tp?.finishRank ?? currentRoundSolve?.rank;
      isDisplayFinished = true;
    } else if (isSolveRecorded && currentRoundSolve) {
      displayTimeMs = currentRoundSolve.finalTimeMs;
      displayRank = liveRanksAndScores.ranks[player.id] ?? currentRoundSolve.rank ?? tp?.finishRank;
      isDisplayFinished = true;
    } else if (isStandbyWithReference) {
      if (penalty === 'DNF') {
        displayTimeMs = 0;
      } else if (tp?.lastFinishTimeMs !== null && tp?.lastFinishTimeMs !== undefined) {
        displayTimeMs = tp.lastFinishTimeMs + fsPenaltyMs + plus2PenaltyMs;
      } else if (lastCompletedSolve) {
        displayTimeMs = lastCompletedSolve.finalTimeMs;
      } else {
        displayTimeMs = 0;
      }
      displayRank = tp?.lastFinishRank ?? lastCompletedSolve?.rank ?? undefined;
      isDisplayFinished = true;
    }
    const { gamePoints, roundAdd } = getLivePlayerScoreData(player.id);
    const isCardClickable = raceState === 'FINISHED' && isFinishedDisplay;
    return (
      <PlayerCard
        key={player.id}
        player={themedPlayer}
        isLocalPlayer={player.id === localPlayerId}
        rank={displayRank}
        totalActive={totalActive}
        displayTimeMs={displayTimeMs}
        raceStartTime={raceStartTime}
        isHeld={tp?.isHeld || false}
        isLockedIn={tp?.isLockedIn || false}
        isRunning={isCurrentlyRunning}
        isFinished={isDisplayFinished}
        falseStartDeltaMs={fsDelta}
        falseStartMultiplier={settings.falseStartMultiplier}
        penalty={penalty}
        lastRoundScore={roundAdd}
        gamePoints={gamePoints}
        pointsFloor={pointsFloor}
        setWins={setWins[player.id] || 0}
        gameWins={gameWins[player.id] || 0}
        targetSets={settings.targetSets}
        targetGames={settings.targetGames}
        scoringMode={settings.scoringMode}
        isTeamMode={isTeamMode}
        liveStats={playerSolveStats[player.id]}
        isGameWinner={isGameWinner}
        isSetWinner={isSetWinner}
        isClickable={isCardClickable}
        differentialLeadFraction={isTeamMode ? undefined : differentialData.playerFractions[player.id]}
        onClick={() =>
          setPenaltyModalPlayer({
            playerId: player.id,
            playerName: player.name,
            currentPenalty: penalty,
          })
        }
      />
    );
  };

  // Team Split View
  if (isTeamMode) {
    const redPlayers = activePlayers.filter((p) => (p.team || 'RED') === 'RED');
    const bluePlayers = activePlayers.filter((p) => p.team === 'BLUE');

    return (
      <div className="w-full relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* Red Team Column (Left) */}
          <div className="flex flex-col gap-3">
            <TeamCard
              team="RED"
              gamePoints={teamGamePoints.RED || 0}
              totalPoints={teamTotalPoints.RED || 0}
              setWins={teamSetWins.RED || 0}
              gameWins={teamGameWins.RED || 0}
              targetSets={settings.targetSets}
              targetGames={settings.targetGames}
              playerCount={redPlayers.length}
              differentialLeadFraction={differentialData.redTeamFraction}
            />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 auto-rows-fr items-stretch">
              {redPlayers.map((p, idx) => renderPlayerCard(p, idx))}
            </div>
          </div>

          {/* Blue Team Column (Right) */}
          <div className="flex flex-col gap-3">
            <TeamCard
              team="BLUE"
              gamePoints={teamGamePoints.BLUE || 0}
              totalPoints={teamTotalPoints.BLUE || 0}
              setWins={teamSetWins.BLUE || 0}
              gameWins={teamGameWins.BLUE || 0}
              targetSets={settings.targetSets}
              targetGames={settings.targetGames}
              playerCount={bluePlayers.length}
              differentialLeadFraction={differentialData.blueTeamFraction}
            />
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 auto-rows-fr items-stretch">
              {bluePlayers.map((p, idx) => renderPlayerCard(p, idx))}
            </div>
          </div>
        </div>

        {/* Penalty Adjustment Popover Modal */}
        {penaltyModalPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Adjust Penalty
                  </h4>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {penaltyModalPlayer.playerName}
                  </p>
                </div>
                <button
                  onClick={() => setPenaltyModalPlayer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
                    if (currentGame) {
                      applyPenalty(currentGame.id, penaltyModalPlayer.playerId, 'NONE');
                    }
                    setPenaltyModalPlayer(null);
                  }}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    penaltyModalPlayer.currentPenalty === 'NONE' || !penaltyModalPlayer.currentPenalty
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
                    if (currentGame) {
                      applyPenalty(currentGame.id, penaltyModalPlayer.playerId, 'PLUS_2');
                    }
                    setPenaltyModalPlayer(null);
                  }}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    penaltyModalPlayer.currentPenalty === 'PLUS_2'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  +2.00s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
                    if (currentGame) {
                      applyPenalty(currentGame.id, penaltyModalPlayer.playerId, 'DNF');
                    }
                    setPenaltyModalPlayer(null);
                  }}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                    penaltyModalPlayer.currentPenalty === 'DNF'
                      ? 'bg-red-500 text-white border-red-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  DNF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Free For All Grid: Equal height cards using auto-rows-fr and items-stretch
  return (
    <div className="w-full relative">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr items-stretch">
        {activePlayers.map((p, idx) => renderPlayerCard(p, idx))}
      </div>

      {/* Penalty Adjustment Popover Modal */}
      {penaltyModalPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Adjust Penalty
                </h4>
                <p className="text-[11px] text-slate-500 font-bold">
                  {penaltyModalPlayer.playerName}
                </p>
              </div>
              <button
                onClick={() => setPenaltyModalPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
                  if (currentGame) {
                    applyPenalty(currentGame.id, penaltyModalPlayer.playerId, 'NONE');
                  }
                  setPenaltyModalPlayer(null);
                }}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  penaltyModalPlayer.currentPenalty === 'NONE' || !penaltyModalPlayer.currentPenalty
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
                  if (currentGame) {
                    applyPenalty(currentGame.id, penaltyModalPlayer.playerId, 'PLUS_2');
                  }
                  setPenaltyModalPlayer(null);
                }}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  penaltyModalPlayer.currentPenalty === 'PLUS_2'
                    ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                +2.00s
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentGame = sets[currentSetIndex]?.games[currentGameIndex];
                  if (currentGame) {
                    applyPenalty(currentGame.id, penaltyModalPlayer.playerId, 'DNF');
                  }
                  setPenaltyModalPlayer(null);
                }}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                  penaltyModalPlayer.currentPenalty === 'DNF'
                    ? 'bg-red-500 text-white border-red-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                DNF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
