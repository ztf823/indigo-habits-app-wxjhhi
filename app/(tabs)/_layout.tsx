
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

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

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    let nextIndex: number;

    if (direction === 'right') {
      // Swipe right = go to previous tab (or wrap to last)
      nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    } else {
      // Swipe left = go to next tab (or wrap to first)
      nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    }

    console.log(`User swiped ${direction}, navigating from ${tabs[currentIndex].label} to ${tabs[nextIndex].label}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentPage(nextIndex);
    router.push(tabs[nextIndex].route);
  }, [getCurrentIndex, router, tabs]);

  // Create pan gesture for horizontal swipes
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Require 20px horizontal movement to activate
    .failOffsetY([-15, 15]) // Fail if vertical movement exceeds 15px (preserves vertical scroll)
    .onEnd((event) => {
      const { velocityX, translationX } = event;
      
      // Determine swipe direction based on velocity and translation
      // Swipe right (positive velocity/translation) = previous tab
      // Swipe left (negative velocity/translation) = next tab
      if (Math.abs(velocityX) > 300 || Math.abs(translationX) > 100) {
        if (velocityX > 0 || translationX > 0) {
          // Swiped right
          navigateToTab('right');
        } else {
          // Swiped left
          navigateToTab('left');
        }
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
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
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
