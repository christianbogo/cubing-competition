'use client';

import React from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Keyboard,
  Maximize2,
  Minimize2,
  Activity,
  Trophy,
} from 'lucide-react';
import { useTournamentStore } from '@/store/tournamentStore';
import { CubeOnlineLogo } from './CubeOnlineLogo';
import { ThemeToggle } from './ThemeToggle';

interface HeaderBarProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenAdmin: () => void;
  onOpenKeyGuide: () => void;
  onOpenOverview: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onOpenAdmin,
  onOpenKeyGuide,
  onOpenOverview,
}) => {
  const {
    settings,
    updateSettings,
    matchStatus,
    isActivityFeedOpen,
    toggleActivityFeed,
  } = useTournamentStore();

  return (
    <header
      className={`w-full px-4 sm:px-6 transition-all duration-200 flex items-center justify-between gap-3 select-none z-30 ${
        isFullscreen
          ? 'py-2'
          : 'py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md'
      }`}
    >
      {/* Brand Identity / Logo with responsive non-wrapping title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <CubeOnlineLogo className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
        <div className="whitespace-nowrap font-mono font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 uppercase">
          <span className="hidden sm:inline">Cube Online </span>
          <span className="inline sm:hidden">CO </span>
          <span className="text-amber-500 font-extrabold">Arena</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Theme Switcher - Hidden in Fullscreen Mode */}
        {!isFullscreen && <ThemeToggle />}

        {/* Hide Keybinds, Volume, and Feed toggle in Fullscreen mode */}
        {!isFullscreen && (
          <>
            {matchStatus === 'IN_PROGRESS' && (
              <>
                {/* Match Overview Button */}
                <button
                  onClick={onOpenOverview}
                  title="Show Full Match Overview & Solve Matrix"
                  className="flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-800 text-xs font-mono transition-all active:scale-95 shadow-sm"
                >
                  <span className="hidden md:inline">Match Overview</span>
                </button>

                {/* Key Guide Button */}
                <button
                  onClick={onOpenKeyGuide}
                  title="Show keyboard controller mapping"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-800 text-xs font-mono transition-all active:scale-95 shadow-sm"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Keybinds</span>
                </button>
              </>
            )}

            {/* Sound Toggle Button */}
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              title={settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className={`p-2 rounded-xl border text-xs font-mono transition-all active:scale-95 shadow-sm ${
                settings.soundEnabled
                  ? 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-300/80 dark:border-slate-800 text-slate-400 dark:text-slate-600'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </>
        )}

        {/* Activity Feed Toggle Button */}
        {matchStatus === 'IN_PROGRESS' && (
          <button
            onClick={() => toggleActivityFeed()}
            title={isActivityFeedOpen ? 'Hide Activity Feed' : 'Show Activity Feed'}
            className={`p-2 rounded-xl border text-xs font-mono transition-all active:scale-95 shadow-sm ${
              isActivityFeedOpen
                ? 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-300/80 dark:border-slate-800 text-slate-400 dark:text-slate-500'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Fullscreen Toggle Button */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono transition-all active:scale-95 shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Lowkey Match Options Button */}
        {matchStatus === 'IN_PROGRESS' && (
          <button
            onClick={onOpenAdmin}
            title="Match Options"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
