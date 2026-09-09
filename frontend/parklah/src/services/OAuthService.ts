import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './ApiService';
import { useUserStore } from '../stores/useUserStore';
import { SocketService } from './SocketService';

WebBrowser.maybeCompleteAuthSession();

const CONSUMED_URL_STORAGE_KEY = 'parklah_last_consumed_oauth_url';

export class OAuthService {
  private static instance: OAuthService;

  private constructor() {}

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  private activeAuthPromise: Promise<any> | null = null;
  private lastProcessedUrl: string | null = null;
  private lastAuthResult: any = null;

  public getRedirectUrl(): string {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/auth-callback`;
    }
    // Deep link callback for Expo Go (exp://...) and standalone build (parklah://...)
    return Linking.createURL('auth-callback');
  }

  public async signInWithProvider(provider: 'GOOGLE' | 'FACEBOOK'): Promise<any> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qvyqonasrghktgbezlad.supabase.co';
    const redirectUrl = this.getRedirectUrl();
    console.log(`[OAuthService] Initiating ${provider} login with redirect_to:`, redirectUrl);

    // Append prompt=select_account for Google to prevent infinite loading/redirect loops in Chrome Custom Tabs
    const promptParam = provider === 'GOOGLE' ? '&prompt=select_account' : '';
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider.toLowerCase()}&redirect_to=${encodeURIComponent(redirectUrl)}${promptParam}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // On Web, navigate current tab to Supabase
      window.location.href = authUrl;
      return null;
    }

    try {
      try {
        await WebBrowser.warmUpAsync();
      } catch (warmUpErr) {
        console.log('[OAuthService] WebBrowser warmUp non-fatal:', warmUpErr);
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, {
        showInRecents: true,
      });

      console.log('[OAuthService] AuthSession result:', result);

      if (result.type === 'success' && result.url) {
        return await this.processAuthUrl(result.url, provider);
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[OAuthService] User closed or dismissed sign in.');
        return null;
      } else {
        throw new Error('OAuth authentication was not completed.');
      }
    } catch (e: any) {
      console.error('[OAuthService] Error during sign-in:', e.message);
      throw e;
    } finally {
      try {
        WebBrowser.dismissAuthSession();
      } catch {}
      try {
        await WebBrowser.coolDownAsync();
      } catch {}
    }
  }

  public async checkWebHashCallback(): Promise<any> {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    const fullUrl = window.location.href;
    const hasAuthParams =
      fullUrl.includes('access_token=') ||
      fullUrl.includes('code=') ||
      fullUrl.includes('error=') ||
      fullUrl.includes('error_description=');

    if (hasAuthParams) {
      const result = await this.processAuthUrl(fullUrl, 'GOOGLE');
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return result;
    }
    return null;
  }

  public async handleDeepLinkUrl(url: string): Promise<any> {
    if (!url) return null;

    // 1. If user is already authenticated, ignore stale deep links on hot reloads
    if (useUserStore.getState().isAuthenticated) {
      console.log('[OAuthService] User already authenticated - ignoring deep link');
      return null;
    }

    // 2. Check if this exact URL has already been consumed in AsyncStorage
    try {
      const consumed = await AsyncStorage.getItem(CONSUMED_URL_STORAGE_KEY);
      if (consumed === url) {
        console.log('[OAuthService] Ignoring deep link because it was already consumed');
        return null;
      }
    } catch {}

    const hasAuthParams =
      url.includes('access_token=') ||
      url.includes('code=') ||
      url.includes('error=') ||
      url.includes('error_description=');

    if (!hasAuthParams) {
      return null;
    }
    return await this.processAuthUrl(url, 'GOOGLE');
  }

  public async processAuthUrl(url: string, defaultProvider: 'GOOGLE' | 'FACEBOOK' = 'GOOGLE'): Promise<any> {
    try {
      WebBrowser.dismissAuthSession();
    } catch {}

    // Mark URL as consumed in AsyncStorage so reloads won't re-trigger it
    try {
      await AsyncStorage.setItem(CONSUMED_URL_STORAGE_KEY, url);
    } catch {}

    // If the exact same URL was already successfully processed and user is logged in, return cached result
    if (this.lastProcessedUrl === url && this.lastAuthResult && useUserStore.getState().isAuthenticated) {
      return this.lastAuthResult;
    }

    // If already processing this exact URL, join existing promise
    if (this.activeAuthPromise && this.lastProcessedUrl === url) {
      return await this.activeAuthPromise;
    }

    this.lastProcessedUrl = url;
    this.activeAuthPromise = this.executeProcessAuthUrl(url, defaultProvider);

    try {
      this.lastAuthResult = await this.activeAuthPromise;
      return this.lastAuthResult;
    } finally {
      this.activeAuthPromise = null;
    }
  }

  private async executeProcessAuthUrl(url: string, defaultProvider: 'GOOGLE' | 'FACEBOOK' = 'GOOGLE'): Promise<any> {
    console.log('[OAuthService] Processing returning auth URL:', url);
    const params = this.extractParamsFromUrl(url);

    if (params['error'] || params['error_description']) {
      const errorMsg = params['error_description'] || params['error'] || 'OAuth authentication failed';
      throw new Error(errorMsg.replace(/\+/g, ' '));
    }

    let provider: 'GOOGLE' | 'FACEBOOK' = defaultProvider;
    let email = params['email'];
    let fullName = params['full_name'] || `${provider} Driver`;
    let avatarUrl = params['avatar_url'];
    let providerId = params['provider_token'] || params['sub'];

    // Decode Supabase JWT if access_token is present in URL hash/params
    if (params['access_token']) {
      const decoded = this.safeDecodeJwtPayload(params['access_token']);
      if (decoded) {
        if (decoded.email) email = decoded.email;
        if (decoded.sub) providerId = decoded.sub;
        if (decoded.app_metadata?.provider) {
          const p = String(decoded.app_metadata.provider).toUpperCase();
          if (p === 'GOOGLE' || p === 'FACEBOOK') provider = p as 'GOOGLE' | 'FACEBOOK';
        }
        if (decoded.user_metadata?.full_name) fullName = decoded.user_metadata.full_name;
        else if (decoded.user_metadata?.name) fullName = decoded.user_metadata.name;

        if (decoded.user_metadata?.avatar_url) avatarUrl = decoded.user_metadata.avatar_url;
        else if (decoded.user_metadata?.picture) avatarUrl = decoded.user_metadata.picture;
      }
    }

    if (!providerId) {
      providerId = `oauth_${Date.now()}`;
    }

    const oauthPayload = {
      provider,
      providerId,
      email,
      fullName,
      avatarUrl,
    };

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Authentication network request timed out (5s).')), 5000)
    );

    const authResult: any = await Promise.race([
      apiService.oauthLogin(oauthPayload),
      timeoutPromise,
    ]);

    useUserStore.getState().setAuth(authResult.user, authResult.tokens);

    const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';
    try {
      SocketService.getInstance().connect(socketUrl, authResult.tokens.accessToken);
    } catch (sErr) {
      console.warn('Socket connect error:', sErr);
    }

    return authResult;
  }

  private safeDecodeJwtPayload(jwtToken: string): any {
    try {
      const parts = jwtToken.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      let jsonStr = '';
      if (typeof atob === 'function') {
        jsonStr = atob(base64);
      } else if (typeof Buffer !== 'undefined') {
        jsonStr = Buffer.from(base64, 'base64').toString('utf8');
      } else {
        return null;
      }
      try {
        return JSON.parse(decodeURIComponent(escape(jsonStr)));
      } catch {
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn('[OAuthService] Failed to decode JWT payload:', e);
      return null;
    }
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
