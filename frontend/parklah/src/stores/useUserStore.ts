import { create } from 'zustand';
import { Vehicle } from '../types';

interface UserProfile {
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

interface UserTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

interface UserState {
  user: UserProfile | null;
  vehicles: Vehicle[];
  activeVehicle: Vehicle | null;
  authToken: string | null;
  tokens: UserTokens | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: UserProfile) => void;
  setAuthToken: (token: string | null) => void;
  setAuth: (user: UserProfile, tokens: UserTokens) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setActiveVehicle: (vehicle: Vehicle) => void;
  addVehicle: (vehicle: Vehicle) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    id: 'usr_demo_1',
    phoneNumber: '+60123456789',
    name: 'ParkLah Driver',
    reliabilityRating: 5.0,
    totalCompletedMatches: 12,
  },
  vehicles: [
    {
      id: 'veh_demo_1',
      makeModel: 'Honda Civic',
      color: 'White',
      plateSuffix: '8822',
      isDefault: true,
    },
  ],
  activeVehicle: {
    id: 'veh_demo_1',
    makeModel: 'Honda Civic',
    color: 'White',
    plateSuffix: '8822',
    isDefault: true,
  },
  authToken: 'mock_jwt_access_token',
  tokens: { accessToken: 'mock_jwt_access_token' },
  isAuthenticated: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setAuthToken: (authToken) => set({ authToken, tokens: authToken ? { accessToken: authToken } : null, isAuthenticated: !!authToken }),

  setAuth: (user, tokens) => set({ user, tokens, authToken: tokens.accessToken, isAuthenticated: true }),

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
      isAuthenticated: false,
      vehicles: [],
      activeVehicle: null,
    }),
}));
