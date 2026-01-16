
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const pagerRef = useRef<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(0);

  const tabs = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/' as any,
      label: 'Home',
      ios_icon_name: 'house.fill',
      android_material_icon_name: 'home',
    },
    {
      name: 'habits',
      route: '/(tabs)/habits' as any,
      label: 'Habits',
      ios_icon_name: 'checkmark.circle.fill',
      android_material_icon_name: 'check-circle',
    },
    {
      name: 'history',
      route: '/(tabs)/history' as any,
      label: 'History',
      ios_icon_name: 'clock.fill',
      android_material_icon_name: 'history',
    },
    {
      name: 'progress',
      route: '/(tabs)/progress' as any,
      label: 'Progress',
      ios_icon_name: 'chart.line.uptrend.xyaxis',
      android_material_icon_name: 'trending-up',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile' as any,
      label: 'Profile',
      ios_icon_name: 'person.fill',
      android_material_icon_name: 'person',
    },
  ];

  const getCurrentIndex = useCallback(() => {
    const currentPath = pathname.split('/').filter(Boolean).pop() || '(home)';
    const index = tabs.findIndex(tab => 
      tab.name === currentPath || 
      (tab.name === '(home)' && (currentPath === '' || currentPath === '(home)'))
    );
    return index >= 0 ? index : 0;
  }, [pathname]);

  useEffect(() => {
    const newIndex = getCurrentIndex();
    setCurrentPage(newIndex);
  }, [pathname, getCurrentIndex]);

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
