'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ref, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import Link from 'next/link';
import { database, auth } from '@/lib/firebase';
import { useTimerStore } from '@/store/timerStore';
import { useTournamentStore } from '@/store/tournamentStore';
import { useFirebaseGuest } from '@/hooks/useFirebaseMatch';
import { formatTime } from '@/utils/formatters';
import { ScrambleDisplay } from './ScrambleDisplay';
import { LeaderboardView } from './LeaderboardView';
import { ActivityFeed } from './ActivityFeed';
import { DragRaceStage } from './DragRaceStage';
import { soundEngine } from '@/audio/soundEffects';

import { HeaderBar } from './HeaderBar';
import { MatchOverviewModal } from './MatchOverviewModal';

interface GuestTimerDisplayProps {
  matchId: string;
  slotId: string;
}

export const GuestTimerDisplay: React.FC<GuestTimerDisplayProps> = ({ matchId, slotId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { matchStatus, players, isRoomActive, matchWinnerPlayerId, matchWinnerTeamId, toggleAdmin, settings } = useTournamentStore();
  const { raceState: timerRaceState, scheduledGreenTime, raceStartTime, countdownStage } = useTimerStore();

  const [localTimeMs, setLocalTimeMs] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useFirebaseGuest(matchId, slotId);

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => setIsAuthenticated(true))
      .catch((err) => setError(err.message));
  }, []);

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
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  // Play sound effects for guests
  useEffect(() => {
    if (!settings.soundEnabled) return;
    if (countdownStage > 0 && countdownStage <= 3) {
      soundEngine.playCountdownBeep(countdownStage as 1 | 2 | 3);
    }
  }, [countdownStage, settings.soundEnabled]);

  useEffect(() => {
    if (!settings.soundEnabled) return;
    if (timerRaceState === 'RACING') {
      soundEngine.playGoTone();
    }
  }, [timerRaceState, settings.soundEnabled]);

  useEffect(() => {
    let frame: number;
    const updateTimer = () => {
      if (startTimeRef.current) {
        setLocalTimeMs(Math.max(0, Date.now() - startTimeRef.current));
        frame = requestAnimationFrame(updateTimer);
      }
    };
    
    if (isSolving) {
      frame = requestAnimationFrame(updateTimer);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isSolving]);
  useEffect(() => {
    if (timerRaceState === 'RACING' && raceStartTime) {
      startTimeRef.current = raceStartTime;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSolving(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFinished(false);
    } else if (timerRaceState === 'IDLE' || timerRaceState === 'WAITING_FOR_ALL') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSolving(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFinished(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTimeMs(0);
    }
  }, [timerRaceState, raceStartTime, matchId, slotId]);

  const stateRef = useRef({ timerRaceState, isSolving, matchId, slotId, isReady });
  useEffect(() => {
    stateRef.current = { timerRaceState, isSolving, matchId, slotId, isReady };
  }, [timerRaceState, isSolving, matchId, slotId, isReady]);

  const handleStartReady = useCallback(() => {
    const { timerRaceState: rs, isSolving: sol, matchId: mid, slotId: sid } = stateRef.current;
    if (rs === 'WAITING_FOR_ALL' || rs === 'IDLE' || rs === 'DRAG_COUNTDOWN' || rs === 'FINISHED') {
      setIsReady(true);
      stateRef.current.isReady = true;
      set(ref(database, `matches/${mid}/held/${sid}`), true).catch(err => console.error(err));
    } else if (sol) {
      const finishTime = Date.now();
      setIsSolving(false);
      setIsFinished(true);
      
      if (startTimeRef.current) {
        const finalTime = Math.max(0, finishTime - startTimeRef.current);
        setLocalTimeMs(finalTime);
        
        const solvesRef = ref(database, `matches/${mid}/solves/${sid}`);
        set(solvesRef, {
          rawTimeMs: finalTime,
          penalty: 'NONE',
          falseStartDeltaMs: 0,
          timestamp: Date.now(),
        }).catch(err => console.error("Failed to push time", err));
      }
    }
  }, [database]);

  const handleStopReady = useCallback(() => {
    const { isReady: rdy, timerRaceState: rs, matchId: mid, slotId: sid } = stateRef.current;
    
    // Always sync physical keyup to Firebase and local state
    setIsReady(false);
    stateRef.current.isReady = false;
    set(ref(database, `matches/${mid}/held/${sid}`), false).catch(err => console.error(err));

    if (rdy && rs !== 'RACING') {
      if (rs === 'DRAG_COUNTDOWN') {
        const solvesRef = ref(database, `matches/${mid}/solves/${sid}`);
        set(solvesRef, {
          rawTimeMs: 0,
          penalty: 'DNF',
          falseStartDeltaMs: 1000,
          timestamp: Date.now(),
        });
        setIsFinished(true);
      }
    }
  }, [database]);

  // Keyboard Event Listeners for Spacebar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (e.code === 'Space' && !e.repeat) {
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          const val = (target as HTMLInputElement).value;
          if (val === '') {
            target.blur();
            e.preventDefault();
            handleStartReady();
          }
          return;
        }

        e.preventDefault();
        handleStartReady();
      } else {
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
      }
    };
    
    const onKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleStopReady();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleStartReady, handleStopReady]);

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-4 text-slate-500">Connecting to arena...</div>;
  }

  if (!isRoomActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4 max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black text-red-500 uppercase font-mono">Match Ended</h1>
          <p className="text-slate-500 text-sm mb-6">
            The linked match no longer exists or was cancelled by the host. Please ask the host for a new link if the competition is still ongoing.
          </p>
          <div className="flex flex-col gap-3 mt-4">
            <Link 
              href="/"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 block text-center"
            >
              Go to Home Screen
            </Link>
            <Link 
              href="/join"
              className="w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 block text-center"
            >
              Join Another Match
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (matchStatus === 'SETUP' || !hasJoinedLobby) {
    const me = players.find(p => p.id === slotId);
    const host = players.find(p => p.role === 'HOST');
    const bots = players.filter(p => p.role === 'BOT');

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4 w-full max-w-lg bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight">
            Welcome, <span className="text-amber-500">{me?.name || 'Player'}</span>!
          </h1>
          <p className="text-slate-500 text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
            {matchStatus === 'SETUP' 
              ? <span>Waiting for {host?.name ? <span className="font-bold text-slate-700 dark:text-slate-300">{host.name}</span> : 'the host'} to start the arena.</span>
              : <span className="text-amber-500 font-bold">The match is in progress!</span>}
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 text-left space-y-3 font-mono text-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Match Type</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{settings.tournamentMode === 'TEAMS' ? 'Team VS' : 'Free For All'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Structure</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">Best of {settings.targetSets} Sets ({settings.targetGames} Games/Set)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Scoring</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{settings.scoringMode === 'DIFFERENTIAL' ? 'Differential' : 'Rank Based'}</span>
            </div>
            {bots.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-start">
                <span className="text-slate-400">Bots</span>
                <div className="flex flex-col items-end gap-1">
                  {bots.map(b => (
                    <span key={b.id} className="font-bold text-slate-700 dark:text-slate-300 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {b.name} ({b.botConfig?.averageTimeMs ? (b.botConfig.averageTimeMs / 1000).toFixed(1) : '5.0'}s)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-4 flex flex-col items-center gap-3">
             {!hasJoinedLobby ? (
               <button
                 onClick={() => {
                   // Play a silent tone to initialize and unblock the Web Audio API context
                   soundEngine.playTone(0, 'sine', 0.01, false, 0);
                   setHasJoinedLobby(true);
                 }}
                 className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
               >
                 {matchStatus === 'SETUP' ? 'Join Lobby' : 'Join Match'}
               </button>
             ) : (
               <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-center text-sm font-mono rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                 You are in the lobby!
               </div>
             )}
             {matchStatus === 'SETUP' && (
               <span className="text-xs text-slate-400 font-mono">Waiting for host to start...</span>
             )}
          </div>
        </div>
      </div>
    );
  }

  const getStageTintClass = () => {
    if (timerRaceState === 'LOCKED_IN') return 'bg-red-500/10 dark:bg-red-500/15 shadow-[inset_0_0_120px_rgba(239,68,68,0.25)]';
    if (timerRaceState === 'RACING') return 'bg-emerald-500/10 dark:bg-emerald-500/15 shadow-[inset_0_0_120px_rgba(16,185,129,0.2)]';
    if (isReady && timerRaceState !== 'FINISHED') return 'bg-amber-500/10 dark:bg-amber-500/15 shadow-[inset_0_0_120px_rgba(245,158,11,0.2)]';
    return 'bg-transparent';
  };

  return (
    <div 
      className={`relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={`pointer-events-none fixed inset-0 z-10 transition-all duration-300 ${getStageTintClass()}`} />

      {/* Top Navigation Bar */}
      <HeaderBar
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenOverview={() => setIsOverviewOpen(true)}
      />

      <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-between px-3 sm:px-6 py-2 sm:py-4 gap-4 sm:gap-6 z-20">
        <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-start items-center gap-4 transition-all duration-300">
          <div className="w-full flex justify-center shrink-0 pointer-events-none">
            <ScrambleDisplay />
          </div>

          <div className="w-full flex justify-center shrink-0 pointer-events-none">
            <DragRaceStage />
          </div>


          <div className="w-full flex justify-center pt-2 pointer-events-none">
            <LeaderboardView />
          </div>
        </main>

        <div className="pointer-events-auto">
          <ActivityFeed />
        </div>
      </div>

      <MatchOverviewModal
        isOpen={isOverviewOpen || !!matchWinnerPlayerId || !!matchWinnerTeamId}
        onClose={() => setIsOverviewOpen(false)}
      />
    </div>
  );
};
