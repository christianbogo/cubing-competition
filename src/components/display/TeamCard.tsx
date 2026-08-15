import React from 'react';
import { Shield, Trophy } from 'lucide-react';
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
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  gamePoints,
  setWins,
  gameWins,
  targetSets,
  targetGames,
  playerCount,
}) => {
  const isRed = team === 'RED';
  const teamColor = isRed ? 'text-red-400' : 'text-cyan-400';
  const teamAccent = isRed ? '#ef4444' : '#06b6d4';
  const teamBg = isRed
    ? 'bg-gradient-to-br from-red-950/40 to-neutral-950/90 border-red-800/60 shadow-red-500/10'
    : 'bg-gradient-to-br from-cyan-950/40 to-neutral-950/90 border-cyan-800/60 shadow-cyan-500/10';

  return (
    <div
      className={`relative flex items-center justify-between rounded-2xl border p-3.5 sm:p-4 mb-4 transition-all duration-200 select-none shadow-xl ${teamBg}`}
    >
      {/* Left: Team Icon & Title */}
      <div className="flex items-center gap-3">
        <div
          style={{ borderColor: teamAccent, backgroundColor: `${teamAccent}20` }}
          className="flex items-center justify-center w-10 h-10 rounded-2xl border shadow-md"
        >
          <Shield style={{ color: teamAccent }} className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg sm:text-xl font-black uppercase tracking-wider ${teamColor}`}>
              {isRed ? 'RED TEAM' : 'BLUE TEAM'}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400">
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
                      isWon ? 'shadow-sm' : 'bg-neutral-950 border-neutral-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Divider */}
            <span className="text-neutral-700 text-[10px]">•</span>

            {/* Game Wins (Circles) */}
            <div className="flex items-center gap-1" title={`${gameWins} / ${targetGames} Games Won in Set`}>
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
                      isWon ? 'shadow-sm' : 'bg-neutral-950 border-neutral-700'
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
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
          TEAM SCORE
        </span>
        <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
          {gamePoints}
        </div>
      </div>
    </div>
  );
};
