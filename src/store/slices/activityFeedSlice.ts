import { StateCreator } from 'zustand';
import { TournamentStore } from '../tournamentStore';
import { ActivityFeedItem } from '@/types/tournament';

export interface ActivityFeedSlice {
  isAdminOpen: boolean;
  isActivityFeedOpen: boolean;
  activityFeed: ActivityFeedItem[];
  toggleAdmin: (open?: boolean) => void;
  toggleActivityFeed: (open?: boolean) => void;
  addActivityItem: (item: Omit<ActivityFeedItem, 'id' | 'timestamp'>) => void;
  clearActivityFeed: () => void;
}

export const createActivityFeedSlice: StateCreator<TournamentStore, [['zustand/immer', never]], [], ActivityFeedSlice> = (set) => ({
  isAdminOpen: false,
  isActivityFeedOpen: true,
  activityFeed: [],
  toggleAdmin: (open) => {
    set((state) => {
      state.isAdminOpen = open !== undefined ? open : !state.isAdminOpen;
    });
  },
  toggleActivityFeed: (open) => {
    set((state) => {
      state.isActivityFeedOpen = open !== undefined ? open : !state.isActivityFeedOpen;
    });
  },
  addActivityItem: (item) => {
    set((state) => {
      const newItem: ActivityFeedItem = {
        ...item,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      state.activityFeed.unshift(newItem);
      if (state.activityFeed.length > 100) {
        state.activityFeed.pop();
      }
    });
  },
  clearActivityFeed: () => {
    set((state) => {
      state.activityFeed = [];
    });
  },
});
