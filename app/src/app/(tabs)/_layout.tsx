import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { palette } from '@/lib/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.charcoal,
          borderTopColor: palette.line,
        },
        tabBarActiveTintColor: palette.terracotta,
        tabBarInactiveTintColor: palette.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Гардероб',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👗" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: 'Образы',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Добавить',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
