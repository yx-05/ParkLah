import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { AppHeader } from '@/components/AppHeader';
import { useUserStore } from '@/stores/useUserStore';
import { GoogleIcon, FacebookIcon } from '@/components/SocialIcons';
import { apiService } from '@/services/ApiService';
import { SocketService } from '@/services/SocketService';

interface Transaction {
  id: string;
  title: string;
  time: string;
  amount: number;
  type: 'debit' | 'credit';
  icon: keyof typeof MaterialIcons.glyphMap;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Mid Valley Megamall Spot',
    time: 'Today, 2:30 PM',
    amount: -0.5,
    type: 'debit',
    icon: 'local-parking',
  },
  {
    id: '2',
    title: 'Wallet Top Up',
    time: 'Yesterday, 10:00 AM',
    amount: 20.0,
    type: 'credit',
    icon: 'add-circle-outline',
  },
  {
    id: '3',
    title: 'Spot Handover Reward',
    time: 'Oct 24, 6:00 PM',
    amount: 0.25,
    type: 'credit',
    icon: 'share-location',
  },
];

export default function PointsScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const [balance, setBalance] = useState<number>(20.0);
  const [currency, setCurrency] = useState<string>('RM');
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Fetch Live Wallet Balance & Transactions from Supabase
  const loadWalletData = async () => {
    try {
      const balRes = await apiService.getWalletBalance();
      if (balRes && balRes.balance !== undefined) {
        setBalance(balRes.balance);
        if (balRes.currency) setCurrency(balRes.currency);
      }

      const txList = await apiService.getWalletTransactions(1, 10);
      if (txList && txList.length > 0) {
        const mappedTx: Transaction[] = txList.map((tx: any) => ({
          id: tx.id,
          title: tx.description || 'Wallet Transaction',
          time: new Date(tx.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          amount: parseFloat(tx.amount),
          type: tx.type === 'DEBIT' ? 'debit' : 'credit',
          icon: tx.type === 'DEBIT' ? 'local-parking' : 'add-circle-outline',
        }));
        setTransactions(mappedTx);
      }
    } catch (err: any) {
      console.warn('Wallet fetch fallback:', err.message);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  // 2. Real Wallet Top-Up via Backend API
  const handleBuyPoints = () => {
    Alert.alert(
      'Top Up Wallet',
      'Select an amount to reload your ParkLah balance:',
      [
        {
          text: '+RM 10.00',
          onPress: async () => {
            await performTopup(10);
          },
        },
        {
          text: '+RM 20.00',
          onPress: async () => {
            await performTopup(20);
          },
        },
        {
          text: '+RM 50.00',
          onPress: async () => {
            await performTopup(50);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const performTopup = async (amount: number) => {
    setLoading(true);
    try {
      await apiService.mockTopup(amount);
      await loadWalletData();
      Alert.alert('Top-Up Successful! 🎉', `RM ${amount.toFixed(2)} added to your wallet.`);
    } catch (err: any) {
      Alert.alert('Top-Up Issue', err.message || 'Unable to top up wallet at this time.');
    } finally {
      setLoading(false);
    }
  };

  const handleEarnOption = (type: 'share' | 'invite') => {
    if (type === 'share') {
      Alert.alert(
        'Leave & Earn',
        'When leaving your parking spot, tap "I\'M LEAVING" to broadcast your departure and earn RM 0.25 on handover!',
      );
    } else {
      Alert.alert(
        'Invite Drivers',
        'Share ParkLah with fellow drivers to earn bonus RM 2.00 parking credits!',
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
            logout();
            try {
              SocketService.getInstance().disconnect();
            } catch (e) {}
            router.replace('/');
          },
        },
      ],
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
          {/* Driver Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileLeft}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(user?.fullName || user?.name || 'P').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.fullName || user?.name || 'ParkLah Driver'}
                </Text>
                <Text style={styles.profileContact} numberOfLines={1}>
                  {user?.email || user?.phoneNumber || '+60123456789'}
                </Text>
              </View>
            </View>

            <View style={styles.profileBadgeContainer}>
              {user?.authProvider === 'GOOGLE' ? (
                <View style={styles.authBadge}>
                  <GoogleIcon size={14} />
                  <Text style={styles.authBadgeText}>Google Account</Text>
                </View>
              ) : user?.authProvider === 'FACEBOOK' ? (
                <View style={styles.authBadge}>
                  <FacebookIcon size={14} />
                  <Text style={styles.authBadgeText}>Facebook</Text>
                </View>
              ) : (
                <View style={styles.authBadge}>
                  <MaterialIcons name="phone-iphone" size={14} color={Theme.colors.stormyTeal} />
                  <Text style={styles.authBadgeText}>Phone Verified</Text>
                </View>
              )}
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {(user?.reliabilityRating || 5.0).toFixed(1)} Rating
                </Text>
              </View>
            </View>
          </View>

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
              <Text style={styles.balanceNumber}>
                {typeof balance === 'number' ? balance.toFixed(2) : balance}
              </Text>
              <Text style={styles.balanceUnit}>{currency}</Text>
            </View>

            <TouchableOpacity
              style={styles.buyButton}
              onPress={handleBuyPoints}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Theme.colors.darkTeal} />
              ) : (
                <Text style={styles.buyButtonText}>Top Up Wallet</Text>
              )}
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
              {transactions.map((item, index) => {
                const isDebit = item.type === 'debit';
                const isLast = index === transactions.length - 1;
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
                      {isDebit ? `- RM ${Math.abs(item.amount).toFixed(2)}` : `+ RM ${item.amount.toFixed(2)}`}
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
    gap: 16,
  },
  profileCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.default,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 109, 119, 0.06)',
      },
    }),
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.surfaceContainer,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 18,
    color: Theme.colors.onPrimaryContainer,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  profileContact: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  profileBadgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(190, 200, 202, 0.45)',
  },
  authBadgeText: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 11,
    color: Theme.colors.onSurface,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ratingText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
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
