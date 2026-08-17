'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  X,
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  Crown,
  RotateCcw,
  LogOut,
  Shield,
} from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { formatPoints, formatTime } from '@/utils/formatters';
import { TeamId } from '@/types/tournament';

interface MatchOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchOverviewModal: React.FC<MatchOverviewModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const {
    players,
    sets,
    settings,
    totalPoints,
    gameWins,
    setWins,
    teamTotalPoints,
    teamSetWins,
    teamGameWins,
    matchBestTimeMs,
    matchWinnerPlayerId,
    matchWinnerTeamId,
    resetTournament,
    cancelMatchToSetup,
  } = useTournamentStore();

  const { resetForNewRace } = useTimerStore();

  const isTeamMode = settings.tournamentMode === 'TEAMS';
  const isMatchWon = isTeamMode ? !!matchWinnerTeamId : !!matchWinnerPlayerId;
  const winnerPlayer = players.find((p) => p.id === matchWinnerPlayerId);
  const winningTeam = matchWinnerTeamId;

  // Confetti effect when match is won
  useEffect(() => {
    if (isOpen && isMatchWon) {
      const end = Date.now() + 4 * 1000;
      const colors = isTeamMode
        ? winningTeam === 'RED'
          ? ['#ef4444', '#f43f5e', '#fb7185', '#b91c1c']
          : ['#06b6d4', '#3b82f6', '#38bdf8', '#1d4ed8']
        : ['#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#8b5cf6'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.6 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.6 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, isMatchWon, isTeamMode, winningTeam]);

  if (!isOpen) return null;

  const activePlayers = players.filter((p) => p.active);

  // Compute detailed statistics for each player
  const playerStats = activePlayers.map((player) => {
    const timesMs: number[] = [];
    let dnfCount = 0;
    const totalScore = totalPoints[player.id] || 0;

    sets?.forEach((s) => {
      s.games?.forEach((g) => {
        g.rounds?.forEach((r) => {
          const solve = r.solves?.[player.id];
          if (solve && r.completed) {
            if (solve.isDNF || solve.penalty === 'DNF') {
              dnfCount++;
            } else if (solve.finalTimeMs > 0) {
              timesMs.push(solve.finalTimeMs);
            }
          }
        });
      });
    });

    const solvesCount = timesMs.length;
    const bestMs = timesMs.length > 0 ? Math.min(...timesMs) : null;
    const sum = timesMs.reduce((a, b) => a + b, 0);
    const mean = solvesCount > 0 ? sum / solvesCount : null;
    const variance =
      solvesCount > 1
        ? timesMs.reduce((acc, t) => acc + Math.pow(t - mean!, 2), 0) / solvesCount
        : 0;
    const stdDev = Math.sqrt(variance);

    return {
      player,
      setsWon: setWins[player.id] || 0,
      gamesWon: gameWins[player.id] || 0,
      totalScore,
      solvesCount,
      dnfCount,
      bestMs,
      meanMs: mean,
      stdDevMs: stdDev,
      timesMs,
    };
  });

  // Sort FFA standings by sets won desc, then games won desc, then total points desc
  const sortedStandings = [...playerStats].sort((a, b) => {
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    return b.totalScore - a.totalScore;
  });

  // Compute team aggregates for team mode
  const teamsList: TeamId[] = ['RED', 'BLUE'];
  const teamAggregates = teamsList.map((team) => {
    const members = playerStats.filter((s) => (s.player.team || 'RED') === team);
    const allTimes = members.flatMap((m) => m.timesMs);
    const totalDnf = members.reduce((acc, m) => acc + m.dnfCount, 0);
    const bestMs = allTimes.length > 0 ? Math.min(...allTimes) : null;
    const sum = allTimes.reduce((a, b) => a + b, 0);
    const meanMs = allTimes.length > 0 ? sum / allTimes.length : null;

    return {
      team,
      members,
      setsWon: teamSetWins[team] || 0,
      gamesWon: teamGameWins[team] || 0,
      totalScore: teamTotalPoints[team] || 0,
      bestMs,
      meanMs,
      totalSolves: allTimes.length,
      totalDnf,
    };
  });

  const handleEndMatch = () => {
    const currentMatchId = useTournamentStore.getState().matchId;
    if (currentMatchId && currentMatchId !== 'local') {
      import('firebase/database').then(({ ref, remove }) => {
        import('@/lib/firebase').then(({ database }) => {
          remove(ref(database, `matches/${currentMatchId}`)).catch(e => console.error(e));
        });
      });
    }

    resetForNewRace();
    resetTournament();
    onClose();
    router.push('/');
  };

  const modeSubtitle = `${
    settings.tournamentMode === 'TEAMS' ? 'Team Battle' : 'Free-For-All'
  } • First to ${settings.targetSets} Set${settings.targetSets > 1 ? 's' : ''} • First to ${
    settings.targetGames
  } Game${settings.targetGames > 1 ? 's' : ''} • ${
    settings.scoringMode === 'RANK_BASED'
      ? `Floor ${settings.rankPointsFloor} pts`
      : `Gap ${settings.differentialGapThreshold} pts`
  }`;

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        isMatchWon
          ? 'items-stretch justify-center p-0 bg-slate-950/95'
          : 'items-center justify-center p-3 md:p-6 bg-slate-900/70 dark:bg-black/85'
      } backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto`}
    >
      <div
        className={`relative w-full ${
          isMatchWon
            ? 'min-h-screen max-w-7xl mx-auto rounded-none border-0 bg-transparent flex flex-col p-4 sm:p-8'
            : 'max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden'
        }`}
      >
        {/* Top Summary Banner when Match is Completed */}
        {isMatchWon && (
          <div className="w-full mb-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900/80 to-slate-900 border border-amber-400/40 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  {isTeamMode ? (
                    <Shield
                      className={`w-9 h-9 sm:w-11 sm:h-11 animate-bounce ${
                        winningTeam === 'RED' ? 'text-red-500' : 'text-cyan-400'
                      }`}
                    />
                  ) : (
                    <Trophy className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 animate-bounce" />
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest font-black px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400">
                  🏆 TOURNAMENT CHAMPION
                </span>
                <h1 className="text-2xl sm:text-4xl font-black font-mono uppercase tracking-tight text-white mt-2">
                  {isTeamMode
                    ? winningTeam === 'RED'
                      ? 'Red Team Victorious!'
                      : 'Blue Team Victorious!'
                    : `${winnerPlayer?.name || 'Player'} is the Champion!`}
                </h1>
                <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1">
                  {modeSubtitle}
                </p>
              </div>

              {/* Match Controls Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pt-2">
                <button
                  onClick={handleEndMatch}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>End Match</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regular Modal Header (when match is in progress) */}
        {!isMatchWon && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider font-mono">
                  Match Overview & Solve Matrix
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {modeSubtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div
          className={`${
            isMatchWon
              ? 'space-y-6'
              : 'flex-1 overflow-y-auto p-4 sm:p-6 space-y-6'
          }`}
        >
          {/* Section: Tournament Standings & Solver Performance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Tournament Standings & Solver Performance
              </h3>
              {matchBestTimeMs && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Match Best: {formatTime(matchBestTimeMs)}</span>
                </div>
              )}
            </div>

            {/* In Team Mode: Render Team Summary Cards & Player Performance */}
            {isTeamMode ? (
              <div className="space-y-4">
                {teamAggregates.map((t) => (
                  <div
                    key={t.team}
                    className={`rounded-3xl border p-4 sm:p-5 space-y-4 shadow-sm ${
                      t.team === 'RED'
                        ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                        : 'bg-cyan-50/30 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900/50'
                    }`}
                  >
                    {/* Team Aggregate Summary Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider border shadow-sm ${
                            t.team === 'RED'
                              ? 'bg-red-500 text-white border-red-400'
                              : 'bg-cyan-500 text-slate-950 border-cyan-400'
                          }`}
                        >
                          {t.team} TEAM
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                          <span>
                            Sets:{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {t.setsWon}/{settings.targetSets}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Games in Set:{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {t.gamesWon}/{settings.targetGames}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                            Total Score
                          </span>
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                            {formatPoints(t.totalScore, settings.scoringMode)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                            Team Best
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {t.bestMs ? formatTime(t.bestMs) : '--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] block">
                            Team Average
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {t.meanMs ? formatTime(t.meanMs) : '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Team Members Breakdown Table (NO Sets / Games Won columns) */}
                    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 shadow-sm">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400">
                            <th className="py-2.5 px-4 font-bold uppercase">Racer</th>
                            <th className="py-2.5 px-3 text-center font-bold uppercase">Total Pts</th>
                            <th className="py-2.5 px-3 text-center font-bold uppercase">Best Solve</th>
                            <th className="py-2.5 px-3 text-center font-bold uppercase">Average (Mean)</th>
                            <th className="py-2.5 px-3 text-center font-bold uppercase">Consistency (±Std)</th>
                            <th className="py-2.5 px-4 text-center font-bold uppercase">Solves / DNF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.members.map((stat) => (
                            <tr
                              key={stat.player.id}
                              className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                            >
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-2">
                                  <span className={`font-black ${stat.player.color} text-sm`}>
                                    {stat.player.name}
                                  </span>
                                  {stat.player.role === 'BOT' && (
                                    <span className="text-[10px] text-slate-400">BOT</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-black text-amber-600 dark:text-amber-400 text-sm">
                                {formatPoints(stat.totalScore, settings.scoringMode)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                {stat.bestMs ? formatTime(stat.bestMs) : '--'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-medium text-slate-800 dark:text-slate-200">
                                {stat.meanMs ? formatTime(stat.meanMs) : '--'}
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500 dark:text-slate-400">
                                {stat.stdDevMs > 0 ? `±${(stat.stdDevMs / 1000).toFixed(2)}s` : '--'}
                              </td>
                              <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-400">
                                {stat.solvesCount}{' '}
                                {stat.dnfCount > 0 && (
                                  <span className="text-red-500 font-bold">
                                    ({stat.dnfCount} DNF)
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* FFA Standings Table */
              <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-sm">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-4 font-bold uppercase">Rank / Racer</th>
                      <th className="py-3 px-3 text-center font-bold uppercase">Sets Won</th>
                      <th className="py-3 px-3 text-center font-bold uppercase">Current Set Games</th>
                      <th className="py-3 px-3 text-center font-bold uppercase">Total Pts</th>
                      <th className="py-3 px-3 text-center font-bold uppercase">Best Solve</th>
                      <th className="py-3 px-3 text-center font-bold uppercase">Average (Mean)</th>
                      <th className="py-3 px-3 text-center font-bold uppercase">Consistency (±Std)</th>
                      <th className="py-3 px-4 text-center font-bold uppercase">Solves / DNF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStandings.map((stat, idx) => (
                      <tr
                        key={stat.player.id}
                        className={`border-b border-slate-100 dark:border-slate-800/50 ${
                          idx === 0
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 font-bold'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-black text-[11px] text-slate-700 dark:text-slate-300">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className={`font-black ${stat.player.color} text-sm`}>
                                {stat.player.name}
                              </span>
                              {stat.player.role === 'BOT' && (
                                <span className="ml-1 text-[10px] text-slate-400">BOT</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white">
                          {stat.setsWon} / {settings.targetSets}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {stat.gamesWon} / {settings.targetGames}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-amber-600 dark:text-amber-400 text-sm">
                          {formatPoints(stat.totalScore, settings.scoringMode)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {stat.bestMs ? formatTime(stat.bestMs) : '--'}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-800 dark:text-slate-200">
                          {stat.meanMs ? formatTime(stat.meanMs) : '--'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400">
                          {stat.stdDevMs > 0 ? `±${(stat.stdDevMs / 1000).toFixed(2)}s` : '--'}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                          {stat.solvesCount}{' '}
                          {stat.dnfCount > 0 && (
                            <span className="text-red-500 font-bold">
                              ({stat.dnfCount} DNF)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Full Match Sets & Games Detailed History */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Comprehensive Sets & Games Breakdown
            </h3>

            {sets.map((s) => {
              const setWinningTeamName =
                s.winnerTeam === 'RED'
                  ? 'Red Team'
                  : s.winnerTeam === 'BLUE'
                  ? 'Blue Team'
                  : s.winnerTeam;
              const setWinningPlayerName = players.find((p) => p.id === s.winnerId)?.name;

              return (
                <div
                  key={s.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-xs">
                        SET {s.setIndex + 1}
                      </span>
                      {s.completed && (isTeamMode ? s.winnerTeam : s.winnerId) && (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-mono font-black shadow-sm">
                          <Crown className="w-3 h-3" />
                          Set Winner: {isTeamMode ? setWinningTeamName : setWinningPlayerName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {s.games.length} Game{s.games.length > 1 ? 's' : ''} Played
                    </span>
                  </div>

                  <div className="space-y-3">
                    {s.games.map((g) => {
                      const gameWinningTeamName =
                        g.winnerTeam === 'RED'
                          ? 'Red Team'
                          : g.winnerTeam === 'BLUE'
                          ? 'Blue Team'
                          : g.winnerTeam;
                      const gameWinningPlayerName = players.find((p) => p.id === g.winnerId)?.name;

                      return (
                        <div
                          key={g.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            g.completed
                              ? 'border-amber-400/40 dark:border-amber-500/30 bg-white dark:bg-slate-900/90'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                          }`}
                        >
                          {/* Game Header */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                                Game {g.gameIndex + 1}
                              </span>
                              {g.completed && (isTeamMode ? g.winnerTeam : g.winnerId) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[11px] font-mono font-bold">
                                  👑 Won by{' '}
                                  {isTeamMode ? gameWinningTeamName : gameWinningPlayerName}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">
                              {g.rounds.length} Round{g.rounds.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Rounds Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-[11px]">
                                  <th className="py-2 px-3 font-semibold w-16">Round</th>
                                  <th className="py-2 px-3 font-semibold min-w-[200px]">Scramble</th>
                                  {activePlayers.map((p) => (
                                    <th key={p.id} className="py-2 px-3 text-center font-bold">
                                      <span className={p.color}>{p.name}</span>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {g.rounds.map((r, rIdx) => {
                                  const isGameWinningRound =
                                    g.completed && rIdx === g.rounds.length - 1;

                                  return (
                                    <tr
                                      key={r.id}
                                      className={`border-b border-slate-100 dark:border-slate-800/40 ${
                                        isGameWinningRound
                                          ? 'bg-amber-500/10 dark:bg-amber-500/15 font-bold border-l-4 border-amber-500'
                                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                                      }`}
                                    >
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-1">
                                          <span>R{r.roundIndex + 1}</span>
                                          {isGameWinningRound && (
                                            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                                          )}
                                        </div>
                                      </td>
                                      <td
                                        className="py-2 px-3 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]"
                                        title={r.scramble}
                                      >
                                        {r.scramble}
                                      </td>
                                      {activePlayers.map((p) => {
                                        const solve = r.solves?.[p.id];
                                        if (!solve || solve.rawTimeMs === 0) {
                                          return (
                                            <td
                                              key={p.id}
                                              className="py-2 px-3 text-center text-slate-400"
                                            >
                                              --
                                            </td>
                                          );
                                        }

                                        return (
                                          <td key={p.id} className="py-2 px-3 text-center">
                                            <div className="inline-flex flex-col items-center">
                                              <span
                                                className={`font-bold ${
                                                  solve.isDNF || solve.penalty === 'DNF'
                                                    ? 'text-red-500'
                                                    : solve.rank === 1
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-slate-900 dark:text-slate-100'
                                                }`}
                                              >
                                                {formatTime(solve.finalTimeMs, {
                                                  penalty: solve.penalty,
                                                })}
                                              </span>
                                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <span>+{solve.score}p</span>
                                                <span>(#{solve.rank})</span>
                                              </span>
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
