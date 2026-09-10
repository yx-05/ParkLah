import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { oauthService } from '@/services/OAuthService';
import { Theme } from '@/constants/theme';
import { useUserStore } from '@/stores/useUserStore';

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [statusText, setStatusText] = useState('Completing secure sign-in...');
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  useEffect(() => {
    let isMounted = true;

    // 1. Wait until user store has rehydrated from AsyncStorage
    if (!hasHydrated) {
      return;
    }

    // 2. If already authenticated, IMMEDIATELY navigate away (never reprocess stale URLs!)
    if (isAuthenticated) {
      const targetRoute = useUserStore.getState().lastRoute || '/selection';
      router.replace(targetRoute as any);
      return;
    }

    // 3. Fallback safety timer: guarantees the screen NEVER hangs forever (max 3 seconds)
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('[AuthCallbackScreen] Fallback timeout triggered - redirecting');
        try {
          WebBrowser.dismissAuthSession();
        } catch {}
        if (useUserStore.getState().isAuthenticated) {
          const target = useUserStore.getState().lastRoute || '/selection';
          router.replace(target as any);
        } else {
          router.replace('/');
        }
      }
    }, 3000);

    async function processUrl(url: string | null) {
      if (!url) return false;

      const hasAuthData =
        url.includes('access_token=') ||
        url.includes('code=') ||
        url.includes('error=') ||
        url.includes('error_description=');

      if (!hasAuthData) return false;

      try {
        WebBrowser.dismissAuthSession();
      } catch {}

      try {
        const res = await oauthService.handleDeepLinkUrl(url);
        if (res && res.tokens) {
          if (isMounted) {
            clearTimeout(safetyTimer);
            const target = useUserStore.getState().lastRoute || '/selection';
            router.replace(target as any);
          }
          return true;
        }
      } catch (err: any) {
        console.warn('[AuthCallbackScreen] Authentication error:', err.message);
        if (isMounted) {
          clearTimeout(safetyTimer);
          Alert.alert('Google Sign-In Failed', err.message || 'Authentication could not be completed.');
          router.replace('/');
        }
        return true;
      }
      return false;
    }

    async function init() {
      const initialUrl = await Linking.getInitialURL();
      const handled = await processUrl(initialUrl);

      if (!handled && typeof window !== 'undefined' && window.location?.href) {
        await processUrl(window.location.href);
      }

      if (!handled && isMounted && !useUserStore.getState().isAuthenticated) {
        clearTimeout(safetyTimer);
        router.replace('/');
      }
    }

    init();

    // Listen for incoming deep link events while screen is active
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      await processUrl(url);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.remove();
    };
  }, [hasHydrated, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Theme.colors.stormyTeal} />
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontFamily: Theme.typography.fontFamily.medium,
    color: Theme.colors.stormyTeal,
    fontSize: 16,
  },
});
