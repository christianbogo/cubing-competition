import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { SetMatch, TournamentSettings, Player, TeamId } from '@/types/tournament';

export interface SavedMatch {
  id: string;
  name: string;
  savedAt: number;
  sets: SetMatch[];
  players: Player[];
  matchWinnerPlayerId: string | null;
  matchWinnerTeamId: TeamId | null;
  settings: TournamentSettings;
}

/**
 * Saves a completed match to the user's match library.
 */
export const saveMatch = async (
  userId: string, 
  matchId: string,
  sets: SetMatch[], 
  players: Player[],
  matchWinnerPlayerId: string | null,
  matchWinnerTeamId: TeamId | null,
  settings: TournamentSettings
) => {
  if (!userId) return;
  const docRef = doc(firestore, 'users', userId, 'matches', matchId);
  
  const savedMatch: SavedMatch = {
    id: matchId,
    name: `Match on ${new Date().toLocaleDateString()}`,
    savedAt: Date.now(),
    sets,
    players,
    matchWinnerPlayerId,
    matchWinnerTeamId,
    settings,
  };

  await setDoc(docRef, savedMatch);
};

/**
 * Retrieves all saved matches for a user, ordered by most recent first.
 */
export const getSavedMatches = async (userId: string): Promise<SavedMatch[]> => {
  if (!userId) return [];
  const matchesRef = collection(firestore, 'users', userId, 'matches');
  const q = query(matchesRef, orderBy('savedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as SavedMatch);
};

/**
 * Deletes a saved match from the library.
 */
export const deleteMatch = async (userId: string, matchId: string) => {
  if (!userId || !matchId) return;
  const docRef = doc(firestore, 'users', userId, 'matches', matchId);
  await deleteDoc(docRef);
};

/**
 * Renames a saved match in the library.
 */
export const renameMatch = async (userId: string, matchId: string, newName: string) => {
  if (!userId || !matchId) return;
  const docRef = doc(firestore, 'users', userId, 'matches', matchId);
  await updateDoc(docRef, { name: newName });
};
