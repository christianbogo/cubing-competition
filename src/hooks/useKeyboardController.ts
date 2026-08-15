import { useEffect, useRef, useMemo } from 'react';
import { soundEngine } from '@/audio/soundEffects';
import { useTimerStore } from '@/store/timerStore';
import { useTournamentStore } from '@/store/tournamentStore';

export function useKeyboardController() {
  const { players, settings, recordCompletedGame, isAdminOpen } = useTournamentStore();
  const raceState = useTimerStore((s) => s.raceState);
  const timerPlayers = useTimerStore((s) => s.players);
  const initPlayers = useTimerStore((s) => s.initPlayers);
  const setRaceState = useTimerStore((s) => s.setRaceState);
  const setCountdownStage = useTimerStore((s) => s.setCountdownStage);
  const handleKeyDown = useTimerStore((s) => s.handleKeyDown);
  const handleKeyUp = useTimerStore((s) => s.handleKeyUp);
  const startRace = useTimerStore((s) => s.startRace);
  const stopPlayer = useTimerStore((s) => s.stopPlayer);
  const updateTimerFrame = useTimerStore((s) => s.updateTimerFrame);

  const activePlayers = useMemo(() => players.filter((p) => p.active), [players]);
  const activePlayerIds = useMemo(() => activePlayers.map((p) => p.id), [activePlayers]);
  const activePlayerIdsKey = useMemo(() => activePlayerIds.join(','), [activePlayerIds]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const activePlayersRef = useRef(activePlayers);
  activePlayersRef.current = activePlayers;

  const activePlayerIdsRef = useRef(activePlayerIds);
  activePlayerIdsRef.current = activePlayerIds;

  const isAdminOpenRef = useRef(isAdminOpen);
  isAdminOpenRef.current = isAdminOpen;

  // Sync sound settings
  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
    soundEngine.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Initialize timer players when active players change
  useEffect(() => {
    initPlayers(activePlayerIds);
  }, [activePlayerIdsKey, initPlayers]);

  // High-frequency 60fps animation frame loop for running timers
  useEffect(() => {
    let rafId: number;
    const loop = () => {
      updateTimerFrame(performance.now());
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [updateTimerFrame]);

  // Check whether all active players are currently holding their keys
  const allHeld = useMemo(() => {
    return (
      activePlayerIds.length > 0 &&
      activePlayerIds.every((id) => timerPlayers[id]?.isHeld)
    );
  }, [timerPlayers, activePlayerIds]);

  // Lock-in timer ref
  const lockInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for continuous hold across all active players
  useEffect(() => {
    if (isAdminOpenRef.current) return;
    if (raceState !== 'WAITING_FOR_ALL' && raceState !== 'IDLE') return;

    if (allHeld) {
      if (!lockInTimeoutRef.current) {
        lockInTimeoutRef.current = setTimeout(() => {
          const checkPlayers = useTimerStore.getState().players;
          const stillAllHeld = activePlayerIdsRef.current.every((id) => checkPlayers[id]?.isHeld);

          if (stillAllHeld) {
            const now = performance.now();
            const stageInterval = settingsRef.current.countdownStageIntervalMs;
            const randomPause = 600 + Math.random() * 1200;
            const targetGreen = now + 350 + stageInterval * 2 + randomPause;

            useTimerStore.setState({
              scheduledGreenTime: targetGreen,
              countdownStartTime: now + 350,
            });

            setRaceState('LOCKED_IN');
            soundEngine.playLockIn();

            setTimeout(() => {
              setRaceState('DRAG_COUNTDOWN');
            }, 350);
          }
          lockInTimeoutRef.current = null;
        }, settingsRef.current.lockInDurationMs);
      }
    } else {
      if (lockInTimeoutRef.current) {
        clearTimeout(lockInTimeoutRef.current);
        lockInTimeoutRef.current = null;
      }
    }

    return () => {
      if (lockInTimeoutRef.current) {
        clearTimeout(lockInTimeoutRef.current);
        lockInTimeoutRef.current = null;
      }
    };
  }, [allHeld, raceState, setRaceState]);

  // Dedicated Drag Race Countdown Runner with RANDOMIZED PAUSE before Green
  useEffect(() => {
    if (raceState !== 'DRAG_COUNTDOWN') return;

    const startTime = performance.now();
    const stageInterval = settingsRef.current.countdownStageIntervalMs; // default 500ms
    const randomPauseAfterStage3 = 600 + Math.random() * 1200;
    const totalDurationBeforeGreen = stageInterval * 2 + randomPauseAfterStage3;
    const scheduledGreen = startTime + totalDurationBeforeGreen;

    useTimerStore.setState({
      countdownStartTime: startTime,
      scheduledGreenTime: scheduledGreen,
    });

    // Stage 1 Yellow (immediate)
    setCountdownStage(1);
    soundEngine.playCountdownBeep(1);

    // Stage 2 Yellow (at stageInterval)
    const timer2 = setTimeout(() => {
      setCountdownStage(2);
      soundEngine.playCountdownBeep(2);
    }, stageInterval);

    // Stage 3 Yellow (at stageInterval * 2)
    const timer3 = setTimeout(() => {
      setCountdownStage(3);
      soundEngine.playCountdownBeep(3);
    }, stageInterval * 2);

    // Green Launch (at randomized delay)
    const greenTimer = setTimeout(() => {
      const greenTime = performance.now();
      startRace(greenTime);
      soundEngine.playGoTone();
    }, totalDurationBeforeGreen);

    return () => {
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(greenTimer);
    };
  }, [raceState, setCountdownStage, startRace]);

  // Track solve record completion once per race
  const hasRecordedCurrentRaceRef = useRef(false);

  useEffect(() => {
    if (raceState === 'RACING') {
      hasRecordedCurrentRaceRef.current = false;
    }

    if (raceState === 'FINISHED' && !hasRecordedCurrentRaceRef.current) {
      hasRecordedCurrentRaceRef.current = true;

      const currentTimerPlayers = useTimerStore.getState().players;
      const solvesData: Record<string, { rawTimeMs: number; falseStartDeltaMs: number; penalty: 'NONE' | 'PLUS_2' | 'DNF' }> = {};

      activePlayersRef.current.forEach((p) => {
        const tp = currentTimerPlayers[p.id];
        const raw = tp?.finishTimeMs || tp?.rawTimeMs || 0;
        solvesData[p.id] = {
          rawTimeMs: raw,
          falseStartDeltaMs: tp?.falseStartDeltaMs || 0,
          penalty: 'NONE',
        };
      });

      const { matchWinnerId, setWinnerId } = recordCompletedGame(solvesData);

      if (matchWinnerId || setWinnerId) {
        soundEngine.playVictoryFanfare();
      }
    }
  }, [raceState, recordCompletedGame]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (isAdminOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.repeat) return;
      const pressedKey = e.key.toLowerCase();

      const player = activePlayersRef.current.find((p) => p.key.toLowerCase() === pressedKey);
      if (!player) return;

      e.preventDefault();
      const currentRaceState = useTimerStore.getState().raceState;

      if (currentRaceState === 'RACING') {
        const rank = stopPlayer(player.id, performance.now());
        if (rank > 0) {
          soundEngine.playFinishChime(rank);
        }
      } else {
        handleKeyDown(player.id, performance.now(), () => {
          useTournamentStore.getState().startNextGame();
        });
      }
    };

    const handleKeyUpEvent = (e: KeyboardEvent) => {
      if (isAdminOpenRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const pressedKey = e.key.toLowerCase();
      const player = activePlayersRef.current.find((p) => p.key.toLowerCase() === pressedKey);
      if (!player) return;

      e.preventDefault();
      const result = handleKeyUp(player.id, performance.now());
      if (result.isFalseStart) {
        soundEngine.playFalseStart();
      }
    };

    window.addEventListener('keydown', handleKeyDownEvent);
    window.addEventListener('keyup', handleKeyUpEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDownEvent);
      window.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, [stopPlayer, handleKeyDown, handleKeyUp]);
}
