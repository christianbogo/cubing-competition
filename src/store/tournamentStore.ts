import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

import { PlayerSlice, createPlayerSlice } from './slices/playerSlice';
import { SettingsSlice, createSettingsSlice } from './slices/settingsSlice';
import { ActivityFeedSlice, createActivityFeedSlice } from './slices/activityFeedSlice';
import { MatchSlice, createMatchSlice } from './slices/matchSlice';

export type TournamentStore = PlayerSlice & SettingsSlice & ActivityFeedSlice & MatchSlice;

export const useTournamentStore = create<TournamentStore>()(
  persist(
    immer((...a) => ({
      ...createPlayerSlice(...a),
      ...createSettingsSlice(...a),
      ...createActivityFeedSlice(...a),
      ...createMatchSlice(...a),
    })),
    {
      name: 'cubing-tournament-storage',
      partialize: (state) => ({
        players: state.players,
        settings: state.settings,
      }),
    }
  )
);
