import { create } from 'zustand';
import {
  SearcherStateEnum,
  Destination,
  GatekeeperStatus,
  MatchOffer,
  Coordinates,
} from '../types';

interface SearcherState {
  state: SearcherStateEnum;
  destination: Destination | null;
  gatekeeperStatus: GatekeeperStatus | null;
  activeOffer: MatchOffer | null;
  confirmedMatchId: string | null;
  targetSpotCoords: Coordinates | null;
  fallbackSpot: any | null;
  searchRadiusMeters: number;

  // Actions
  setDestination: (dest: Destination) => void;
  setGatekeeperStatus: (status: GatekeeperStatus) => void;
  startActiveSearch: () => void;
  setActiveOffer: (offer: MatchOffer | null) => void;
  acceptOffer: (matchId: string) => void;
  declineOffer: () => void;
  setNavigatingToSpot: (matchId: string, coords: Coordinates) => void;
  setArrivedPrompt: () => void;
  setParkedSuccess: () => void;
  setSpotTakenFallback: (fallbackSpot: any) => void;
  reset: () => void;
}

export const useSearcherStore = create<SearcherState>((set) => ({
  state: 'IDLE',
  destination: null,
  gatekeeperStatus: null,
  activeOffer: null,
  confirmedMatchId: null,
  targetSpotCoords: null,
  fallbackSpot: null,
  searchRadiusMeters: 1000,

  setDestination: (destination) =>
    set({ destination, state: 'DESTINATION_SET' }),

  setGatekeeperStatus: (gatekeeperStatus) =>
    set((state) => ({
      gatekeeperStatus,
      state: gatekeeperStatus.isUnlocked ? 'ACTIVE_RADAR_SEARCH' : 'GATEKEEPER_LOCKED',
    })),

  startActiveSearch: () =>
    set({ state: 'ACTIVE_RADAR_SEARCH' }),

  setActiveOffer: (activeOffer) =>
    set({
      activeOffer,
      state: activeOffer ? 'MATCH_OFFERED' : 'ACTIVE_RADAR_SEARCH',
    }),

  acceptOffer: (matchId) =>
    set((state) => ({
      confirmedMatchId: matchId,
      targetSpotCoords: state.activeOffer?.spotCoords || null,
      activeOffer: null,
      state: 'NAVIGATING_TO_SPOT',
    })),

  declineOffer: () =>
    set({
      activeOffer: null,
      state: 'ACTIVE_RADAR_SEARCH',
    }),

  setNavigatingToSpot: (confirmedMatchId, targetSpotCoords) =>
    set({
      confirmedMatchId,
      targetSpotCoords,
      state: 'NAVIGATING_TO_SPOT',
    }),

  setArrivedPrompt: () =>
    set({ state: 'ARRIVED_PROMPT' }),

  setParkedSuccess: () =>
    set({ state: 'PARKED_SUCCESS' }),

  setSpotTakenFallback: (fallbackSpot) =>
    set({
      fallbackSpot,
      targetSpotCoords: fallbackSpot?.coordinates || null,
      state: 'SPOT_TAKEN_FALLBACK',
    }),

  reset: () =>
    set({
      state: 'IDLE',
      destination: null,
      gatekeeperStatus: null,
      activeOffer: null,
      confirmedMatchId: null,
      targetSpotCoords: null,
      fallbackSpot: null,
      searchRadiusMeters: 1000,
    }),
}));
