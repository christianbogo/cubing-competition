import { useEffect } from 'react';
import { ref, set, onValue, off, onChildAdded, onChildChanged, push, query, orderByChild, startAt } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { PenaltyType } from '@/types/tournament';

export function useFirebaseHost() {
  const tournamentState = useTournamentStore();
  const { raceState, scheduledGreenTime, players: timerPlayers, raceStartTime, countdownStage } = useTimerStore();

  const { matchId, isRoomActive, matchStatus } = tournamentState;

  // 0. Manage Host Presence
  useEffect(() => {
    if (!matchId || matchId === 'local' || !isRoomActive) return;

    import('firebase/database').then(({ onDisconnect, ref: rdbRef }) => {
      const matchRef = rdbRef(database, `matches/${matchId}`);
      // If the host disconnects ungracefully, delete the entire match
      onDisconnect(matchRef).remove().catch(e => console.error("Firebase onDisconnect error:", e));
    });

    return () => {
      import('firebase/database').then(({ onDisconnect, ref: rdbRef }) => {
        const matchRef = rdbRef(database, `matches/${matchId}`);
        // Cancel the disconnect handler when cleaning up
        onDisconnect(matchRef).cancel().catch(e => console.error("Firebase onDisconnect cancel error:", e));
      });
    };
  }, [matchId, isRoomActive]);

  // 5. Respond to Guest Pings (Host Liveness Check)
  useEffect(() => {
    if (!isRoomActive || matchId === 'local' || !matchId) return;

    const pingsRef = ref(database, `matches/${matchId}/pings`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePing = (snapshot: any) => {
      const pingId = snapshot.key;
      if (!pingId) return;
      
      // Send pong
      set(ref(database, `matches/${matchId}/pongs/${pingId}`), Date.now());
      
      // Clean up ping
      import('firebase/database').then(({ remove }) => {
        remove(ref(database, `matches/${matchId}/pings/${pingId}`)).catch(() => {});
      });
    };

    onChildAdded(pingsRef, handlePing);

    return () => {
      off(pingsRef, 'child_added', handlePing);
    };
  }, [matchId, isRoomActive]);

  // 1. Sync Full State to Firebase
  useEffect(() => {
    if (!matchId || matchId === 'local') return;

    const stateRef = ref(database, `matches/${matchId}/fullState`);
    
    if (!isRoomActive) {
      // Room is no longer active (e.g. cancelled to setup). Destroy it.
      import('firebase/database').then(({ remove }) => {
        remove(ref(database, `matches/${matchId}`)).catch(e => console.error("Firebase remove error:", e));
      });
      return;
    }
    
    // Extract only serializable state (no functions)
    const {
      matchStatus, currentSetIndex, currentGameIndex, currentRoundIndex, sets,
      currentScramble, currentGameSolves, currentGamePoints, lastRoundScores,
      totalPoints, setWins, gameWins, teamGamePoints, teamTotalPoints, teamSetWins, teamGameWins,
      matchBestTimeMs, setBestTimeMs, matchWinnerPlayerId, matchWinnerTeamId,
      players, settings, activityFeed
    } = tournamentState;

    const payload = {
      matchStatus, currentSetIndex, currentGameIndex, currentRoundIndex, sets,
      currentScramble, currentGameSolves, currentGamePoints, lastRoundScores,
      totalPoints, setWins, gameWins, teamGamePoints, teamTotalPoints, teamSetWins, teamGameWins,
      matchBestTimeMs, setBestTimeMs, matchWinnerPlayerId, matchWinnerTeamId,
      players, settings, activityFeed: activityFeed || [],
      raceState, scheduledGreenTime: scheduledGreenTime || null,
      raceStartTime: raceStartTime || null,
      countdownStage,
      timerPlayers,
    };

    // Firebase RTDB crashes on `undefined` properties.
    // JSON stringify/parse strips `undefined` keys out of the object natively.
    const cleanPayload = JSON.parse(JSON.stringify(payload));

    set(stateRef, cleanPayload).catch(e => console.error("Firebase write error:", e));
  }, [tournamentState, raceState, scheduledGreenTime, timerPlayers, matchId, isRoomActive, countdownStage, raceStartTime]);

  // 2. Listen for Guest Solves
  useEffect(() => {
    if (matchStatus === 'SETUP' || matchId === 'local') return;

    const solvesRef = ref(database, `matches/${matchId}/solves`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSolveUpdate = (snapshot: any) => {
      const playerId = snapshot.key;
      const solveData = snapshot.val();
      
      if (!playerId || !solveData) return;
      
      const { stopPlayer, raceStartTime } = useTimerStore.getState();
      
      const finishTimestamp = (raceStartTime || Date.now()) + solveData.rawTimeMs;
      // Stop the player in local timer store
      stopPlayer(playerId, finishTimestamp, solveData.penalty as PenaltyType);
    };

    onChildAdded(solvesRef, handleSolveUpdate);
    onChildChanged(solvesRef, handleSolveUpdate);

    return () => {
      off(solvesRef, 'child_added', handleSolveUpdate);
      off(solvesRef, 'child_changed', handleSolveUpdate);
    };
  }, [matchId, tournamentState.matchStatus]);

  // 3. Listen for Guest Spacebar Held State
  useEffect(() => {
    if (matchStatus === 'SETUP' || matchId === 'local') return;

    const heldRef = ref(database, `matches/${matchId}/held`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleHeldUpdate = (snapshot: any) => {
      const playerId = snapshot.key;
      const isHeld = snapshot.val();
      
      if (!playerId) return;
      
      const { handleKeyDown, handleKeyUp, raceState, players: tPlayers } = useTimerStore.getState();
      const { recordCompletedGame, players: tourneyPlayers } = useTournamentStore.getState();

      // Only process if we aren't racing, or if it's an initial hold
      if (isHeld && tPlayers[playerId] && !tPlayers[playerId].isHeld) {
        if (raceState === 'FINISHED') {
          handleKeyDown(playerId, Date.now(), () => {
            const solvesData: Record<string, { rawTimeMs: number; falseStartDeltaMs: number; penalty: 'NONE' | 'PLUS_2' | 'DNF' }> = {};
            tourneyPlayers.filter(p => p.active).forEach(p => {
              const tp = tPlayers[p.id];
              solvesData[p.id] = {
                rawTimeMs: tp?.finishTimeMs || tp?.rawTimeMs || 0,
                falseStartDeltaMs: tp?.falseStartDeltaMs || 0,
                penalty: tp?.penalty || 'NONE',
              };
            });
            recordCompletedGame(solvesData);
          });
        } else {
          handleKeyDown(playerId, Date.now());
        }
      } else if (!isHeld && tPlayers[playerId] && tPlayers[playerId].isHeld) {
        handleKeyUp(playerId, Date.now());
      }
    };

    onChildAdded(heldRef, handleHeldUpdate);
    onChildChanged(heldRef, handleHeldUpdate);

    return () => {
      off(heldRef, 'child_added', handleHeldUpdate);
      off(heldRef, 'child_changed', handleHeldUpdate);
    };
  }, [matchId, matchStatus]);

  // 4. Listen for Chat Messages (Host aggregates and adds to activityFeed)
  useEffect(() => {
    if (!isRoomActive || matchId === 'local' || !matchId) return;

    // Listen for all chat messages. Duplicates are handled by addActivityItem's ID check.
    const chatRef = query(ref(database, `matches/${matchId}/chatMessages`), orderByChild('timestamp'));
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleChatUpdate = (snapshot: any) => {
      const chatData = snapshot.val();
      if (!chatData) return;
      
      const { addActivityItem } = useTournamentStore.getState();
      addActivityItem(chatData);
    };

    onChildAdded(chatRef, handleChatUpdate);

    return () => {
      off(chatRef, 'child_added', handleChatUpdate);
    };
  }, [matchId, isRoomActive]);

  // 3. Listen for Guest Connections
  useEffect(() => {
    if (!isRoomActive || !matchId || matchId === 'local') return;

    const presenceRef = ref(database, `matches/${matchId}/connectedPlayers`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePresenceUpdate = (snapshot: any) => {
      const val = snapshot.val();
      if (val) {
        useTournamentStore.getState().setConnectedGuests(Object.keys(val));
      } else {
        useTournamentStore.getState().setConnectedGuests([]);
      }
    };

    onValue(presenceRef, handlePresenceUpdate);

    return () => {
      off(presenceRef, 'value', handlePresenceUpdate);
    };
  }, [matchId, isRoomActive]);

  // 4. Host Presence & Disconnect Cleanup
  useEffect(() => {
    if (!isRoomActive || !matchId || matchId === 'local') return;

    let matchRef: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    
    import('firebase/database').then(({ ref, onDisconnect }) => {
      matchRef = ref(database, `matches/${matchId}`);
      
      // When the host disconnects (closes tab/refreshes), cleanly destroy the entire match room
      // This ensures guests don't get stuck in an orphaned room.
      onDisconnect(matchRef).remove().catch(err => console.error("Host onDisconnect error", err));
    });

    return () => {
      // Cancel the disconnect hook if we're unmounting cleanly
      if (matchRef) {
         import('firebase/database').then(({ onDisconnect }) => {
           onDisconnect(matchRef).cancel().catch(() => {});
         });
      }
    };
  }, [matchId, isRoomActive]);
}

export function useFirebaseGuest(matchId: string, slotId?: string) {
  useEffect(() => {
    if (!matchId) return;

    const stateRef = ref(database, `matches/${matchId}/fullState`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStateChange = (snapshot: any) => {
      if (!snapshot.exists()) {
        useTournamentStore.setState({ isRoomActive: false });
        return;
      }
      
      const state = snapshot.val();
      if (!state) return;
      
      useTimerStore.setState({
        raceState: state.raceState || 'IDLE',
        scheduledGreenTime: state.scheduledGreenTime || null,
        raceStartTime: state.raceStartTime || null,
        countdownStage: state.countdownStage || 0,
        players: state.timerPlayers || {},
      });
      
      useTournamentStore.setState({
        matchId: matchId,
        isRoomActive: true,
        matchStatus: state.matchStatus || 'SETUP',
        currentSetIndex: state.currentSetIndex || 0,
        currentGameIndex: state.currentGameIndex || 0,
        currentRoundIndex: state.currentRoundIndex || 0,
        sets: state.sets || [],
        currentScramble: state.currentScramble || '',
        currentGameSolves: state.currentGameSolves || {},
        currentGamePoints: state.currentGamePoints || {},
        lastRoundScores: state.lastRoundScores || {},
        totalPoints: state.totalPoints || {},
        setWins: state.setWins || {},
        gameWins: state.gameWins || {},
        teamGamePoints: state.teamGamePoints || { RED: 0, BLUE: 0 },
        teamTotalPoints: state.teamTotalPoints || { RED: 0, BLUE: 0 },
        teamSetWins: state.teamSetWins || { RED: 0, BLUE: 0 },
        teamGameWins: state.teamGameWins || { RED: 0, BLUE: 0 },
        matchBestTimeMs: state.matchBestTimeMs || null,
        setBestTimeMs: state.setBestTimeMs || null,
        matchWinnerPlayerId: state.matchWinnerPlayerId || null,
        matchWinnerTeamId: state.matchWinnerTeamId || null,
        players: state.players || [],
        settings: { ...state.settings, soundEnabled: useTournamentStore.getState().settings.soundEnabled },
        activityFeed: state.activityFeed || [],
      });
    };

    onValue(stateRef, handleStateChange);

    return () => {
      off(stateRef, 'value', handleStateChange);
    };
  }, [matchId]);

  // 1.5. Check Host Liveness (Ping)
  useEffect(() => {
    if (!matchId || matchId === 'local') return;

    const pingId = Math.random().toString(36).substring(7);
    const pongRef = ref(database, `matches/${matchId}/pongs/${pingId}`);
    
    let isAlive = false;
    const unsubscribe = onValue(pongRef, (snapshot) => {
      if (snapshot.exists()) {
        isAlive = true;
        import('firebase/database').then(({ remove }) => {
          remove(pongRef).catch(() => {});
        });
      }
    });

    set(ref(database, `matches/${matchId}/pings/${pingId}`), Date.now()).catch(() => {});

    const timeoutId = setTimeout(() => {
      if (!isAlive) {
        console.warn('Host did not respond to ping. Room is a zombie. Destroying...');
        import('firebase/database').then(({ remove }) => {
          remove(ref(database, `matches/${matchId}`)).catch(e => console.error("Firebase remove error:", e));
        });
        useTournamentStore.setState({ isRoomActive: false });
      }
    }, 3000); // 3 seconds timeout

    return () => {
      clearTimeout(timeoutId);
      off(pongRef, 'value', unsubscribe);
    };
  }, [matchId]);

  // 2. Establish Presence
  useEffect(() => {
    if (!matchId || !slotId) return;

    import('firebase/database').then(({ onDisconnect }) => {
      const presenceRef = ref(database, `matches/${matchId}/connectedPlayers/${slotId}`);
      
      // When we disconnect, remove our presence
      onDisconnect(presenceRef).remove().then(() => {
        // Now that the disconnect hook is ready, mark us as online
        set(presenceRef, true).catch(err => console.error("Presence error", err));
      }).catch(err => console.error("onDisconnect error", err));
    });

    return () => {
      // Clean up presence when component unmounts
      import('firebase/database').then(({ remove }) => {
        remove(ref(database, `matches/${matchId}/connectedPlayers/${slotId}`));
      });
    };
  }, [matchId, slotId]);
}
