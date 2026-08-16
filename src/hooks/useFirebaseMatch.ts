import { useEffect } from 'react';
import { ref, set, onValue, off, onChildAdded, onChildChanged } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useTournamentStore } from '@/store/tournamentStore';
import { useTimerStore } from '@/store/timerStore';
import { PenaltyType } from '@/types/tournament';

export function useFirebaseHost() {
  const tournamentState = useTournamentStore();
  const { raceState, scheduledGreenTime } = useTimerStore();

  const { matchId, isRoomActive, matchStatus } = tournamentState;

  // 1. Sync Full State to Firebase
  useEffect(() => {
    if (!matchId) return;

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
    };

    // Firebase RTDB crashes on `undefined` properties.
    // JSON stringify/parse strips `undefined` keys out of the object natively.
    const cleanPayload = JSON.parse(JSON.stringify(payload));

    set(stateRef, cleanPayload).catch(e => console.error("Firebase write error:", e));
  }, [tournamentState, raceState, scheduledGreenTime, matchId, isRoomActive]);

  // 2. Listen for Guest Solves
  useEffect(() => {
    if (matchStatus === 'SETUP') return;

    const solvesRef = ref(database, `matches/${matchId}/solves`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSolveUpdate = (snapshot: any) => {
      const playerId = snapshot.key;
      const solveData = snapshot.val();
      
      if (!playerId || !solveData) return;
      
      const { stopPlayer } = useTimerStore.getState();
      
      // Stop the player in local timer store
      stopPlayer(playerId, solveData.timestamp, solveData.penalty as PenaltyType);
    };

    onChildAdded(solvesRef, handleSolveUpdate);
    onChildChanged(solvesRef, handleSolveUpdate);

    return () => {
      off(solvesRef, 'child_added', handleSolveUpdate);
      off(solvesRef, 'child_changed', handleSolveUpdate);
    };
  }, [matchId, tournamentState.matchStatus]);

  // 3. Listen for Guest Connections
  useEffect(() => {
    if (!isRoomActive || !matchId) return;

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
      });
      
      useTournamentStore.setState({
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
        settings: state.settings,
        activityFeed: state.activityFeed || [],
      });
    };

    onValue(stateRef, handleStateChange);

    return () => {
      off(stateRef, 'value', handleStateChange);
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
