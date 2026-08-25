import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Theme } from '@/constants/theme';

export type NavTab = 'leaver' | 'searcher' | 'points';

export function FloatingNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const currentRouteName = state?.routes[state.index]?.name || '';

  const tabs: { key: NavTab; icon: keyof typeof MaterialIcons.glyphMap; name: string }[] = [
    {
      key: 'searcher',
      icon: 'search',
      name: 'searcher',
    },
    {
      key: 'leaver',
      icon: 'exit-to-app',
      name: 'leaver',
    },
    {
      key: 'points',
      icon: 'account-balance-wallet',
      name: 'points',
    },
  ];

  const handleTabPress = (tabName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: tabName,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(tabName);
    }
  };

  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.wrapper, { bottom: bottomInset }]}>
      <View style={styles.navContainer}>
        {tabs.map((tab) => {
          const isFocused = currentRouteName === tab.name;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isFocused && styles.activeTabButton]}
              onPress={() => handleTabPress(tab.name, isFocused)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={tab.icon}
                size={isFocused ? 26 : 24}
                color={isFocused ? Theme.colors.darkTeal : Theme.colors.outline}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 380,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primaryContainer,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 8px 30px rgba(0, 109, 119, 0.14)',
      },
    }),
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    backgroundColor: Theme.colors.pearlAqua,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 109, 119, 0.2)',
      },
    }),
  },
});
