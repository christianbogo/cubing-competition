import React, { useMemo } from 'react';
import { PlayerCard } from './PlayerCard';
import { TeamCard } from './TeamCard';
import { DEFAULT_PLAYER_COLORS, Player } from '@/types/tournament';
import { useTimerStore } from '@/store/timerStore';
import { useTournamentStore } from '@/store/tournamentStore';

export const LeaderboardView: React.FC = () => {
  const {
    players,
    settings,
    currentGameSolves,
    currentGamePoints,
    lastRoundScores,
    setWins,
    gameWins,
    teamGamePoints,
    teamTotalPoints,
    teamSetWins,
    teamGameWins,
  } = useTournamentStore();
  const { players: timerPlayers, raceState } = useTimerStore();

  const activePlayers = players.filter((p) => p.active);
  const totalActive = activePlayers.length;
  const isTeamMode = settings.tournamentMode === 'TEAMS';

  // Helper to dynamically resolve player color depending on FFA vs Team mode
  const getPlayerWithTheme = (player: Player, index: number): Player => {
    if (isTeamMode) {
      const isRed = (player.team || 'RED') === 'RED';
      return {
        ...player,
        color: isRed ? 'text-red-400' : 'text-cyan-400',
        accentColor: isRed ? '#ef4444' : '#06b6d4',
      };
    }

    // In Free For All: restore distinct player color theme
    const theme = DEFAULT_PLAYER_COLORS[index % DEFAULT_PLAYER_COLORS.length];
    return {
      ...player,
      color: theme.color,
      accentColor: theme.accentColor,
    };
  };

  // Dynamically recompute live ranks and live round scores across all currently finished players
  // Taking start penalties and +2 into account so placements reflect true effective time!
  const liveRanksAndScores = useMemo(() => {
    const finishedList: { playerId: string; effectiveTimeMs: number }[] = [];

    activePlayers.forEach((p) => {
      const tp = timerPlayers[p.id];
      const solve = currentGameSolves[p.id];

      if (raceState === 'RACING' && tp?.isFinished && tp.finishTimeMs !== null) {
        const rawTime = tp.finishTimeMs;
        const penaltyDelta = (tp.falseStartDeltaMs || 0) * settings.falseStartMultiplier;
        const effective = rawTime + penaltyDelta;
        finishedList.push({ playerId: p.id, effectiveTimeMs: effective });
      } else if (raceState === 'FINISHED' || solve?.completedAt) {
        const effective =
          solve?.finalTimeMs ??
          ((tp?.finishTimeMs || 0) + (tp?.falseStartDeltaMs || 0) * settings.falseStartMultiplier);
        finishedList.push({ playerId: p.id, effectiveTimeMs: effective });
      }
    });

    // Sort finished solvers by effective final time ascending (fastest first)
    finishedList.sort((a, b) => a.effectiveTimeMs - b.effectiveTimeMs);

    const ranks: Record<string, number> = {};
    const roundScores: Record<string, number> = {};
    const fastestMs = finishedList.length > 0 ? finishedList[0].effectiveTimeMs : 0;

    finishedList.forEach((item, idx) => {
      const rank = idx + 1;
      ranks[item.playerId] = rank;

      if (settings.scoringMode === 'RANK_BASED') {
        roundScores[item.playerId] =
          Math.max(1, totalActive - (rank - 1)) +
          (rank === 1 ? settings.firstPlaceBonus : 0);
      } else {
        roundScores[item.playerId] = Math.max(
          0,
          Math.round(((item.effectiveTimeMs - fastestMs) / 1000) * 100)
        );
      }
    });

    return { ranks, roundScores };
  }, [activePlayers, timerPlayers, currentGameSolves, raceState, settings, totalActive]);

  // Helper to calculate instant live round score when a player finishes
  const getLivePlayerScoreData = (playerId: string) => {
    const tp = timerPlayers[playerId];
    const solve = currentGameSolves[playerId];
    const storedLastScore = lastRoundScores[playerId];
    const baseGamePoints = currentGamePoints[playerId] || 0;

    // 1. If race is finished, show finalized round score
    if (raceState === 'FINISHED' || solve?.completedAt) {
      const finalScore = liveRanksAndScores.roundScores[playerId] ?? solve?.score ?? storedLastScore;
      return {
        gamePoints: baseGamePoints,
        roundAdd: finalScore,
      };
    }

    // 2. If race is actively running and this player just finished:
    if (raceState === 'RACING' && tp?.isFinished && tp.finishTimeMs !== null) {
      const instantScore = liveRanksAndScores.roundScores[playerId] || 0;
      return {
        gamePoints: baseGamePoints + instantScore,
        roundAdd: instantScore,
      };
    }

    // 3. When round has started (or preparing to start: WAITING_FOR_ALL, LOCKED_IN, DRAG_COUNTDOWN, RACING),
    // hide the plus amount until this solver finishes
    return {
      gamePoints: baseGamePoints,
      roundAdd: undefined,
    };
  };

  // Helper to render an individual player card
  const renderPlayerCard = (player: Player, index: number) => {
    const themedPlayer = getPlayerWithTheme(player, index);
    const tp = timerPlayers[player.id];
    const solve = currentGameSolves[player.id];

    const isCurrentlyRunning = raceState === 'RACING' && tp?.isRunning && !tp?.isFinished;
    const isFinishedThisRound = tp?.isFinished;
    const isSolveRecorded = raceState === 'FINISHED' && solve?.completedAt !== undefined;
    const isStandbyWithReference =
      raceState !== 'RACING' &&
      !tp?.isRunning &&
      !tp?.isFinished &&
      (tp?.lastFinishTimeMs !== null && tp?.lastFinishTimeMs !== undefined);

    let displayTimeMs = 0;
    let displayRank: number | undefined = undefined;
    let isDisplayFinished = false;

    if (isCurrentlyRunning) {
      displayTimeMs = tp?.rawTimeMs || 0;
      displayRank = undefined;
      isDisplayFinished = false;
    } else if (isFinishedThisRound) {
      displayTimeMs = tp?.finishTimeMs ?? tp?.rawTimeMs ?? 0;
      displayRank = liveRanksAndScores.ranks[player.id] ?? tp?.finishRank ?? solve?.rank;
      isDisplayFinished = true;
    } else if (isSolveRecorded) {
      displayTimeMs = solve?.finalTimeMs ?? tp?.finishTimeMs ?? tp?.rawTimeMs ?? 0;
      displayRank = liveRanksAndScores.ranks[player.id] ?? solve?.rank ?? tp?.finishRank;
      isDisplayFinished = true;
    } else if (isStandbyWithReference) {
      displayTimeMs = tp?.lastFinishTimeMs ?? 0;
      displayRank = tp?.lastFinishRank ?? undefined;
      isDisplayFinished = true;
    }

    const { gamePoints, roundAdd } = getLivePlayerScoreData(player.id);

    return (
      <PlayerCard
        key={player.id}
        player={themedPlayer}
        rank={displayRank}
        totalActive={totalActive}
        displayTimeMs={displayTimeMs}
        isHeld={tp?.isHeld || false}
        isLockedIn={tp?.isLockedIn || false}
        isRunning={isCurrentlyRunning}
        isFinished={isDisplayFinished}
        falseStartDeltaMs={tp?.falseStartDeltaMs || solve?.falseStartDeltaMs || 0}
        falseStartMultiplier={settings.falseStartMultiplier}
        penalty={solve?.penalty || 'NONE'}
        lastRoundScore={roundAdd}
        gamePoints={gamePoints}
        setWins={setWins[player.id] || 0}
        gameWins={gameWins[player.id] || 0}
        targetSets={settings.targetSets}
        targetGames={settings.targetGames}
        scoringMode={settings.scoringMode}
        isTeamMode={isTeamMode}
      />
    );
  };

  // Team Split View (Strictly 2 columns even on small width screens: Left = Red, Right = Blue)
  if (isTeamMode) {
    const redPlayers = activePlayers.filter((p) => (p.team || 'RED') === 'RED');
    const bluePlayers = activePlayers.filter((p) => p.team === 'BLUE');

    return (
      <div className="w-full grid grid-cols-2 gap-3 sm:gap-6 items-start">
        {/* Red Team Column (Left) */}
        <div className="flex flex-col">
          <TeamCard
            team="RED"
            gamePoints={teamGamePoints.RED || 0}
            totalPoints={teamTotalPoints.RED || 0}
            setWins={teamSetWins.RED || 0}
            gameWins={teamGameWins.RED || 0}
            targetSets={settings.targetSets}
            targetGames={settings.targetGames}
            playerCount={redPlayers.length}
          />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {redPlayers.map((p, idx) => renderPlayerCard(p, idx))}
          </div>
        </div>

        {/* Blue Team Column (Right) */}
        <div className="flex flex-col">
          <TeamCard
            team="BLUE"
            gamePoints={teamGamePoints.BLUE || 0}
            totalPoints={teamTotalPoints.BLUE || 0}
            setWins={teamSetWins.BLUE || 0}
            gameWins={teamGameWins.BLUE || 0}
            targetSets={settings.targetSets}
            targetGames={settings.targetGames}
            playerCount={bluePlayers.length}
          />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {bluePlayers.map((p, idx) => renderPlayerCard(p, idx))}
          </div>
        </div>
      </div>
    );
  }

  // Free For All Dynamic Grid
  const getGridColsClass = () => {
    if (totalActive <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalActive === 3) return 'grid-cols-1 md:grid-cols-3';
    if (totalActive === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    if (totalActive <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (totalActive <= 8) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
  };

  return (
    <div className="w-full">
      <div className={`grid gap-4 ${getGridColsClass()}`}>
        {activePlayers.map((p, idx) => renderPlayerCard(p, idx))}
      </div>
    </div>
  );
};
