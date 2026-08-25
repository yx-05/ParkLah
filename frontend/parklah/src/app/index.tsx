import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { GoogleIcon, FacebookIcon } from '@/components/SocialIcons';

export default function LoginScreen() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Navigate to Selection / Main flow
    router.replace('/selection');
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
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to manage your parking.</Text>
            </View>

            {/* Inputs */}
            <View style={styles.formContainer}>
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

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordContainer} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  activeOpacity={0.88}
                >
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                  <MaterialIcons name="chevron-right" size={20} color={Theme.colors.stormyTeal} />
                </TouchableOpacity>
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
                onPress={handleLogin}
                activeOpacity={0.75}
              >
                <GoogleIcon size={20} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleLogin}
                activeOpacity={0.75}
              >
                <FacebookIcon size={20} />
                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.signUpText} onPress={handleLogin}>
                  Sign Up
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
  loginButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: Theme.colors.stormyTeal,
    letterSpacing: 2,
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
