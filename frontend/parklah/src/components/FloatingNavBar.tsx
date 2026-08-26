import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  LayoutRectangle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Theme } from '@/constants/theme';

export type NavTab = 'selection' | 'searcher' | 'leaver' | 'points';

export function FloatingNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentRouteName = state?.routes[state.index]?.name || '';

  const tabs: {
    key: NavTab;
    icon: keyof typeof MaterialIcons.glyphMap;
    name: string;
    label: string;
  }[] = [
    {
      key: 'selection',
      icon: 'home',
      name: 'selection',
      label: 'Home',
    },
    {
      key: 'searcher',
      icon: 'search',
      name: 'searcher',
      label: 'Search',
    },
    {
      key: 'leaver',
      icon: 'exit-to-app',
      name: 'leaver',
      label: 'Leave',
    },
    {
      key: 'points',
      icon: 'account-balance-wallet',
      name: 'points',
      label: 'Points',
    },
  ];

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.name === currentRouteName)
  );

  const [layouts, setLayouts] = useState<{ [key: number]: LayoutRectangle }>({});
  const isFirstRender = useRef(true);

  const translateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(64)).current;

  const handleTabLayout = (index: number, layout: LayoutRectangle) => {
    setLayouts((prev) => ({ ...prev, [index]: layout }));
  };

  useEffect(() => {
    const currentLayout = layouts[activeIndex];
    if (currentLayout) {
      if (isFirstRender.current) {
        translateX.setValue(currentLayout.x);
        pillWidth.setValue(currentLayout.width);
        isFirstRender.current = false;
      } else {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: currentLayout.x,
            useNativeDriver: false,
            bounciness: 6,
            speed: 16,
          }),
          Animated.spring(pillWidth, {
            toValue: currentLayout.width,
            useNativeDriver: false,
            bounciness: 6,
            speed: 16,
          }),
        ]).start();
      }
    }
  }, [activeIndex, layouts]);

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
        {/* Animated Sliding Highlight Pill */}
        {layouts[activeIndex] && (
          <Animated.View
            style={[
              styles.slidingHighlight,
              {
                left: translateX,
                width: pillWidth,
              },
            ]}
          />
        )}

        {/* Navigation Tab Buttons */}
        {tabs.map((tab, index) => {
          const isFocused = currentRouteName === tab.name;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onLayout={(e) => handleTabLayout(index, e.nativeEvent.layout)}
              onPress={() => handleTabPress(tab.name, isFocused)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={tab.icon}
                size={22}
                color={isFocused ? Theme.colors.darkTeal : Theme.colors.outline}
              />
              <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
                {tab.label}
              </Text>
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
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  navContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 400,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 8,
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
  slidingHighlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    backgroundColor: Theme.colors.pearlAqua,
    borderRadius: 20,
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.stormyTeal,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 3px 10px rgba(0, 109, 119, 0.16)',
      },
    }),
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 62,
    zIndex: 2,
  },
  tabLabel: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: 10.5,
    color: Theme.colors.outline,
    marginTop: 2,
  },
  activeTabLabel: {
    fontFamily: Theme.typography.fontFamily.bold,
    color: Theme.colors.darkTeal,
  },
});
