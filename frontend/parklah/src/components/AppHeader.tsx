import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
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

  return (
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
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="notifications-none" size={24} color={Theme.colors.primary} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      )}
    </View>
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
});
