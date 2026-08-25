import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { AppHeader } from '@/components/AppHeader';

interface Transaction {
  id: string;
  title: string;
  time: string;
  amount: number;
  type: 'debit' | 'credit';
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Downtown Garage',
    time: 'Today, 2:30 PM',
    amount: -15,
    type: 'debit',
    icon: 'local-parking',
  },
  {
    id: '2',
    title: 'Top Up',
    time: 'Yesterday, 10:00 AM',
    amount: 200,
    type: 'credit',
    icon: 'add-circle-outline',
  },
  {
    id: '3',
    title: 'Shared Driveway',
    time: 'Oct 24, 6:00 PM',
    amount: 50,
    type: 'credit',
    icon: 'share-location',
  },
];

export default function PointsScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(450);

  const handleBuyPoints = () => {
    Alert.alert(
      'Buy Points',
      'Select a points package:',
      [
        {
          text: '100 Points ($10)',
          onPress: () => {
            setBalance((prev) => prev + 100);
            Alert.alert('Success', 'Added 100 points to your wallet!');
          },
        },
        {
          text: '250 Points ($22)',
          onPress: () => {
            setBalance((prev) => prev + 250);
            Alert.alert('Success', 'Added 250 points to your wallet!');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEarnOption = (type: 'share' | 'invite') => {
    if (type === 'share') {
      Alert.alert(
        'Share a Spot',
        'When you leave a parking space, submit your plate to notify other drivers and earn 50 points!'
      );
    } else {
      Alert.alert(
        'Invite Friends',
        'Share your referral code: PARKLAL88 to earn 100 bonus points for each friend who signs up.'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of ParkLah?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            {/* Decorative Bubbles */}
            <View style={styles.decorBubbleTopRight} />
            <View style={styles.decorBubbleBottomLeft} />

            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>

            <View style={styles.balanceValueRow}>
              <MaterialIcons
                name="monetization-on"
                size={36}
                color={Theme.colors.stormyTeal}
                style={styles.coinIcon}
              />
              <Text style={styles.balanceNumber}>{balance}</Text>
              <Text style={styles.balanceUnit}>Points</Text>
            </View>

            <TouchableOpacity
              style={styles.buyButton}
              onPress={handleBuyPoints}
              activeOpacity={0.88}
            >
              <Text style={styles.buyButtonText}>Buy More Points</Text>
            </TouchableOpacity>
          </View>

          {/* Ways to Earn */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Ways to Earn</Text>

            <View style={styles.earnGrid}>
              {/* Option 1: Share a Spot */}
              <TouchableOpacity
                style={styles.earnCard}
                onPress={() => handleEarnOption('share')}
                activeOpacity={0.75}
              >
                <View style={[styles.earnIconCircle, { backgroundColor: Theme.colors.secondaryContainer }]}>
                  <MaterialIcons
                    name="share-location"
                    size={22}
                    color={Theme.colors.onSecondaryContainer}
                  />
                </View>
                <View style={styles.earnInfo}>
                  <Text style={styles.earnTitle}>Share a Spot</Text>
                  <Text style={styles.earnDesc}>Earn 50 points for every spot shared.</Text>
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={14}
                  color={Theme.colors.primary}
                />
              </TouchableOpacity>

              {/* Option 2: Invite Friends */}
              <TouchableOpacity
                style={styles.earnCard}
                onPress={() => handleEarnOption('invite')}
                activeOpacity={0.75}
              >
                <View style={[styles.earnIconCircle, { backgroundColor: Theme.colors.tertiaryFixed }]}>
                  <MaterialIcons
                    name="person-add"
                    size={22}
                    color={Theme.colors.tertiary}
                  />
                </View>
                <View style={styles.earnInfo}>
                  <Text style={styles.earnTitle}>Invite Friends</Text>
                  <Text style={styles.earnDesc}>Get 100 points when they sign up.</Text>
                </View>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={14}
                  color={Theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityContainer}>
              {TRANSACTIONS.map((item, index) => {
                const isDebit = item.type === 'debit';
                const isLast = index === TRANSACTIONS.length - 1;
                return (
                  <View
                    key={item.id}
                    style={[styles.activityItem, !isLast && styles.activityItemBorder]}
                  >
                    <View style={styles.activityLeft}>
                      <View
                        style={[
                          styles.activityIconCircle,
                          isDebit
                            ? { backgroundColor: Theme.colors.errorContainer }
                            : { backgroundColor: Theme.colors.secondaryContainer },
                        ]}
                      >
                        <MaterialIcons
                          name={item.icon}
                          size={18}
                          color={
                            isDebit
                              ? Theme.colors.onErrorContainer
                              : Theme.colors.onSecondaryContainer
                          }
                        />
                      </View>

                      <View>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <Text style={styles.activityTime}>{item.time}</Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.activityAmount,
                        isDebit ? styles.debitText : styles.creditText,
                      ]}
                    >
                      {isDebit ? `- ${Math.abs(item.amount)}` : `+ ${item.amount}`} Points
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={20} color={Theme.colors.error} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
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
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 20,
  },
  balanceCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 6px 18px rgba(0, 109, 119, 0.08)',
      },
    }),
  },
  decorBubbleTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Theme.colors.secondaryContainer,
    opacity: 0.25,
  },
  decorBubbleBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Theme.colors.primaryContainer,
    opacity: 0.12,
  },
  balanceLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 18,
  },
  coinIcon: {
    alignSelf: 'center',
  },
  balanceNumber: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 36,
    color: Theme.colors.stormyTeal,
  },
  balanceUnit: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 16,
    color: Theme.colors.onSurfaceVariant,
  },
  buyButton: {
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 10px rgba(0, 109, 119, 0.14)',
      },
    }),
  },
  buyButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 13,
    color: Theme.colors.darkTeal,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  viewAllText: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 13,
    color: Theme.colors.stormyTeal,
  },
  earnGrid: {
    gap: 10,
  },
  earnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    padding: 14,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  earnIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  earnDesc: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  activityContainer: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainer,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  activityTime: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  activityAmount: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 13,
  },
  debitText: {
    color: Theme.colors.error,
  },
  creditText: {
    color: Theme.colors.stormyTeal,
  },
  logoutContainer: {
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: Theme.borderRadius.default,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#ffd0d0',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  logoutButtonText: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 14,
    color: Theme.colors.error,
  },
});
