import React, { useState } from 'react';
import { PenaltyType, Solve } from '@/types/tournament';
import { useTournamentStore } from '@/store/tournamentStore';
import { formatPoints, formatTime } from '@/utils/formatters';

export const SolveGrid: React.FC = () => {
  const { sets, players, settings, applyPenalty, totalPoints, setWins } = useTournamentStore();
  const [selectedCell, setSelectedCell] = useState<{
    gameId: string;
    playerId: string;
    currentPenalty: PenaltyType;
    timeMs: number;
  } | null>(null);

  const activePlayers = players.filter((p) => p.active);

  // Flatten all games across all sets for the matrix columns
  const allGames = sets.flatMap((s) =>
    s.games.map((g) => ({
      ...g,
      label: `S${s.setIndex + 1}-G${g.gameIndex + 1}`,
    }))
  );

  const handlePenaltySelect = (penalty: PenaltyType) => {
    if (!selectedCell) return;
    applyPenalty(selectedCell.gameId, selectedCell.playerId, penalty);
    setSelectedCell(null);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-wider">
            Solve Matrix & Penalty Enforcement
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any recorded solve cell to apply official speedcubing penalties (+2.00s or DNF). Points recalculate in real-time.
          </p>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-sm">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 font-bold uppercase tracking-wider min-w-[140px]">
                Player / Team
              </th>
              {allGames.map((g) => (
                <th key={g.id} className="py-3 px-3 text-center border-l border-slate-200 dark:border-slate-800/60 min-w-[90px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{g.label}</span>
                  {g.completed && <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">Done</span>}
                </th>
              ))}
              <th className="py-3 px-4 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 font-bold uppercase text-amber-600 dark:text-amber-400 min-w-[100px]">
                Total Pts
              </th>
              <th className="py-3 px-4 text-center border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 font-bold uppercase text-slate-700 dark:text-slate-300 min-w-[80px]">
                Sets Won
              </th>
            </tr>
          </thead>
          <tbody>
            {activePlayers.map((player) => (
              <tr key={player.id} className="border-b border-slate-200/80 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                {/* Player Column */}
                <td className="py-3 px-4 sticky left-0 bg-white/95 dark:bg-slate-950/95 z-10 border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {player.key.toUpperCase()}
                    </span>
                    <div>
                      <span className={`font-black ${player.color} text-sm`}>{player.name}</span>
                      {player.team && <span className="block text-[10px] text-slate-400 dark:text-slate-500">{player.team}</span>}
                    </div>
                  </div>
                </td>

                {/* Game Cells */}
                {allGames.map((g) => {
                  const solve: Solve | undefined = g.solves[player.id];
                  const hasSolve = !!solve && solve.rawTimeMs > 0;

                  const isLatestGame = allGames.length > 0 && g.id === allGames[allGames.length - 1]?.id;

                  return (
                    <td
                      key={g.id}
                      className="py-2.5 px-2 text-center border-l border-slate-200/80 dark:border-slate-800/60 transition-colors"
                    >
                      {hasSolve ? (
                        <button
                          disabled={!isLatestGame}
                          onClick={() =>
                            isLatestGame &&
                            setSelectedCell({
                              gameId: g.id,
                              playerId: player.id,
                              currentPenalty: solve.penalty,
                              timeMs: solve.finalTimeMs,
                            })
                          }
                          className={`w-full py-1.5 px-1.5 rounded-lg border text-center transition-all ${
                            isLatestGame ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default opacity-90'
                          } ${
                            solve.penalty === 'DNF'
                              ? 'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-500/60 text-red-700 dark:text-red-300'
                              : solve.penalty === 'PLUS_2'
                              ? 'bg-orange-100 dark:bg-orange-950/60 border-orange-300 dark:border-orange-500/60 text-orange-700 dark:text-orange-300'
                              : 'bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-xs">
                            {formatTime(solve.finalTimeMs, { penalty: solve.penalty })}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">+{solve.score}p</span>
                            <span>(#{solve.rank})</span>
                          </div>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">--</span>
                      )}
                    </td>
                  );
                })}

                {/* Total Points */}
                <td className="py-3 px-4 text-center border-l border-slate-200 dark:border-slate-800 font-black text-amber-600 dark:text-amber-400 bg-slate-50/50 dark:bg-slate-900/20 text-sm">
                  {formatPoints(totalPoints[player.id] || 0, settings.scoringMode)}
                </td>

                {/* Sets Won */}
                <td className="py-3 px-4 text-center border-l border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/20">
                  {setWins[player.id] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Penalty Action Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="text-center">
              <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
                Official Penalty Enforcement
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apply a penalty for solve: {formatTime(selectedCell.timeMs)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePenaltySelect('NONE')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  selectedCell.currentPenalty === 'NONE'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                CLEAR / OK
              </button>

              <button
                onClick={() => handlePenaltySelect('PLUS_2')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  selectedCell.currentPenalty === 'PLUS_2'
                    ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                    : 'bg-orange-50 dark:bg-slate-800 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-neutral-700 hover:bg-orange-100'
                }`}
              >
                +2.00s
              </button>

              <button
                onClick={() => handlePenaltySelect('DNF')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  selectedCell.currentPenalty === 'DNF'
                    ? 'bg-red-600 text-white border-red-500 shadow-sm'
                    : 'bg-red-50 dark:bg-slate-800 text-red-700 dark:text-red-300 border-red-200 dark:border-neutral-700 hover:bg-red-100'
                }`}
              >
                DNF
              </button>
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
