import React, { useEffect, useRef } from 'react';
import { PenaltyType, Player, ScoringMode } from '@/types/tournament';
import { formatTime } from '@/utils/formatters';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  totalActive: number;
  displayTimeMs: number;
  raceStartTime?: number | null;
  isHeld: boolean;
  isLockedIn: boolean;
  isRunning: boolean;
  isFinished: boolean;
  falseStartDeltaMs: number;
  falseStartMultiplier: number;
  penalty?: PenaltyType;
  lastRoundScore?: number;
  gamePoints: number;
  pointsFloor?: number;
  setWins: number;
  gameWins: number;
  targetSets: number;
  targetGames: number;
  scoringMode: ScoringMode;
  isTeamMode?: boolean;
  liveStats?: { averageTimeMs: number; stdDevMs: number; count: number };
  isGameWinner?: boolean;
  isSetWinner?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
  differentialLeadFraction?: string;
  isLocalPlayer?: boolean;
}

function getOrdinal(n?: number): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRankBadgeStyle(rank?: number): string {
  if (rank === 1) {
    return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40';
  }
  if (rank === 2) {
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
  if (rank === 3) {
    return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-500 border-amber-200 dark:border-amber-800/40';
  }
  return 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800';
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
  pointsFloor,
  setWins,
  gameWins,
  targetSets,
  targetGames,
  isTeamMode = false,
  raceStartTime,
  liveStats,
  isGameWinner = false,
  isSetWinner = false,
  onClick,
  isClickable = false,
  differentialLeadFraction,
  isLocalPlayer = false,
}) => {
  const timeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRunning || !raceStartTime) return;

    let rafId: number;
    const loop = () => {
      if (timeRef.current) {
        const currentMs = Math.max(0, Date.now() - raceStartTime);
        timeRef.current.textContent = formatTime(currentMs, { penalty });
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [isRunning, raceStartTime, penalty]);
  const isBot = player.role === 'BOT';
  const botConfig = player.botConfig;

  const isFalseStart = falseStartDeltaMs > 0;
  const falseStartPenaltyMs = falseStartDeltaMs * falseStartMultiplier;
  const isPenalized = isFalseStart || penalty === 'PLUS_2' || penalty === 'DNF';

  const formattedTime = formatTime(displayTimeMs, { penalty });

  const showRank = isFinished && !isRunning && rank !== undefined && displayTimeMs > 0;
  const ordinalRank = showRank ? getOrdinal(rank) : '';

  const timeTextColor = isRunning
    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
    : (isFinished || penalty === 'DNF' || penalty === 'PLUS_2' || isFalseStart)
      ? isPenalized
        ? 'text-red-600 dark:text-red-500 font-black'
        : 'text-slate-900 dark:text-white font-black'
      : 'text-slate-400 dark:text-slate-500';

  // Card border and background styling with Game Winner & Set Winner highlights
  const cardStyle = isRunning
    ? 'bg-emerald-50/50 dark:bg-slate-900/90 border-emerald-500/80 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
    : isHeld
      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50 scale-[1.01]'
      : isSetWinner
        ? 'bg-gradient-to-b from-amber-100/90 via-amber-50 to-white dark:from-amber-950/70 dark:via-slate-900 dark:to-slate-950 border-amber-400 dark:border-amber-500 shadow-2xl shadow-amber-500/30 ring-4 ring-amber-400/60 scale-[1.02]'
        : isGameWinner
          ? 'bg-gradient-to-b from-amber-50/90 to-white dark:from-amber-950/50 dark:to-slate-900 border-amber-400 dark:border-amber-500 shadow-xl shadow-amber-500/20 ring-2 sm:ring-4 ring-amber-400/40 scale-[1.01]'
          : isFinished
            ? isPenalized
              ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/60 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm'
            : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`relative w-full h-full min-h-[130px] sm:min-h-[140px] flex flex-col justify-between rounded-3xl border p-3 sm:p-4 transition-all duration-200 select-none overflow-hidden ${cardStyle} ${isClickable ? 'cursor-pointer hover:border-amber-400/80 dark:hover:border-amber-500/80 hover:shadow-md' : ''
        }`}
    >
      {/* Top Header: Name + Score, Bot Stats/Shapes, and Rank Badge */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          {/* Player Name and Points */}
          <div className="flex items-baseline gap-1.5">
            <h3
              className={`text-sm sm:text-base font-black tracking-tight ${player.color} uppercase truncate max-w-[110px] sm:max-w-[150px]`}
            >
              {player.name}
              {isLocalPlayer && <span className="ml-1.5 text-[10px] text-amber-500 font-mono tracking-wider">(YOU)</span>}
            </h3>

            <div className="flex items-baseline gap-1 font-mono shrink-0">
              <span className="text-slate-900 dark:text-white font-black text-xs sm:text-sm">
                {gamePoints}{!isTeamMode && pointsFloor ? `/${pointsFloor}` : ''}
              </span>
              {differentialLeadFraction && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] sm:text-xs">
                  ({differentialLeadFraction})
                </span>
              )}
              {lastRoundScore !== undefined && lastRoundScore > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-black text-[11px]">
                  +{lastRoundScore}
                </span>
              )}
            </div>
          </div>

          {/* Fixed height container for Set & Game Wins Shapes */}
          <div className="min-h-[14px] flex items-center mt-0.5">
            {!isTeamMode && (
              <div className="flex items-center gap-1.5">
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
                        className={`w-2 h-2 rotate-45 rounded-[1px] border transition-all ${isWon
                            ? 'shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                          }`}
                      />
                    );
                  })}
                </div>

                <span className="text-slate-300 dark:text-slate-700 text-[8px]">•</span>

                {/* Game Wins (Circles) */}
                <div
                  className="flex items-center gap-1"
                  title={`${gameWins} / ${targetGames} Games Won in Set`}
                >
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
                        className={`w-2 h-2 rounded-full border transition-all ${isWon
                            ? 'shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700'
                          }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-Right: Rank Badge or Winner Badge */}
        {isSetWinner ? (
          <span className="px-2 py-0.5 rounded-lg border text-[11px] font-mono font-black uppercase shrink-0 bg-amber-400 text-slate-950 border-amber-300 shadow-md animate-bounce">
            🏆 SET WINNER
          </span>
        ) : isGameWinner ? (
          <span className="px-2 py-0.5 rounded-lg border text-[10px] font-mono font-black uppercase shrink-0 bg-amber-400 text-slate-950 border-amber-300 shadow-sm animate-pulse">
            👑 GAME WINNER
          </span>
        ) : showRank ? (
          <span
            className={`px-1.5 py-0.5 rounded-md border text-[11px] font-mono font-black uppercase shrink-0 transition-all ${getRankBadgeStyle(
              rank
            )}`}
          >
            {ordinalRank}
          </span>
        ) : null}
      </div>

      {/* Main Center Area: Large Time display */}
      <div className="my-0.5 sm:my-1 text-center">
        <div
          ref={timeRef}
          className={`font-mono text-3xl sm:text-4xl md:text-5xl font-black tracking-tight tabular-nums transition-colors duration-150 ${timeTextColor}`}
        >
          {formattedTime}
        </div>

        {/* Bot Avg & Std Variance OR Host Live Avg & Std Variance */}
        {isBot && botConfig ? (
          <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0">
            ~{(botConfig.averageTimeMs / 1000).toFixed(1)}s (±{(botConfig.stdDevMs / 1000).toFixed(1)}s)
          </div>
        ) : liveStats && liveStats.count > 0 ? (
          <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0">
            ~{(liveStats.averageTimeMs / 1000).toFixed(1)}s (±{(liveStats.stdDevMs / 1000).toFixed(1)}s)
          </div>
        ) : (
          <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0">
            ~--.-s (±-.-s)
          </div>
        )}

        {/* Penalties & Subtitle Alerts */}
        <div className="min-h-[2px] mt-0.5 flex items-center justify-center gap-1 flex-wrap">
          {!isRunning && penalty === 'PLUS_2' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-400 text-[10px] font-mono font-bold">
              +2.00s
            </span>
          )}
          {!isRunning && penalty === 'DNF' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-400 text-[10px] font-mono font-bold">
              DNF
            </span>
          )}
          {!isRunning && isFalseStart && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[9px] font-mono font-semibold">
              Early: +{(falseStartPenaltyMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
