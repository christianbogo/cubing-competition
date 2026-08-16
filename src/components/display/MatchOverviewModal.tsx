'use client';

import React from 'react';
import { X, Trophy, Award, Flame, CheckCircle2, Crown } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { formatPoints, formatTime } from '@/utils/formatters';

interface MatchOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchOverviewModal: React.FC<MatchOverviewModalProps> = ({ isOpen, onClose }) => {
  const {
    players,
    sets,
    settings,
    totalPoints,
    gameWins,
    setWins,
    matchBestTimeMs,
  } = useTournamentStore();

  if (!isOpen) return null;

  const activePlayers = players.filter((p) => p.active);

  // Compute detailed statistics for each player
  const playerStats = activePlayers.map((player) => {
    const timesMs: number[] = [];
    let dnfCount = 0;
    let totalScore = totalPoints[player.id] || 0;

    sets.forEach((s) => {
      s.games.forEach((g) => {
        g.rounds.forEach((r) => {
          const solve = r.solves[player.id];
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
    };
  });

  // Sort standings by sets won desc, then games won desc, then total points desc
  const sortedStandings = [...playerStats].sort((a, b) => {
    if (b.setsWon !== a.setsWon) return b.setsWon - a.setsWon;
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    return b.totalScore - a.totalScore;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 dark:text-white tracking-wider font-mono">
                Match Overview & Solve Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {settings.tournamentMode === 'TEAMS' ? 'Team Battle' : 'Free-For-All'} • First to {settings.targetSets} Set{settings.targetSets > 1 ? 's' : ''} • First to {settings.targetGames} Game{settings.targetGames > 1 ? 's' : ''} • Floor {settings.rankPointsFloor} pts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Standings Summary Table */}
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
                        {stat.solvesCount} {stat.dnfCount > 0 && <span className="text-red-500 font-bold">({stat.dnfCount} DNF)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Match Sets & Games Detailed History */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Comprehensive Sets & Games Breakdown
            </h3>

            {sets.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-xs">
                      SET {s.setIndex + 1}
                    </span>
                    {s.completed && s.winnerId && (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-mono font-black shadow-sm">
                        <Crown className="w-3 h-3" />
                        Set Winner: {players.find((p) => p.id === s.winnerId)?.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {s.games.length} Game{s.games.length > 1 ? 's' : ''} Played
                  </span>
                </div>

                <div className="space-y-3">
                  {s.games.map((g) => (
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
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                            Game {g.gameIndex + 1}
                          </span>
                          {g.completed && g.winnerId && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[11px] font-mono font-bold">
                              👑 Won by {players.find((p) => p.id === g.winnerId)?.name}
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
                                  <td className="py-2 px-3 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]" title={r.scramble}>
                                    {r.scramble}
                                  </td>
                                  {activePlayers.map((p) => {
                                    const solve = r.solves[p.id];
                                    if (!solve || solve.rawTimeMs === 0) {
                                      return (
                                        <td key={p.id} className="py-2 px-3 text-center text-slate-400">
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
                                            {formatTime(solve.finalTimeMs, { penalty: solve.penalty })}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
