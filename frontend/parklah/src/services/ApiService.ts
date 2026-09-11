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
    const cleanQuery = query && query.trim().length > 0 ? query.trim() : 'Parking';

    // 1. Try backend search endpoint first
    try {
      const res = await this.request('/api/v1/searcher/destination/search', {
        method: 'POST',
        body: JSON.stringify({
          query: cleanQuery,
          proximityLat: proximity?.latitude,
          proximityLng: proximity?.longitude,
        }),
      });

      const data = (res as any)?.data || res || [];
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[ApiService] Backend destination search failed, using direct Photon geocoding:', err);
    }

    // 2. Direct client-side geocoding fallback via Photon
    try {
      let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=10`;
      if (proximity) {
        photonUrl += `&lat=${proximity.latitude}&lon=${proximity.longitude}`;
      }

      const pRes = await fetch(photonUrl, {
        headers: { 'User-Agent': 'ParkLah/1.0' },
      });

      if (pRes.ok) {
        const pData: any = await pRes.json();
        if (Array.isArray(pData.features) && pData.features.length > 0) {
          return pData.features.map((f: any, idx: number) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [101.6778, 3.1176];
            const baseName = props.name || props.street || cleanQuery;
            const area = props.district || props.city || props.street;
            const name = area && !baseName.toLowerCase().includes(area.toLowerCase())
              ? `${baseName} - ${area}`
              : baseName;
            const addressParts = [
              props.street,
              props.district,
              props.city,
              props.state,
              props.country,
            ].filter(Boolean);
            const address = addressParts.length > 0 ? addressParts.join(', ') : baseName;

            return {
              id: props.osm_id ? `osm_${props.osm_id}_${idx}` : `search_${idx}`,
              placeId: props.osm_id ? `osm_${props.osm_id}_${idx}` : `place_${idx}`,
              name,
              address,
              latitude: coords[1],
              longitude: coords[0],
            };
          });
        }
      }
    } catch (e) {
      console.warn('[ApiService] Direct Photon fallback failed:', e);
    }

    // 3. Fallback known Malaysian landmarks
    const KNOWN_DESTINATIONS = [
      { name: 'Mid Valley Megamall', address: 'Lingkaran Syed Putra, Mid Valley City, 59200 Kuala Lumpur', latitude: 3.1176, longitude: 101.6778 },
      { name: 'Pavilion Kuala Lumpur', address: '168 Jalan Bukit Bintang, 55100 Kuala Lumpur', latitude: 3.1488, longitude: 101.7133 },
      { name: 'Suria KLCC', address: '241 Suria KLCC, Kuala Lumpur City Centre, 50088 Kuala Lumpur', latitude: 3.1578, longitude: 101.7120 },
      { name: '1 Utama Shopping Centre', address: '1 Lebuh Bandar Utama, Bandar Utama, 47800 Petaling Jaya', latitude: 3.1502, longitude: 101.6152 },
      { name: 'Sunway Pyramid', address: '3 Jalan PJS 11/15, Bandar Sunway, 47500 Subang Jaya', latitude: 3.0733, longitude: 101.6074 },
      { name: 'KL Sentral', address: 'Kuala Lumpur Sentral, Brickfields, 50470 Kuala Lumpur', latitude: 3.1342, longitude: 101.6861 },
      { name: 'The Exchange TRX', address: 'Persiaran TRX, Tun Razak Exchange, 55188 Kuala Lumpur', latitude: 3.1428, longitude: 101.7191 },
      { name: 'IOI City Mall', address: 'Lebuh IRC, IOI Resort City, 62502 Putrajaya', latitude: 2.9702, longitude: 101.7144 },
    ];

    const matches = KNOWN_DESTINATIONS.filter((item) =>
      item.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(cleanQuery.toLowerCase())
    );

    return matches.map((m, idx) => ({
      id: `fallback_${idx}`,
      placeId: `known_${idx}`,
      name: m.name,
      address: m.address,
      latitude: m.latitude,
      longitude: m.longitude,
    }));
  }

  async getProbabilisticCandidates(
    coords: { latitude: number; longitude: number },
    radiusMeters: number = 1000,
  ): Promise<any[]> {
    try {
      const res = await this.request(
        `/api/v1/spots/candidates?lat=${coords.latitude}&lng=${coords.longitude}&radius=${radiusMeters}`,
      );
      return (res as any)?.data?.candidates || (res as any)?.candidates || [];
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

  async updateSearcherLocation(coords: { latitude: number; longitude: number }): Promise<any> {
    return this.request('/api/v1/searcher/location', {
      method: 'POST',
      body: JSON.stringify(coords),
    }).catch(() => {});
  }

  async getDemandForecast(params: {
    latitude?: number;
    longitude?: number;
    destinationName?: string;
  }): Promise<{
    hubName: string;
    occupancyRate: number;
    demandLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    turnoverMinutes: number;
    isPeakHour: boolean;
    recommendedMode: 'CRUISING_PERMITTED' | 'P2P_HANDOFF';
    estimatedCruisingMinutesSaved: number;
    peakWindowLabel?: string;
  }> {
    const queryParts: string[] = [];
    if (params.latitude !== undefined) queryParts.push(`latitude=${params.latitude}`);
    if (params.longitude !== undefined) queryParts.push(`longitude=${params.longitude}`);
    if (params.destinationName) queryParts.push(`destinationName=${encodeURIComponent(params.destinationName)}`);
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.request(`/api/v1/gatekeeper/demand-forecast${qs}`);
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
