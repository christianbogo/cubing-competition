'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  Minimize2,
  Activity,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { soundEngine } from '@/audio/soundEffects';
import { CubeOnlineLogo } from './CubeOnlineLogo';
import { HeaderAuth } from './HeaderAuth';
import { database } from '@/lib/firebase';
import { ref, remove } from 'firebase/database';

interface HeaderBarProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenAdmin?: () => void;
  onOpenOverview?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isFullscreen: controlledIsFullscreen,
  onToggleFullscreen: controlledOnToggleFullscreen,
  onOpenAdmin,
  onOpenOverview,
}) => {
  const {
    settings,
    updateSettings,
    matchStatus,
    isActivityFeedOpen,
    toggleActivityFeed,
    resetTournament,
    players,
    localPlayerId,
  } = useTournamentStore();
  const { resetForNewRace } = useTimerStore();
  const router = useRouter();

  const [internalIsFullscreen, setInternalIsFullscreen] = useState(false);

  // Manage internal fullscreen state if not controlled from parent
  useEffect(() => {
    const handleFullscreenChange = () => {
      setInternalIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync sound engine enabled state with settings
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const isFullscreen = controlledIsFullscreen !== undefined ? controlledIsFullscreen : internalIsFullscreen;

  const handleToggleFullscreen = () => {
    if (controlledOnToggleFullscreen) {
      controlledOnToggleFullscreen();
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleSoundToggle = () => {
    const nextSound = !settings.soundEnabled;
    updateSettings({ soundEnabled: nextSound });
    soundEngine.setEnabled(nextSound);
    if (nextSound) {
      soundEngine.playTone(659.25, 'sine', 0.1, true, 0.4); // E5 pleasant tone
    }
  };

  const isHost = players.find((p) => p.id === localPlayerId)?.role === 'HOST';

  const handleLogoClick = () => {
    React.startTransition(() => {
      if (matchStatus === 'IN_PROGRESS') {
        const confirmLeave = window.confirm('Are you sure you want to cancel the match?');
        if (!confirmLeave) return;

        const currentMatchId = useTournamentStore.getState().matchId;
        if (isHost && currentMatchId && currentMatchId !== 'local') {
          remove(ref(database, `matches/${currentMatchId}`)).catch(console.error);
        }

        resetForNewRace();
        resetTournament();
      }

      router.push('/');
    });
  };

  return (
    <header
      className={`w-full px-4 sm:px-6 transition-all duration-200 flex items-center justify-between gap-3 select-none z-30 ${
        isFullscreen
          ? 'py-2'
          : 'py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0'
      }`}
    >
      {/* Brand Identity / Logo with responsive non-wrapping title */}
      <button
        type="button"
        onClick={handleLogoClick}
        className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg text-left"
      >
        <CubeOnlineLogo className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-amber-500" />
        <div className="whitespace-nowrap font-mono font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100 uppercase text-left">
          <span className="hidden sm:inline">Cube Online </span>
          <span className="inline sm:hidden">CO </span>
          <span className="text-amber-500 font-extrabold">Arena</span>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Match Overview Button - Always visible in match */}
        {matchStatus === 'IN_PROGRESS' && onOpenOverview && (
          <button
            type="button"
            onClick={onOpenOverview}
            title="Show Full Match Overview & Solve Matrix"
            className="flex items-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-800 text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <span className="hidden md:inline">Match Overview</span>
            <Trophy className="w-3.5 h-3.5 inline md:hidden" />
          </button>
        )}

        {/* Sound Toggle Button - Always visible & active */}
        {!isFullscreen && (
          <button
            type="button"
            onClick={handleSoundToggle}
            title={settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className={`p-2 rounded-xl border text-xs font-mono transition-all active:scale-95 shadow-sm ${
              settings.soundEnabled
                ? 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-300/80 dark:border-slate-800 text-slate-400 dark:text-slate-600'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Activity Feed Toggle Button (only when in match) */}
        {matchStatus === 'IN_PROGRESS' && (
          <button
            type="button"
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
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono transition-all active:scale-95 shadow-sm"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Lowkey Match Options Button */}
        {matchStatus === 'IN_PROGRESS' && onOpenAdmin && isHost && (
          <button
            type="button"
            onClick={onOpenAdmin}
            title="Match Options"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono transition-all active:scale-95 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Account Settings & Auth (contains Theme Toggle) - Hidden in Fullscreen Mode */}
        {!isFullscreen && <HeaderAuth />}
      </div>
    </header>
  );
};
