import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vehicle } from '../types';

export interface UserProfile {
  id: string;
  phoneNumber?: string | null;
  email?: string | null;
  name?: string;
  fullName?: string;
  authProvider?: string;
  avatarUrl?: string | null;
  defaultRole?: string;
  reliabilityRating: number;
  totalCompletedMatches?: number;
}

export interface UserTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface UserState {
  user: UserProfile | null;
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  authToken: string | null;
  tokens: UserTokens | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  lastRoute: string | null;

  // Actions
  setHasHydrated: (hasHydrated: boolean) => void;
  setLastRoute: (lastRoute: string | null) => void;
  setUser: (user: UserProfile) => void;
  setAuthToken: (token: string | null) => void;
  setAuth: (user: UserProfile, tokens: UserTokens) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setActiveVehicle: (vehicle: Vehicle) => void;
  addVehicle: (vehicle: Vehicle) => void;
  logout: () => void;
}

const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'veh_demo_1',
    makeModel: 'Honda Civic',
    color: 'White',
    plateSuffix: '8822',
    isDefault: true,
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      vehicles: DEFAULT_VEHICLES,
      activeVehicle: DEFAULT_VEHICLES[0],
      authToken: null,
      tokens: null,
      isAuthenticated: false,
      hasHydrated: false,
      lastRoute: null,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setLastRoute: (lastRoute) => set({ lastRoute }),

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAuthToken: (authToken) =>
        set({
          authToken,
          tokens: authToken ? { accessToken: authToken } : null,
          isAuthenticated: !!authToken,
        }),

      setAuth: (user, tokens) =>
        set({
          user,
          tokens,
          authToken: tokens.accessToken,
          isAuthenticated: true,
        }),

      setVehicles: (vehicles) =>
        set({
          vehicles,
          activeVehicle: vehicles.find((v) => v.isDefault) || vehicles[0] || null,
        }),

      setActiveVehicle: (activeVehicle) => set({ activeVehicle }),

      addVehicle: (vehicle) =>
        set((state) => ({
          vehicles: [...state.vehicles, vehicle],
          activeVehicle: vehicle.isDefault ? vehicle : state.activeVehicle,
        })),

      logout: () =>
        set({
          user: null,
          authToken: null,
          tokens: null,
          isAuthenticated: false,
          lastRoute: null,
          vehicles: DEFAULT_VEHICLES,
          activeVehicle: DEFAULT_VEHICLES[0],
        }),
    }),
    {
      name: 'parklah-user-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        authToken: state.authToken,
        isAuthenticated: state.isAuthenticated,
        lastRoute: state.lastRoute,
        vehicles: state.vehicles,
        activeVehicle: state.activeVehicle,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
