import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingNavBar } from '@/components/FloatingNavBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingNavBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen name="selection" />
      <Tabs.Screen name="searcher" />
      <Tabs.Screen name="leaver" />
      <Tabs.Screen name="points" />
    </Tabs>
  );
}
