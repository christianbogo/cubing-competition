'use client';

import React from 'react';
import { useTournamentStore } from '@/store/tournamentStore';

export const ScrambleDisplay: React.FC = () => {
  const { currentScramble, isScrambleLoading } = useTournamentStore();

  return (
    <div className="w-full flex items-center justify-center text-center select-none py-1 sm:py-2">
      <p
        className={`font-mono text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider leading-relaxed transition-opacity duration-150 ${
          isScrambleLoading ? 'opacity-40 text-slate-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {currentScramble || "R U R' U' R' F R2 U' R' U' R U R' F'"}
      </p>
    </div>
  );
};
