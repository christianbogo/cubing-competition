import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, X, Shield } from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { formatPoints } from '@/utils/formatters';

interface MatchVictoryModalProps {
  onClose: () => void;
}

export const MatchVictoryModal: React.FC<MatchVictoryModalProps> = ({ onClose }) => {
  const {
    matchWinnerPlayerId,
    matchWinnerTeamId,
    players,
    totalPoints,
    setWins,
    teamTotalPoints,
    teamSetWins,
    settings,
    resetTournament,
  } = useTournamentStore();
  const { resetForNewRace } = useTimerStore();

  const isTeamMode = settings.tournamentMode === 'TEAMS';
  const hasWinner = isTeamMode ? !!matchWinnerTeamId : !!matchWinnerPlayerId;
  const winner = players.find((p) => p.id === matchWinnerPlayerId);
  const winningTeam = matchWinnerTeamId;

  useEffect(() => {
    if (hasWinner) {
      const end = Date.now() + 3.5 * 1000;
      const colors = isTeamMode
        ? winningTeam === 'RED'
          ? ['#ef4444', '#f43f5e', '#fb7185', '#b91c1c']
          : ['#06b6d4', '#3b82f6', '#38bdf8', '#1d4ed8']
        : ['#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#8b5cf6'];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [hasWinner, isTeamMode, winningTeam]);

  if (!hasWinner) return null;

  const handleNewTournament = () => {
    resetForNewRace();
    resetTournament();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-500/50 rounded-3xl p-6 md:p-8 text-center shadow-2xl shadow-amber-500/20 overflow-hidden transition-colors">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy / Shield Badge */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/40 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[22px] flex items-center justify-center">
            {isTeamMode ? (
              <Shield
                className={`w-10 h-10 animate-bounce ${
                  winningTeam === 'RED' ? 'text-red-500' : 'text-cyan-500'
                }`}
              />
            ) : (
              <Trophy className="w-10 h-10 text-amber-500 animate-bounce" />
            )}
          </div>
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30">
          Tournament Champions
        </span>

        <h2
          className={`text-4xl md:text-5xl font-black mt-3 mb-1 tracking-tight uppercase ${
            isTeamMode
              ? winningTeam === 'RED'
                ? 'text-red-600 dark:text-red-400'
                : 'text-cyan-600 dark:text-cyan-400'
              : winner?.color
          }`}
        >
          {isTeamMode ? `${winningTeam} TEAM VICTORIOUS!` : winner?.name}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-sans">
          Captured the match with{' '}
          {isTeamMode ? teamSetWins[winningTeam || 'RED'] || 0 : setWins[winner?.id || ''] || 0} Sets
          Won!
        </p>

        {/* Standings Breakdown */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left shadow-sm">
          <h4 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Final Tournament Standings
          </h4>
          <div className="space-y-2">
            {isTeamMode ? (
              <>
                {(['RED', 'BLUE'] as const).map((team) => (
                  <div
                    key={team}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Shield
                        className={`w-4 h-4 ${team === 'RED' ? 'text-red-500' : 'text-cyan-500'}`}
                      />
                      <span
                        className={`font-black ${team === 'RED' ? 'text-red-600 dark:text-red-400' : 'text-cyan-600 dark:text-cyan-400'}`}
                      >
                        {team} TEAM
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{teamSetWins[team] || 0} Sets</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {formatPoints(teamTotalPoints[team] || 0, settings.scoringMode)}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              [...players]
                .filter((p) => p.active)
                .sort(
                  (a, b) =>
                    (setWins[b.id] || 0) - (setWins[a.id] || 0) ||
                    (totalPoints[b.id] || 0) - (totalPoints[a.id] || 0)
                )
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs font-mono shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 dark:text-slate-500 font-bold w-4">#{idx + 1}</span>
                      <span className={`font-black ${p.color}`}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{setWins[p.id] || 0} Sets</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {formatPoints(totalPoints[p.id] || 0, settings.scoringMode)}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* New Match Action */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handleNewTournament}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Start New Tournament
          </button>
        </div>
      </div>
    </div>
  );
};
