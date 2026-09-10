import { useUserStore } from '../stores/useUserStore';
import { SocketService } from './SocketService';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async bootstrapSession(): Promise<any> {
    try {
      const res = await this.request<any>('/api/v1/auth/bootstrap', { method: 'POST' });
      if (res && res.tokens && res.user) {
        useUserStore.getState().setAuth(res.user, res.tokens);
        const socketUrl = BASE_URL.replace('/api/v1', '');
        SocketService.getInstance().connect(socketUrl, res.tokens.accessToken);
        return res;
      }
    } catch (e: any) {
      console.warn('[ApiService] Bootstrap session failed:', e.message);
    }
    return null;
  }

  private getAuthHeader(): Record<string, string> {
    const token = useUserStore.getState().tokens?.accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }
      return (data.data !== undefined ? data.data : data) as T;
    } catch (error: any) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  // --- Auth Endpoints ---
  async login(credentials: { emailOrPhone: string; password: string }): Promise<any> {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { fullName: string; emailOrPhone: string; password: string }): Promise<any> {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string; ttlSeconds: number }> {
    return this.request('/api/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<any> {
    return this.request('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
    });
  }

  async oauthLogin(payload: { provider: string; providerId: string; email?: string; fullName?: string; avatarUrl?: string }): Promise<any> {
    return this.request('/api/v1/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Searcher Endpoints ---
  async searchDestination(query: string, proximity?: { latitude: number; longitude: number }): Promise<any[]> {
    return this.request('/api/v1/searcher/destination/search', {
      method: 'POST',
      body: JSON.stringify({
        query: query && query.trim().length > 0 ? query : 'Parking',
        proximityLat: proximity?.latitude,
        proximityLng: proximity?.longitude,
      }),
    });
  }

  async getProbabilisticCandidates(
    coords: { latitude: number; longitude: number },
    radiusMeters: number = 1000,
  ): Promise<any[]> {
    try {
      const res = await this.request(
        `/api/v1/spots/candidates?lat=${coords.latitude}&lng=${coords.longitude}&radius=${radiusMeters}`,
      );
      return res?.data?.candidates || res?.candidates || [];
    } catch {
      return [];
    }
  }

  async evaluateDestination(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number; name?: string },
  ): Promise<any> {
    return this.request('/api/v1/searcher/destination/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        origin: { latitude: origin.latitude, longitude: origin.longitude },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          name: destination.name || 'Destination Parking',
        },
      }),
    });
  }

  async startSearch(
    currentCoords: { latitude: number; longitude: number },
    destCoords: { latitude: number; longitude: number; name?: string },
  ): Promise<any> {
    return this.request('/api/v1/searcher/start', {
      method: 'POST',
      body: JSON.stringify({
        currentCoords,
        destCoords: { latitude: destCoords.latitude, longitude: destCoords.longitude },
        destName: destCoords.name || 'Target Parking Spot',
        radiusMeters: 1000,
      }),
    });
  }

  async stopSearch(): Promise<any> {
    return this.request('/api/v1/searcher/stop', {
      method: 'POST',
    });
  }

  // --- Matchmaker Endpoints ---
  async acceptMatch(matchId: string): Promise<any> {
    return this.request(`/api/v1/matches/${matchId}/accept`, {
      method: 'POST',
    });
  }

  async declineMatch(matchId: string): Promise<any> {
    return this.request(`/api/v1/matches/${matchId}/decline`, {
      method: 'POST',
    });
  }

  // --- Leaver Endpoints ---
  async broadcastDeparture(coordinates: { latitude: number; longitude: number }, countdownSeconds: number, landmarkNote?: string): Promise<any> {
    return this.request('/api/v1/leaver/broadcast', {
      method: 'POST',
      body: JSON.stringify({ coordinates, countdownSeconds, landmarkNote }),
    });
  }

  async cancelDeparture(reason: string): Promise<any> {
    return this.request('/api/v1/leaver/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Verification Endpoints ---
  async confirmArrival(matchId: string): Promise<any> {
    return this.request('/api/v1/verification/confirm', {
      method: 'POST',
      body: JSON.stringify({ matchId }),
    });
  }

  async reportSpotTaken(matchId: string, description?: string): Promise<any> {
    return this.request('/api/v1/verification/spot-taken', {
      method: 'POST',
      body: JSON.stringify({ matchId, description }),
    });
  }

  // --- Wallet Endpoints ---
  async getWalletBalance(): Promise<{ balance: number; currency: string }> {
    return this.request('/api/v1/wallet/balance');
  }

  async getWalletTransactions(page: number = 1, limit: number = 20): Promise<any[]> {
    return this.request(`/api/v1/wallet/transactions?page=${page}&limit=${limit}`);
  }

  async mockTopup(amount: number): Promise<any> {
    return this.request('/api/v1/wallet/mock/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async mockCashout(amount: number): Promise<any> {
    return this.request('/api/v1/wallet/mock/cashout', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
}

export const apiService = ApiService.getInstance();
