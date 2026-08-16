'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ref, set } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { database, auth } from '@/lib/firebase';
import { useTimerStore } from '@/store/timerStore';
import { useTournamentStore } from '@/store/tournamentStore';
import { useFirebaseGuest } from '@/hooks/useFirebaseMatch';
import { formatTime } from '@/utils/formatters';
import { ScrambleDisplay } from './ScrambleDisplay';
import { LeaderboardView } from './LeaderboardView';
import { ActivityFeed } from './ActivityFeed';
import { DragRaceStage } from './DragRaceStage';

interface GuestTimerDisplayProps {
  matchId: string;
  slotId: string;
}

export const GuestTimerDisplay: React.FC<GuestTimerDisplayProps> = ({ matchId, slotId }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { matchStatus, players, isRoomActive } = useTournamentStore();
  const { raceState: timerRaceState, scheduledGreenTime } = useTimerStore();

  const [localTimeMs, setLocalTimeMs] = useState(0);
  const [isSolving, setIsSolving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useFirebaseGuest(matchId, slotId);

  useEffect(() => {
    signInAnonymously(auth)
      .then(() => setIsAuthenticated(true))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    let frame: number;
    const updateTimer = () => {
      if (startTimeRef.current) {
        setLocalTimeMs(Math.max(0, performance.now() - startTimeRef.current));
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
    if (timerRaceState === 'RACING' && scheduledGreenTime) {
      startTimeRef.current = performance.now();
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReady(false);
    }
  }, [timerRaceState, scheduledGreenTime]);

  const handleStartReady = useCallback(() => {
    if (timerRaceState === 'WAITING_FOR_ALL' || timerRaceState === 'DRAG_COUNTDOWN') {
      setIsReady(true);
    } else if (isSolving) {
      const finishTime = performance.now();
      setIsSolving(false);
      setIsFinished(true);
      
      if (startTimeRef.current) {
        const finalTime = Math.max(0, finishTime - startTimeRef.current);
        setLocalTimeMs(finalTime);
        
        const solvesRef = ref(database, `matches/${matchId}/solves/${slotId}`);
        set(solvesRef, {
          rawTimeMs: finalTime,
          penalty: 'NONE',
          falseStartDeltaMs: 0,
          timestamp: Date.now(),
        }).catch(err => console.error("Failed to push time", err));
      }
    }
  }, [timerRaceState, isSolving, matchId, slotId]);

  const handleStopReady = useCallback(() => {
    if (isReady && timerRaceState !== 'RACING') {
      setIsReady(false);
      if (timerRaceState === 'DRAG_COUNTDOWN') {
        const solvesRef = ref(database, `matches/${matchId}/solves/${slotId}`);
        set(solvesRef, {
          rawTimeMs: 0,
          penalty: 'DNF',
          falseStartDeltaMs: 1000,
          timestamp: Date.now(),
        });
        setIsFinished(true);
      }
    }
  }, [isReady, timerRaceState, matchId, slotId]);

  // Keyboard Event Listeners for Spacebar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        handleStartReady();
      }
    };
    
    const onKeyUp = (e: KeyboardEvent) => {
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
          <p className="text-slate-500 text-sm">
            The linked match no longer exists or was cancelled by the host. Please ask the host for a new link if the competition is still ongoing.
          </p>
        </div>
      </div>
    );
  }

  if (matchStatus === 'SETUP') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4 max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase font-mono">Lobby</h1>
          <p className="text-slate-500 text-sm">
            Waiting for the host to configure the match and start the arena. You&apos;ll be pulled in automatically!
          </p>
          <div className="pt-4 flex justify-center">
             <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStageTintClass = () => {
    if (timerRaceState === 'LOCKED_IN') return 'bg-red-500/10 dark:bg-red-500/15 shadow-[inset_0_0_120px_rgba(239,68,68,0.25)]';
    if (timerRaceState === 'DRAG_COUNTDOWN') return 'bg-amber-400/10 dark:bg-amber-400/15 shadow-[inset_0_0_120px_rgba(251,191,36,0.25)]';
    if (timerRaceState === 'RACING') return 'bg-emerald-500/10 dark:bg-emerald-500/15 shadow-[inset_0_0_120px_rgba(16,185,129,0.2)]';
    return 'bg-transparent';
  };

  return (
    <div 
      className={`relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 transition-colors duration-200 ${isReady && timerRaceState !== 'RACING' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
      onPointerDown={handleStartReady}
      onPointerUp={handleStopReady}
      onPointerLeave={handleStopReady}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={`pointer-events-none fixed inset-0 z-10 transition-all duration-300 ${getStageTintClass()}`} />

      {/* Simplified Header for Guest */}
      <header className="w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 z-20 flex justify-between items-center">
         <div className="font-black uppercase tracking-widest text-sm font-mono flex items-center gap-2">
            <span className="text-amber-500">CUBE</span>
            <span className="text-slate-400">ARENA</span>
         </div>
         <div className="text-xs font-mono text-slate-500">
           Playing as <span className="font-bold text-slate-700 dark:text-slate-300">{players.find(p => p.id === slotId)?.name || `Slot #${slotId}`}</span>
         </div>
      </header>

      <div className="flex-1 w-full flex flex-col lg:flex-row items-stretch justify-between px-3 sm:px-6 py-2 sm:py-4 gap-4 sm:gap-6 z-20">
        <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-start items-center gap-4 transition-all duration-300">
          <div className="w-full flex justify-center shrink-0 pointer-events-none">
            <ScrambleDisplay />
          </div>

          <div className="w-full flex justify-center shrink-0 pointer-events-none">
            <DragRaceStage />
          </div>

          {/* Guest Personal Timer Box */}
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col items-center justify-center my-4 pointer-events-none">
             <div className={`text-6xl sm:text-8xl font-mono font-black tabular-nums tracking-tighter ${
                isReady ? 'text-amber-500' :
                isFinished ? 'text-slate-900 dark:text-white' :
                isSolving ? 'text-emerald-500' :
                'text-slate-300 dark:text-slate-700'
              }`}>
                {formatTime(localTimeMs)}
              </div>
              {!isSolving && !isFinished && (
                 <p className="mt-4 text-slate-400 font-mono text-sm animate-pulse text-center">
                   Hold SPACE or tap screen when host starts countdown
                 </p>
              )}
              {isFinished && (
                 <p className="mt-4 text-emerald-500 font-bold font-mono text-sm text-center">
                   Time submitted! Waiting for next round...
                 </p>
              )}
          </div>

          <div className="w-full flex justify-center pt-2 pointer-events-none">
            <LeaderboardView />
          </div>
        </main>

        <div className="pointer-events-none">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
