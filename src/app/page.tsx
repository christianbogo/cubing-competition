'use client';

import React, { useState, useEffect } from 'react';
import { HeaderBar } from '@/components/display/HeaderBar';
import { ScrambleDisplay } from '@/components/display/ScrambleDisplay';
import { DragRaceStage } from '@/components/display/DragRaceStage';
import { LeaderboardView } from '@/components/display/LeaderboardView';
import { ActivityFeed } from '@/components/display/ActivityFeed';
import { MatchSetupWizard } from '@/components/setup/MatchSetupWizard';
import { AdminModal } from '@/components/admin/AdminModal';
import { KeyGuideModal } from '@/components/display/KeyGuideModal';
import { MatchOverviewModal } from '@/components/display/MatchOverviewModal';
import { useKeyboardController } from '@/hooks/useKeyboardController';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { useFirebaseHost } from '@/hooks/useFirebaseMatch';

export default function CompetitionDisplayPage() {
  // Hook for all multi-key controller listening & state transitions
  useKeyboardController();
  
  // Hook for synchronizing match state to Firebase Realtime Database
  useFirebaseHost();

  const { isAdminOpen, toggleAdmin, matchWinnerPlayerId, matchWinnerTeamId, matchStatus } = useTournamentStore();
  const raceState = useTimerStore((s) => s.raceState);
  const [isKeyGuideOpen, setIsKeyGuideOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
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

  // Determine full-screen stage tint
  const getStageTintClass = () => {
    if (raceState === 'LOCKED_IN') {
      return 'bg-red-500/10 dark:bg-red-500/15 shadow-[inset_0_0_120px_rgba(239,68,68,0.25)]';
    }
    if (raceState === 'DRAG_COUNTDOWN') {
      return 'bg-amber-400/10 dark:bg-amber-400/15 shadow-[inset_0_0_120px_rgba(251,191,36,0.25)]';
    }
    if (raceState === 'RACING') {
      return 'bg-emerald-500/10 dark:bg-emerald-500/15 shadow-[inset_0_0_120px_rgba(16,185,129,0.2)]';
    }
    return 'bg-transparent';
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200">
      {/* Full-Screen Ambient Stage Tint Overlay */}
      <div
        className={`pointer-events-none fixed inset-0 z-10 transition-all duration-300 ${getStageTintClass()}`}
      />

      {/* Top Navigation Bar */}
      <HeaderBar
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenAdmin={() => toggleAdmin(true)}
        onOpenKeyGuide={() => setIsKeyGuideOpen(true)}
        onOpenOverview={() => setIsOverviewOpen(true)}
      />

      {/* Main Content Area */}
      {matchStatus === 'SETUP' ? (
        <main className="flex-1 w-full flex flex-col items-center justify-center py-6 z-20">
          <MatchSetupWizard />
        </main>
      ) : (
        <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-between px-3 sm:px-6 py-2 sm:py-4 gap-4 sm:gap-6 z-20">
          {/* Main Competition Arena (Left / Center) */}
          <main
            className={`flex-1 w-full max-w-6xl mx-auto flex flex-col justify-start items-center transition-all duration-300 ${
              isFullscreen ? 'gap-2' : 'gap-4'
            }`}
          >
            {/* 1. Large Scramble Sitting Directly on Screen */}
            <div className="w-full flex justify-center shrink-0">
              <ScrambleDisplay />
            </div>

            {/* 2. Drag Race Starting Lights Directly Below Scramble */}
            <div className="w-full flex justify-center shrink-0">
              <DragRaceStage />
            </div>

            {/* 3. Player Leaderboard Cards (Natural Height) */}
            <div className="w-full flex justify-center pt-2">
              <LeaderboardView />
            </div>
          </main>

          {/* 4. Activity Feed along the far right (Collapsible) */}
          <ActivityFeed />
        </div>
      )}

      {/* Match Options & Operations Modal */}
      <AdminModal isOpen={isAdminOpen} onClose={() => toggleAdmin(false)} />

      {/* Keyboard Controller Guide Modal */}
      <KeyGuideModal isOpen={isKeyGuideOpen} onClose={() => setIsKeyGuideOpen(false)} />

      {/* Fullscreen Match Overview & Solve Matrix Modal */}
      <MatchOverviewModal
        isOpen={isOverviewOpen || !!matchWinnerPlayerId || !!matchWinnerTeamId}
        onClose={() => setIsOverviewOpen(false)}
      />
    </div>
  );
}
