'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { HeaderBar } from '@/components/display/HeaderBar';
import { ScrambleDisplay } from '@/components/display/ScrambleDisplay';
import { DragRaceStage } from '@/components/display/DragRaceStage';
import { LeaderboardView } from '@/components/display/LeaderboardView';
import { ActivityFeed } from '@/components/display/ActivityFeed';
import { AdminModal } from '@/components/admin/AdminModal';
import { MatchOverviewModal } from '@/components/display/MatchOverviewModal';
import { useKeyboardController } from '@/hooks/useKeyboardController';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { useFirebaseHost, useFirebaseGuest } from '@/hooks/useFirebaseMatch';
import { GuestTimerDisplay } from '@/components/display/GuestTimerDisplay';

function HostArenaContainer({ roomId }: { roomId: string }) {
  // Hook for all multi-key controller listening & state transitions
  useKeyboardController();
  
  // Hook for synchronizing match state to Firebase Realtime Database
  useFirebaseHost();

  const { isAdminOpen, toggleAdmin, matchWinnerPlayerId, matchWinnerTeamId, matchStatus, setLocalPlayerId, players, localPlayerId } = useTournamentStore();
  const raceState = useTimerStore((s) => s.raceState);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const host = players.find(p => p.role === 'HOST') || players[0];
    if (host) setLocalPlayerId(host.id);
  }, [players, setLocalPlayerId]);

  useEffect(() => {
    const isHost = localPlayerId && players.find(p => p.id === localPlayerId)?.role === 'HOST';
    if (matchStatus === 'SETUP' && isHost) {
      router.push('/host');
    }
  }, [matchStatus, router, localPlayerId, players]);

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

  const localPlayerIsHeld = useTimerStore((s) => {
    if (!localPlayerId) return false;
    return s.players[localPlayerId]?.isHeld || false;
  });

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
    if (localPlayerIsHeld && raceState !== 'FINISHED') {
      return 'bg-amber-500/10 dark:bg-amber-500/10 shadow-[inset_0_0_120px_rgba(245,158,11,0.2)]';
    }
    return 'bg-transparent';
  };

  if (matchStatus === 'SETUP') {
    return null;
  }

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
        onOpenOverview={() => setIsOverviewOpen(true)}
      />

      {/* Main Content Area */}
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

      {/* Match Options & Operations Modal */}
      <AdminModal isOpen={isAdminOpen} onClose={() => toggleAdmin(false)} />

      {/* Fullscreen Match Overview & Solve Matrix Modal */}
      <MatchOverviewModal
        isOpen={isOverviewOpen || !!matchWinnerPlayerId || !!matchWinnerTeamId}
        onClose={() => setIsOverviewOpen(false)}
      />
    </div>
  );
}

function GuestArenaContainer({ roomId, positionStr }: { roomId: string; positionStr: string }) {
  const { players, setLocalPlayerId, localPlayerId } = useTournamentStore();
  
  // We don't have slotId yet, but GuestTimerDisplay calls useFirebaseGuest itself 
  // with slotId once rendered. But to GET the players array, we need to sync first!
  // So we sync state here, and presence is established once GuestTimerDisplay mounts.
  useFirebaseGuest(roomId, localPlayerId || undefined);

  useEffect(() => {
    if (players.length > 0) {
      const pos = parseInt(positionStr, 10);
      if (!isNaN(pos) && pos > 0 && pos <= players.length) {
        setLocalPlayerId(players[pos - 1].id);
      }
    }
  }, [positionStr, players, setLocalPlayerId]);

  if (!localPlayerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4 max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase font-mono">Connecting...</h1>
          <p className="text-slate-500 text-sm">Synchronizing match data...</p>
          <div className="pt-4 flex justify-center">
             <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return <GuestTimerDisplay matchId={roomId} slotId={localPlayerId} />;
}

export default function ArenaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const positionStr = searchParams.get('position');
  
  const isGuestUrl = !!positionStr;

  if (isGuestUrl) {
    return <GuestArenaContainer roomId={roomId} positionStr={positionStr} />;
  }

  return <HostArenaContainer roomId={roomId} />;
}
