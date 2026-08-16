import React from 'react';
import { useTimerStore } from '@/store/timerStore';

export const DragRaceStage: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { raceState, countdownStage } = useTimerStore();

  // Drag light states
  const isRedActive = raceState === 'LOCKED_IN' || raceState === 'DRAG_COUNTDOWN';
  const isYellow1 = raceState === 'DRAG_COUNTDOWN' && countdownStage >= 1;
  const isYellow2 = raceState === 'DRAG_COUNTDOWN' && countdownStage >= 2;
  const isYellow3 = raceState === 'DRAG_COUNTDOWN' && countdownStage >= 3;
  const isGreenActive = raceState === 'RACING';

  return (
    <div className={`w-full flex items-center justify-center select-none py-1 sm:py-2 ${className}`}>
      {/* Starting Lights sitting directly on the page without card background/border */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Stage Red */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isRedActive
                ? 'bg-red-500 border-red-200 shadow-xl shadow-red-500/80 scale-110'
                : 'bg-red-100 dark:bg-red-950/30 border-red-200 dark:border-red-950/60 text-transparent'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isRedActive ? 'bg-white shadow-sm' : 'bg-red-200 dark:bg-red-900/30'
              }`}
            />
          </div>
        </div>

        {/* Yellow Stage 1 */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isYellow1
                ? 'bg-amber-400 border-amber-200 shadow-xl shadow-amber-400/80 scale-110'
                : 'bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-950/60 text-transparent'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isYellow1 ? 'bg-white shadow-sm' : 'bg-amber-200 dark:bg-amber-900/30'
              }`}
            />
          </div>
        </div>

        {/* Yellow Stage 2 */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isYellow2
                ? 'bg-amber-400 border-amber-200 shadow-xl shadow-amber-400/80 scale-110'
                : 'bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-950/60 text-transparent'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isYellow2 ? 'bg-white shadow-sm' : 'bg-amber-200 dark:bg-amber-900/30'
              }`}
            />
          </div>
        </div>

        {/* Yellow Stage 3 */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isYellow3
                ? 'bg-amber-400 border-amber-200 shadow-xl shadow-amber-400/80 scale-110'
                : 'bg-amber-100 dark:bg-amber-950/30 border-amber-200 dark:border-amber-950/60 text-transparent'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isYellow3 ? 'bg-white shadow-sm' : 'bg-amber-200 dark:bg-amber-900/30'
              }`}
            />
          </div>
        </div>

        {/* Green Launch */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isGreenActive
                ? 'bg-emerald-400 border-emerald-100 shadow-2xl shadow-emerald-400/90 scale-125 animate-pulse'
                : 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-950/60 text-transparent'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full ${
                isGreenActive ? 'bg-white shadow-sm' : 'bg-emerald-200 dark:bg-emerald-900/30'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
