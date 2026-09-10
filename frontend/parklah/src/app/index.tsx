import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { GoogleIcon, FacebookIcon } from '@/components/SocialIcons';
import { oauthService } from '@/services/OAuthService';
import { apiService } from '@/services/ApiService';
import { useUserStore } from '@/stores/useUserStore';
import { SocketService } from '@/services/SocketService';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated);

  // 1. Auto-navigate if session was restored from AsyncStorage
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user) {
      const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      const token = useUserStore.getState().authToken;
      if (token) {
        try {
          SocketService.getInstance().connect(socketUrl, token);
        } catch (sErr) {
          console.warn('[LoginScreen] Socket connect error:', sErr);
        }
      }
      const targetRoute = useUserStore.getState().lastRoute || '/selection';
      router.replace(targetRoute as any);
    }
  }, [hasHydrated, isAuthenticated, user]);

  // 2. Dev quick bypass login
  const handleDevQuickLogin = () => {
    setIsLoading(true);
    try {
      const devUser = {
        id: 'usr_dev_tester',
        email: 'dev.tester@parklah.my',
        fullName: 'Dev Driver (Bypass)',
        authProvider: 'DEV_MOCK',
        reliabilityRating: 5.0,
        totalCompletedMatches: 12,
      };
      const devTokens = {
        accessToken: 'dev_mock_access_token_' + Date.now(),
        refreshToken: 'dev_mock_refresh_token',
        expiresIn: 86400 * 30,
      };

      useUserStore.getState().setAuth(devUser, devTokens);

      const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';
      try {
        SocketService.getInstance().connect(socketUrl, devTokens.accessToken);
      } catch (sErr) {
        console.warn('[DevLogin] Socket connect error:', sErr);
      }

      const targetRoute = useUserStore.getState().lastRoute || '/selection';
      router.replace(targetRoute as any);
    } catch (err: any) {
      console.warn('[LoginScreen] Dev login error:', err);
      Alert.alert('Dev Login Error', err.message || 'Failed to perform dev login');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Auto-login in development if EXPO_PUBLIC_DEV_AUTO_LOGIN is set to true
  useEffect(() => {
    if (
      hasHydrated &&
      !isAuthenticated &&
      process.env.EXPO_PUBLIC_DEV_AUTO_LOGIN === 'true'
    ) {
      handleDevQuickLogin();
    }
  }, [hasHydrated, isAuthenticated]);

  useEffect(() => {
    // Only process deep links if hydrated and NOT already authenticated
    if (!hasHydrated || isAuthenticated) {
      return;
    }

    // 1. Web callback
    oauthService.checkWebHashCallback().then((result) => {
      if (result) {
        const targetRoute = useUserStore.getState().lastRoute || '/selection';
        router.replace(targetRoute as any);
      }
    }).catch((err: any) => {
      console.warn('Web OAuth error:', err.message);
      Alert.alert('Google Sign-In Failed', err.message || 'Authentication could not be completed.');
    });

    // 2. Mobile cold-start deep link callback (only if not consumed and not authenticated)
    Linking.getInitialURL().then((url) => {
      if (url && !useUserStore.getState().isAuthenticated) {
        oauthService.handleDeepLinkUrl(url).then((res) => {
          if (res) {
            const targetRoute = useUserStore.getState().lastRoute || '/selection';
            router.replace(targetRoute as any);
          }
        }).catch((err: any) => {
          console.warn('Cold start auth non-fatal error:', err.message);
        });
      }
    });

    // 3. Mobile active deep link listener (returning from Chrome / browser)
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      try {
        try {
          WebBrowser.dismissAuthSession();
        } catch {}
        const res = await oauthService.handleDeepLinkUrl(url);
        if (res) {
          const targetRoute = useUserStore.getState().lastRoute || '/selection';
          router.replace(targetRoute as any);
        }
      } catch (e: any) {
        console.warn('Deep link login handler error:', e.message);
        Alert.alert('Google Sign-In Failed', e.message || 'Authentication could not be completed.');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [hasHydrated, isAuthenticated]);

  const handleLogin = async () => {
    const cleanId = emailOrPhone.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      Alert.alert('Required Field', 'Please enter your email or phone number.');
      return;
    }

    if (!cleanPass) {
      Alert.alert('Required Field', 'Please enter your password.');
      return;
    }

    if (cleanPass.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name to create an account.');
      return;
    }

    setIsLoading(true);
    try {
      let res: any;
      if (isSignUp) {
        res = await apiService.register({
          fullName: fullName.trim(),
          emailOrPhone: cleanId,
          password: cleanPass,
        });
      } else {
        res = await apiService.login({
          emailOrPhone: cleanId,
          password: cleanPass,
        });
      }

      if (res && res.tokens && res.user) {
        useUserStore.getState().setAuth(res.user, res.tokens);
        const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';
        try {
          SocketService.getInstance().connect(socketUrl, res.tokens.accessToken);
        } catch (sErr) {
          console.warn('[LoginScreen] Socket connect error:', sErr);
        }
        router.replace('/selection');
      } else {
        throw new Error('Authentication response did not return valid user session.');
      }
    } catch (err: any) {
      console.warn('[LoginScreen] Authentication error:', err.message);
      Alert.alert(
        isSignUp ? 'Sign-Up Failed' : 'Login Failed',
        err.message || 'Unable to authenticate. Please check your credentials.',
      );
      // Explicitly stay on screen - do NOT navigate on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'GOOGLE' | 'FACEBOOK') => {
    try {
      const res = await oauthService.signInWithProvider(provider);
      if (res && res.tokens) {
        router.replace('/selection');
      }
    } catch (e: any) {
      console.warn('OAuth sign in error:', e.message);
      Alert.alert(
        `${provider === 'GOOGLE' ? 'Google' : 'Facebook'} Sign-In Failed`,
        e.message || 'Authentication could not be completed.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            {/* Brand & Heading */}
            <View style={styles.headerContainer}>
              <Text style={styles.brandTitle}>ParkLah</Text>
              <Text style={styles.welcomeTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Sign up to start sharing and finding parking.' : 'Sign in to manage your parking.'}
              </Text>
            </View>

            {/* Inputs */}
            <View style={styles.formContainer}>
              {/* Full Name Input (Sign Up Only) */}
              {isSignUp && (
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="badge"
                    size={22}
                    color={Theme.colors.outline}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor={Theme.colors.outlineVariant}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!isLoading}
                  />
                </View>
              )}

              {/* Email/Phone Input */}
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="person-outline"
                  size={22}
                  color={Theme.colors.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Email or Phone"
                  placeholderTextColor={Theme.colors.outlineVariant}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="lock-outline"
                  size={22}
                  color={Theme.colors.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  placeholder="Password"
                  placeholderTextColor={Theme.colors.outlineVariant}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.visibilityButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={Theme.colors.outline}
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot Password (Sign In Only) */}
              {!isSignUp && (
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Password Recovery', 'Please contact support or sign in via Google OAuth to access your account.')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Action Button */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  activeOpacity={0.88}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Theme.colors.stormyTeal} />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>{isSignUp ? 'CREATE ACCOUNT' : 'LOGIN'}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={Theme.colors.stormyTeal} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Dev Quick Bypass Button */}
                {__DEV__ && (
                  <TouchableOpacity
                    style={styles.devQuickButton}
                    onPress={handleDevQuickLogin}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <MaterialIcons name="bolt" size={18} color={Theme.colors.stormyTeal} />
                    <Text style={styles.devQuickButtonText}>QUICK DEV LOGIN (BYPASS)</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or login with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('GOOGLE')}
                activeOpacity={0.75}
              >
                <GoogleIcon size={20} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('FACEBOOK')}
                activeOpacity={0.75}
              >
                <FacebookIcon size={20} />
                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text
                  style={styles.signUpText}
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 40,
    color: Theme.colors.stormyTeal,
    marginBottom: 16,
    letterSpacing: -1,
  },
  welcomeTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 26,
    color: Theme.colors.stormyTeal,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.borderRadius.default,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 15,
    color: Theme.colors.onSurface,
    height: '100%',
  },
  passwordInput: {
    paddingRight: 8,
  },
  visibilityButton: {
    padding: 6,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 13,
    color: Theme.colors.stormyTeal,
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: 52,
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.full,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 6px 16px rgba(0, 109, 119, 0.18)',
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: Theme.colors.stormyTeal,
    letterSpacing: 2,
  },
  devQuickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: 44,
    backgroundColor: 'rgba(157, 224, 219, 0.22)',
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: Theme.colors.pearlAqua,
    borderStyle: 'dashed',
    marginTop: 12,
    gap: 6,
  },
  devQuickButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 12,
    color: Theme.colors.stormyTeal,
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(190, 200, 202, 0.4)',
  },
  dividerText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.outlineVariant,
    paddingHorizontal: 12,
  },
  socialContainer: {
    gap: 12,
    width: '90%',
    alignSelf: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 202, 0.45)',
    backgroundColor: Theme.colors.surface,
    gap: 12,
  },
  socialButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 36,
  },
  footerText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 14,
    color: Theme.colors.onSurfaceVariant,
  },
  signUpText: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    color: Theme.colors.stormyTeal,
  },
});
