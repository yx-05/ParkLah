import { create } from 'zustand';
import { LeaverStateEnum, Coordinates } from '../types';

interface MatchedSearcherInfo {
  searcherId: string;
  matchId: string;
  vehicleSummary?: string;
  searcherEtaSeconds?: number;
}

interface LeaverState {
  state: LeaverStateEnum;
  spotCoords: Coordinates | null;
  countdownSeconds: number;
  initialCountdownSeconds: number;
  landmarkNote: string;
  matchedSearcher: MatchedSearcherInfo | null;
  penaltyWarning: boolean;

  // Actions
  startBroadcast: (coords: Coordinates, countdownSec: number, landmarkNote?: string) => void;
  decrementCountdown: () => void;
  syncCountdown: (seconds: number) => void;
  setMatchedSearcher: (info: MatchedSearcherInfo) => void;
  setHandoffCompleted: () => void;
  cancelBroadcast: () => { penaltyApplied: boolean };
  reset: () => void;
}

export const useLeaverStore = create<LeaverState>((set, get) => ({
  state: 'IDLE',
  spotCoords: null,
  countdownSeconds: 240,
  initialCountdownSeconds: 240,
  landmarkNote: '',
  matchedSearcher: null,
  penaltyWarning: false,

  startBroadcast: (spotCoords, countdownSeconds, landmarkNote = '') =>
    set({
      spotCoords,
      countdownSeconds,
      initialCountdownSeconds: countdownSeconds,
      landmarkNote,
      matchedSearcher: null,
      penaltyWarning: false,
      state: 'BROADCASTING_COUNTDOWN',
    }),

  decrementCountdown: () =>
    set((state) => {
      const nextSeconds = Math.max(0, state.countdownSeconds - 1);
      const isLastMinute = nextSeconds < 60 && state.matchedSearcher !== null;
      return {
        countdownSeconds: nextSeconds,
        penaltyWarning: isLastMinute,
      };
    }),

  syncCountdown: (countdownSeconds) =>
    set({ countdownSeconds }),

  setMatchedSearcher: (matchedSearcher) =>
    set({
      matchedSearcher,
      state: 'SEARCHER_MATCHED',
    }),

  setHandoffCompleted: () =>
    set({
      state: 'HANDOFF_COMPLETED',
    }),

  cancelBroadcast: () => {
    const { state, countdownSeconds, matchedSearcher } = get();
    const penaltyApplied = (state === 'SEARCHER_MATCHED' || matchedSearcher !== null) && countdownSeconds < 60;

    set({
      state: 'CANCELLED',
      matchedSearcher: null,
    });

    return { penaltyApplied };
  },

  reset: () =>
    set({
      state: 'IDLE',
      spotCoords: null,
      countdownSeconds: 240,
      initialCountdownSeconds: 240,
      landmarkNote: '',
      matchedSearcher: null,
      penaltyWarning: false,
    }),
}));
