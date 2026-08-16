import React from 'react';
import { Shield } from 'lucide-react';
import { TeamId } from '@/types/tournament';

interface TeamCardProps {
  team: TeamId;
  gamePoints: number;
  totalPoints: number;
  setWins: number;
  gameWins: number;
  targetSets: number;
  targetGames: number;
  playerCount: number;
  differentialLeadFraction?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  gamePoints,
  setWins,
  gameWins,
  targetSets,
  targetGames,
  playerCount,
  differentialLeadFraction,
}) => {
  const isRed = team === 'RED';
  const teamColor = isRed ? 'text-red-600 dark:text-red-400' : 'text-cyan-600 dark:text-cyan-400';
  const teamAccent = isRed ? '#ef4444' : '#06b6d4';
  const teamBg = isRed
    ? 'bg-gradient-to-br from-red-50/80 to-white dark:from-red-950/40 dark:to-slate-950/90 border-red-200 dark:border-red-800/60 shadow-sm dark:shadow-red-500/10'
    : 'bg-gradient-to-br from-cyan-50/80 to-white dark:from-cyan-950/40 dark:to-slate-950/90 border-cyan-200 dark:border-cyan-800/60 shadow-sm dark:shadow-cyan-500/10';

  return (
    <div
      className={`relative flex items-center justify-between rounded-2xl border p-3.5 sm:p-4 mb-4 transition-all duration-200 select-none shadow-sm ${teamBg}`}
    >
      {/* Left: Team Icon & Title */}
      <div className="flex items-center gap-3">
        <div
          style={{ borderColor: teamAccent, backgroundColor: `${teamAccent}15` }}
          className="flex items-center justify-center w-10 h-10 rounded-2xl border shadow-sm"
        >
          <Shield style={{ color: teamAccent }} className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg sm:text-xl font-black uppercase tracking-wider ${teamColor}`}>
              {isRed ? 'RED TEAM' : 'BLUE TEAM'}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              {playerCount} {playerCount === 1 ? 'SOLVER' : 'SOLVERS'}
            </span>
          </div>

          {/* Set & Game Wins Shapes for Team */}
          <div className="flex items-center gap-2.5 mt-1">
            {/* Set Wins (Diamonds) */}
            <div className="flex items-center gap-1" title={`${setWins} / ${targetSets} Sets Won`}>
              {Array.from({ length: Math.max(1, targetSets) }).map((_, idx) => {
                const isWon = idx < setWins;
                return (
                  <span
                    key={`team-set-${idx}`}
                    style={
                      isWon
                        ? { backgroundColor: teamAccent, borderColor: teamAccent }
                        : undefined
                    }
                    className={`w-3 h-3 rotate-45 rounded-[1px] border transition-all ${
                      isWon
                        ? 'shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Divider */}
            <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>

            {/* Game Wins (Circles) */}
            <div
              className="flex items-center gap-1"
              title={`${gameWins} / ${targetGames} Games Won in Set`}
            >
              {Array.from({ length: Math.max(1, targetGames) }).map((_, idx) => {
                const isWon = idx < gameWins;
                return (
                  <span
                    key={`team-game-${idx}`}
                    style={
                      isWon
                        ? { backgroundColor: teamAccent, borderColor: teamAccent }
                        : undefined
                    }
                    className={`w-3 h-3 rounded-full border transition-all ${
                      isWon
                        ? 'shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Team Game Points */}
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          TEAM SCORE
        </span>
        <div className="flex items-baseline gap-1.5 font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {differentialLeadFraction && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">
              ({differentialLeadFraction})
            </span>
          )}
          <span>{gamePoints}</span>
        </div>
      </div>
    </div>
  );
};
