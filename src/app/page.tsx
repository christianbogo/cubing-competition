'use client';

import React, { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/display/HeaderBar';
import { DragRaceStage } from '@/components/display/DragRaceStage';
import { LeaderboardView } from '@/components/display/LeaderboardView';
import { AdminModal } from '@/components/admin/AdminModal';
import { KeyGuideModal } from '@/components/display/KeyGuideModal';
import { MatchVictoryModal } from '@/components/display/MatchVictoryModal';
import { useKeyboardController } from '@/hooks/useKeyboardController';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { soundEngine } from '@/audio/soundEffects';

export default function CompetitionDisplayPage() {
  // Hook for all multi-key controller listening & state transitions
  useKeyboardController();

  const { isAdminOpen, toggleAdmin, matchWinnerPlayerId, players } = useTournamentStore();
  const { raceState, handleKeyDown, handleKeyUp, stopPlayer } = useTimerStore();
  const [isKeyGuideOpen, setIsKeyGuideOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const activePlayers = players.filter((p) => p.active);

  // Quick manual helper for testing multi-player ready without physical 10 fingers
  const handleTestHoldAll = () => {
    activePlayers.forEach((p) => {
      handleKeyDown(p.id, performance.now(), () => {
        useTournamentStore.getState().startNextGame();
      });
    });
  };

  const handleTestReleaseAll = () => {
    activePlayers.forEach((p) => {
      handleKeyUp(p.id, performance.now());
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Navigation Bar */}
      <HeaderBar
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenAdmin={() => toggleAdmin(true)}
        onOpenKeyGuide={() => setIsKeyGuideOpen(true)}
      />

      {/* Main Arena Content Container */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-4 flex flex-col justify-start items-center transition-all duration-300 ${
          isFullscreen ? 'py-1 gap-4' : 'py-6 gap-6'
        }`}
      >
        {/* Drag Race Stage Starting Lights */}
        <DragRaceStage />

        {/* Dynamic Leaderboard Cards */}
        <LeaderboardView />
      </main>

      {/* Bottom Footer - Hidden in Fullscreen */}
      {!isFullscreen && (
        <footer className="w-full bg-neutral-950/90 border-t border-neutral-900 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none z-20">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Keyboard Controller Active:</span>
            <div className="flex items-center gap-1">
              {activePlayers.map((p) => (
                <span
                  key={p.id}
                  className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-bold text-neutral-300"
                >
                  {p.key.toUpperCase()}: {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Manual Click/Touch Test Bar */}
          <div className="flex items-center gap-2">
            {(raceState === 'IDLE' || raceState === 'FINISHED') && (
              <button
                onMouseDown={handleTestHoldAll}
                onMouseUp={handleTestReleaseAll}
                onTouchStart={handleTestHoldAll}
                onTouchEnd={handleTestReleaseAll}
                className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-[11px] font-bold transition-all active:scale-95 shadow-sm"
              >
                Hold to Ready All (Mouse/Touch)
              </button>
            )}

            {raceState === 'RACING' && (
              <button
                onClick={() => {
                  activePlayers.forEach((p, idx) => {
                    setTimeout(() => {
                      const rank = stopPlayer(p.id, performance.now());
                      if (rank > 0) soundEngine.playFinishChime(rank);
                    }, (idx + 1) * 1200);
                  });
                }}
                className="px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all active:scale-95"
              >
                Stop All Timers
              </button>
            )}

            <button
              onClick={() => setIsKeyGuideOpen(true)}
              className="text-neutral-400 hover:text-white underline underline-offset-4"
            >
              How to Play
            </button>
          </div>
        </footer>
      )}

      {/* High-Density Admin Dashboard Modal */}
      <AdminModal isOpen={isAdminOpen} onClose={() => toggleAdmin(false)} />

      {/* Keyboard Controller Guide Modal */}
      <KeyGuideModal isOpen={isKeyGuideOpen} onClose={() => setIsKeyGuideOpen(false)} />

      {/* Match Victory Grand Celebration Modal */}
      {matchWinnerPlayerId && (
        <MatchVictoryModal onClose={() => useTournamentStore.setState({ matchWinnerPlayerId: null })} />
      )}
    </div>
  );
}
