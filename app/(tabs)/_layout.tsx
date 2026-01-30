import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerTitle: '10 Minute Gita',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 20,
          },
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
          headerTitle: t('progressCard.yourProgress'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          headerTitle: t('tabs.settings'),
        }}
      />
    </Tabs>
  );
}
