import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PenaltyType, Player, ScoringMode } from '@/types/tournament';
import { formatTime } from '@/utils/formatters';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  totalActive: number;
  displayTimeMs: number;
  isHeld: boolean;
  isLockedIn: boolean;
  isRunning: boolean;
  isFinished: boolean;
  falseStartDeltaMs: number;
  falseStartMultiplier: number;
  penalty?: PenaltyType;
  lastRoundScore?: number;
  gamePoints: number;
  setWins: number;
  gameWins: number;
  targetSets: number;
  targetGames: number;
  scoringMode: ScoringMode;
  isTeamMode?: boolean;
}

function getOrdinal(n?: number): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRankColor(rank?: number): string {
  if (!rank) return 'text-neutral-400';
  if (rank === 1) return 'text-amber-400';
  if (rank === 2) return 'text-slate-300';
  if (rank === 3) return 'text-amber-600';
  return 'text-neutral-400';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  rank,
  displayTimeMs,
  isHeld,
  isRunning,
  isFinished,
  falseStartDeltaMs,
  falseStartMultiplier,
  penalty = 'NONE',
  lastRoundScore,
  gamePoints,
  setWins,
  gameWins,
  targetSets,
  targetGames,
  isTeamMode = false,
}) => {
  const isFalseStart = falseStartDeltaMs > 0;
  const falseStartPenaltyMs = falseStartDeltaMs * falseStartMultiplier;

  // When finished with a false start, show the total final time including the start penalty
  const effectiveTimeMs =
    isFinished && isFalseStart ? displayTimeMs + falseStartPenaltyMs : displayTimeMs;

  const formattedTime = formatTime(effectiveTimeMs, { penalty });

  const showRank = isFinished && rank !== undefined && displayTimeMs > 0;
  const ordinalRank = showRank ? getOrdinal(rank) : '';
  const rankColor = showRank ? getRankColor(rank) : 'text-neutral-400';

  // If finished with a false start penalty or DNF/+2, render the time in red
  const timeTextColor = isFinished
    ? isFalseStart || penalty === 'DNF' || penalty === 'PLUS_2'
      ? 'text-red-500'
      : 'text-white'
    : isRunning
    ? 'text-emerald-400'
    : isHeld
    ? 'text-amber-300'
    : 'text-neutral-500';

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 select-none overflow-hidden ${
        isRunning
          ? 'bg-neutral-900/90 border-emerald-500/70 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-500/40'
          : isFinished
          ? isFalseStart
            ? 'bg-red-950/20 border-red-900/60 shadow-md shadow-red-500/10'
            : 'bg-neutral-950/90 border-neutral-800 shadow-md'
          : isHeld
          ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10'
          : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700'
      }`}
    >
      {/* Top Section: Key Badge, Name + Score on same line, Shapes below (only in FFA) */}
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Key Binding Pill */}
        <div
          className={`flex items-center justify-center font-mono font-black text-xs sm:text-sm w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all shrink-0 ${
            isHeld
              ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/50 scale-105'
              : isRunning
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-neutral-900 text-neutral-300 border-neutral-700'
          }`}
        >
          {player.key.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name and Game Score on the SAME line */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 truncate">
            <h3
              className={`text-base sm:text-lg md:text-xl font-black tracking-tight ${player.color} uppercase truncate`}
            >
              {player.name}
            </h3>

            {/* Score & +Score on same line */}
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-white font-black text-sm sm:text-base md:text-lg">
                {gamePoints}
              </span>
              {lastRoundScore !== undefined && lastRoundScore > 0 && (
                <span className="text-yellow-400 font-black text-xs sm:text-sm">
                  +{lastRoundScore}
                </span>
              )}
            </div>
          </div>

          {/* Set & Game Wins Shapes (Rendered ONLY in Free For All mode) */}
          {!isTeamMode && (
            <div className="flex items-center gap-2 mt-1">
              {/* Set Wins (Diamonds) */}
              <div
                className="flex items-center gap-1"
                title={`${setWins} / ${targetSets} Sets Won`}
              >
                {Array.from({ length: Math.max(1, targetSets) }).map((_, idx) => {
                  const isWon = idx < setWins;
                  return (
                    <span
                      key={`set-${idx}`}
                      style={
                        isWon
                          ? { backgroundColor: player.accentColor, borderColor: player.accentColor }
                          : undefined
                      }
                      className={`w-2.5 h-2.5 rotate-45 rounded-[1px] border transition-all ${
                        isWon ? 'shadow-sm' : 'bg-neutral-950 border-neutral-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Divider */}
              <span className="text-neutral-700 text-[10px]">•</span>

              {/* Game Wins (Circles) */}
              <div
                className="flex items-center gap-1"
                title={`${gameWins} / ${targetGames} Games Won in Set`}>
                {Array.from({ length: Math.max(1, targetGames) }).map((_, idx) => {
                  const isWon = idx < gameWins;
                  return (
                    <span
                      key={`game-${idx}`}
                      style={
                        isWon
                          ? { backgroundColor: player.accentColor, borderColor: player.accentColor }
                          : undefined
                      }
                      className={`w-2.5 h-2.5 rounded-full border transition-all ${
                        isWon ? 'shadow-sm' : 'bg-neutral-950 border-neutral-700'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center / Main Area: Place (small) & Time (large) fitting without overflow */}
      <div className="my-2.5 sm:my-4 text-center">
        <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
          {showRank && (
            <span
              className={`${rankColor} text-sm sm:text-base md:text-lg font-bold font-mono tracking-tight shrink-0`}
            >
              {ordinalRank}
            </span>
          )}
          <span
            className={`font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter tabular-nums ${timeTextColor}`}
          >
            {formattedTime}
          </span>
        </div>

        {/* Penalties & Alerts */}
        <div className="min-h-[18px] mt-1 flex items-center justify-center gap-1.5">
          {penalty === 'PLUS_2' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] sm:text-[11px] font-mono font-bold">
              +2.00s
            </span>
          )}
          {penalty === 'DNF' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/30 border border-red-500/50 text-red-300 text-[10px] sm:text-[11px] font-mono font-black tracking-wider">
              DNF
            </span>
          )}
          {isFalseStart && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] sm:text-[11px] font-mono font-bold">
              <AlertTriangle className="w-3 h-3" />
              FALSE START (+{(falseStartPenaltyMs / 1000).toFixed(2)}s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
