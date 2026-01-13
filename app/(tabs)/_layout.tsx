
import React, { useRef, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const pagerRef = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(0);

  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'habits',
      route: '/(tabs)/habits',
      icon: 'check-circle',
      label: 'Habits',
    },
    {
      name: 'history',
      route: '/(tabs)/history',
      icon: 'history',
      label: 'History',
    },
    {
      name: 'progress',
      route: '/(tabs)/progress',
      icon: 'trending-up',
      label: 'Progress',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  const getCurrentIndex = () => {
    const currentPath = pathname.split('/').filter(Boolean).pop() || '(home)';
    const index = tabs.findIndex(tab => 
      tab.name === currentPath || 
      (tab.name === '(home)' && (currentPath === '' || currentPath === '(home)'))
    );
    return index >= 0 ? index : 0;
  };

  useEffect(() => {
    const newIndex = getCurrentIndex();
    setCurrentPage(newIndex);
  }, [pathname]);

  const handleTabPress = (index: number) => {
    console.log('User tapped tab:', tabs[index].label);
    setCurrentPage(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(tabs[index].route);
  };

  // Use Stack navigation for all platforms
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="habits" />
        <Stack.Screen name="history" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar 
        tabs={tabs} 
        currentIndex={currentPage}
        onTabPress={handleTabPress}
      />
    </>
  );
}
