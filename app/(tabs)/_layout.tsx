
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'progress',
      route: '/(tabs)/progress',
      icon: 'show_chart',
      label: 'Progress',
    },
    {
      name: 'history',
      route: '/(tabs)/history',
      icon: 'history',
      label: 'History',
    },
    {
      name: 'habits',
      route: '/(tabs)/habits',
      icon: 'checklist',
      label: 'Habits',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="progress" name="progress" />
        <Stack.Screen key="history" name="history" />
        <Stack.Screen key="habits" name="habits" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar 
        tabs={tabs} 
        containerWidth={screenWidth * 0.95}
        bottomMargin={16}
      />
    </>
  );
}
