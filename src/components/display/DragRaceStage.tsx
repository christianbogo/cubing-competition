import React from 'react';
import { useTimerStore } from '@/store/timerStore';

export const DragRaceStage: React.FC = () => {
  const { raceState, countdownStage } = useTimerStore();

  // Drag light states
  const isRedActive = raceState === 'LOCKED_IN' || raceState === 'DRAG_COUNTDOWN';
  const isYellow1 = raceState === 'DRAG_COUNTDOWN' && countdownStage >= 1;
  const isYellow2 = raceState === 'DRAG_COUNTDOWN' && countdownStage >= 2;
  const isYellow3 = raceState === 'DRAG_COUNTDOWN' && countdownStage >= 3;
  const isGreenActive = raceState === 'RACING';

  return (
    <div className="w-full py-2 flex items-center justify-center select-none">
      {/* Starting Lights (Stage Red, 3 Yellows, Green Launch) */}
      <div className="flex items-center gap-4 md:gap-6 bg-neutral-950/90 border border-neutral-800/80 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-md">
        {/* Stage Red */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isRedActive
                ? 'bg-red-500 border-red-200 shadow-xl shadow-red-500/80 scale-110'
                : 'bg-red-950/30 border-red-950 text-transparent'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${isRedActive ? 'bg-white shadow-sm' : 'bg-red-900/30'}`} />
          </div>
        </div>

        {/* Yellow Stage 1 */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isYellow1
                ? 'bg-amber-400 border-amber-200 shadow-xl shadow-amber-400/80 scale-110'
                : 'bg-amber-950/30 border-amber-950 text-transparent'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${isYellow1 ? 'bg-white shadow-sm' : 'bg-amber-900/30'}`} />
          </div>
        </div>

        {/* Yellow Stage 2 */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isYellow2
                ? 'bg-amber-400 border-amber-200 shadow-xl shadow-amber-400/80 scale-110'
                : 'bg-amber-950/30 border-amber-950 text-transparent'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${isYellow2 ? 'bg-white shadow-sm' : 'bg-amber-900/30'}`} />
          </div>
        </div>

        {/* Yellow Stage 3 */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 md:w-12 md:h-12 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isYellow3
                ? 'bg-amber-400 border-amber-200 shadow-xl shadow-amber-400/80 scale-110'
                : 'bg-amber-950/30 border-amber-950 text-transparent'
            }`}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${isYellow3 ? 'bg-white shadow-sm' : 'bg-amber-900/30'}`} />
          </div>
        </div>

        {/* Green Launch */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
              isGreenActive
                ? 'bg-emerald-400 border-emerald-100 shadow-2xl shadow-emerald-400/90 scale-125 animate-pulse'
                : 'bg-emerald-950/30 border-emerald-950 text-transparent'
            }`}
          >
            <div className={`w-4 h-4 rounded-full ${isGreenActive ? 'bg-white shadow-sm' : 'bg-emerald-900/30'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
