import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { AppHeader } from '@/components/AppHeader';
import { useUserStore } from '@/stores/useUserStore';

export default function SelectionScreen() {
  const router = useRouter();

  useEffect(() => {
    useUserStore.getState().setLastRoute('/selection');
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Section */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>Ready to Park?</Text>
            <Text style={styles.subtitle}>Choose an action below to get started.</Text>
          </View>

          {/* Action Cards */}
          <View style={styles.actionsContainer}>
            {/* I'm Searching Button */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/searcher')}
              activeOpacity={0.88}
            >
              <MaterialIcons
                name="search"
                size={40}
                color={Theme.colors.darkTeal}
                style={styles.actionIcon}
              />
              <Text style={styles.actionTitle}>I'M SEARCHING</Text>
              <Text style={styles.actionSubtitle}>Find an available parking spot near you</Text>
            </TouchableOpacity>

            {/* I'm Leaving Button */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/leaver')}
              activeOpacity={0.88}
            >
              <MaterialIcons
                name="exit-to-app"
                size={40}
                color={Theme.colors.darkTeal}
                style={styles.actionIcon}
              />
              <Text style={styles.actionTitle}>I'M LEAVING</Text>
              <Text style={styles.actionSubtitle}>Release your spot and earn points</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceIce,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 28,
    color: Theme.colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 16,
    color: Theme.colors.outline,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: 20,
    alignItems: 'center',
  },
  actionCard: {
    width: '78%',
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.default,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 8px 30px rgba(0, 109, 119, 0.14)',
      },
    }),
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 18,
    color: Theme.colors.darkTeal,
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.primary,
    opacity: 0.85,
    textAlign: 'center',
  },
});
