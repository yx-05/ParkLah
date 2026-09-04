import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiService } from './ApiService';
import { useUserStore } from '../stores/useUserStore';
import { SocketService } from './SocketService';

WebBrowser.maybeCompleteAuthSession();

export class OAuthService {
  private static instance: OAuthService;

  private constructor() {}

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  public getRedirectUrl(): string {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}`;
    }
    // Deep link callback for Expo Go (exp://...) and standalone build (parklah://...)
    return Linking.createURL('auth-callback');
  }

  public async signInWithProvider(provider: 'GOOGLE' | 'FACEBOOK'): Promise<any> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qvyqonasrghktgbezlad.supabase.co';
    const redirectUrl = this.getRedirectUrl();
    console.log(`[OAuthService] Initiating ${provider} login with redirect_to:`, redirectUrl);

    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider.toLowerCase()}&redirect_to=${encodeURIComponent(redirectUrl)}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // On Web, navigate current tab to Supabase
      window.location.href = authUrl;
      return null;
    }

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
        showInRecents: true,
      });

      console.log('[OAuthService] AuthSession result:', result);

      if (result.type === 'success' && result.url) {
        return await this.processAuthUrl(result.url, provider);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[OAuthService] User cancelled sign in.');
        return null;
      } else {
        throw new Error('OAuth authentication was not completed.');
      }
    } catch (e: any) {
      console.error('[OAuthService] Error during sign-in:', e.message);
      throw e;
    }
  }

  public async checkWebHashCallback(): Promise<any> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    const fullUrl = window.location.href;
    if (fullUrl.includes('access_token=') || fullUrl.includes('code=')) {
      const result = await this.processAuthUrl(fullUrl, 'GOOGLE');
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return result;
    }
    return null;
  }

  public async handleDeepLinkUrl(url: string): Promise<any> {
    if (!url || (!url.includes('access_token=') && !url.includes('code='))) {
      return null;
    }
    return await this.processAuthUrl(url, 'GOOGLE');
  }

  public async processAuthUrl(url: string, defaultProvider: 'GOOGLE' | 'FACEBOOK' = 'GOOGLE'): Promise<any> {
    console.log('[OAuthService] Processing returning auth URL:', url);
    const params = this.extractParamsFromUrl(url);

    if (params['error'] || params['error_description']) {
      throw new Error(params['error_description'] || params['error'] || 'OAuth authentication failed');
    }

    let provider: 'GOOGLE' | 'FACEBOOK' = defaultProvider;
    let email = params['email'];
    let fullName = params['full_name'] || `${provider} Driver`;
    let avatarUrl = params['avatar_url'];
    let providerId = params['provider_token'] || params['sub'] || `oauth_${Date.now()}`;

    // Decode Supabase JWT if access_token is present in URL hash/params
    if (params['access_token']) {
      try {
        const payloadBase64 = params['access_token'].split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(
            typeof atob === 'function'
              ? atob(payloadBase64)
              : Buffer.from(payloadBase64, 'base64').toString('utf8'),
          );
          if (decoded.email) email = decoded.email;
          if (decoded.sub) providerId = decoded.sub;
          if (decoded.app_metadata?.provider) {
            const p = decoded.app_metadata.provider.toUpperCase();
            if (p === 'GOOGLE' || p === 'FACEBOOK') provider = p;
          }
          if (decoded.user_metadata?.full_name) fullName = decoded.user_metadata.full_name;
          if (decoded.user_metadata?.name) fullName = decoded.user_metadata.name;
          if (decoded.user_metadata?.avatar_url) avatarUrl = decoded.user_metadata.avatar_url;
        }
      } catch (jwtErr) {
        console.warn('Failed to parse Supabase token payload:', jwtErr);
      }
    }

    const oauthPayload = {
      provider,
      providerId,
      email,
      fullName,
      avatarUrl,
    };

    const authResult = await apiService.oauthLogin(oauthPayload);
    useUserStore.getState().setAuth(authResult.user, authResult.tokens);

    const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    try {
      SocketService.getInstance().connect(socketUrl, authResult.tokens.accessToken);
    } catch (sErr) {
      console.warn('Socket connect error:', sErr);
    }

    return authResult;
  }

  private extractParamsFromUrl(url: string): Record<string, string> {
    const params: Record<string, string> = {};

    if (url.includes('?')) {
      const queryString = url.split('?')[1].split('#')[0];
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    if (url.includes('#')) {
      const hashString = url.split('#')[1];
      const hashParams = new URLSearchParams(hashString);
      hashParams.forEach((val, key) => {
        params[key] = val;
      });
    }

    return params;
  }
}

export const oauthService = OAuthService.getInstance();
