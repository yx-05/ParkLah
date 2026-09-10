import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

interface AppHeaderProps {
  showBack?: boolean;
  showNotifications?: boolean;
  title?: string;
  onNotificationPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({
  showBack = false,
  showNotifications = true,
  title = 'ParkLah',
  onNotificationPress,
  style,
}: AppHeaderProps) {
  const router = useRouter();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setShowNotificationModal(true);
    }
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back-ios-new" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          )}

          <Text style={styles.title}>{title}</Text>
        </View>

        {showNotifications && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBellPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="notifications-none" size={24} color={Theme.colors.primary} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        )}
      </View>

      {/* Pilot Launch Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header Icon & Close */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconCircle}>
                <MaterialIcons name="campaign" size={26} color={Theme.colors.darkTeal} />
              </View>
              <TouchableOpacity
                onPress={() => setShowNotificationModal(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={20} color={Theme.colors.outline} />
              </TouchableOpacity>
            </View>

            {/* Title & Badge */}
            <View style={styles.badgeRow}>
              <Text style={styles.pilotBadge}>PILOT LAUNCH</Text>
              <Text style={styles.dateText}>v1.0 Early Access</Text>
            </View>

            <Text style={styles.modalTitle}>Welcome to ParkLah Pilot!</Text>

            <Text style={styles.modalDescription}>
              You are among the first drivers to experience our peer-to-peer parking matchmaking system.
            </Text>

            {/* Highlights List */}
            <ScrollView style={styles.highlightsContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.highlightItem}>
                <View style={styles.highlightIcon}>
                  <MaterialIcons name="swap-horizontal-circle" size={20} color={Theme.colors.stormyTeal} />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Smart Spot Exchange</Text>
                  <Text style={styles.highlightText}>
                    Seamlessly match with drivers leaving their parking bays in real-time.
                  </Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <View style={styles.highlightIcon}>
                  <MaterialIcons name="stars" size={20} color={Theme.colors.starGold} />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Pilot Rewards: +50 Points</Text>
                  <Text style={styles.highlightText}>
                    Earn bonus Points every time you release a spot during our pilot testing phase.
                  </Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <View style={styles.highlightIcon}>
                  <MaterialIcons name="rate-review" size={20} color={Theme.colors.stormyTeal} />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>We Value Your Feedback</Text>
                  <Text style={styles.highlightText}>
                    Help us refine the experience as we expand to more commercial hubs!
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowNotificationModal(false)}
              activeOpacity={0.88}
            >
              <Text style={styles.modalButtonText}>Got it, let's ParkLah!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    zIndex: 40,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 22,
    color: Theme.colors.stormyTeal,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.colors.pearlAqua,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 30, 35, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 22,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.pearlAqua,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pilotBadge: {
    backgroundColor: Theme.colors.pearlAqua,
    color: Theme.colors.darkTeal,
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  modalTitle: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 20,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  modalDescription: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 13,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 16,
  },
  highlightsContainer: {
    marginBottom: 18,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Theme.colors.surfaceIce,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
  },
  highlightIcon: {
    marginTop: 2,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
    marginBottom: 2,
  },
  highlightText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    lineHeight: 16,
  },
  modalButton: {
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 109, 119, 0.16)',
      },
    }),
  },
  modalButtonText: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: 14,
    color: Theme.colors.darkTeal,
  },
});
