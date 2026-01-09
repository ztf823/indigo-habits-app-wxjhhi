
import React, { useRef, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Conditionally import PagerView only for native platforms
let PagerView: any = null;
if (Platform.OS !== 'web') {
  PagerView = require('react-native-pager-view').default;
}

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
    if (Platform.OS !== 'web' && pagerRef.current) {
      pagerRef.current.setPageWithoutAnimation(newIndex);
    }
  }, [pathname]);

  const handlePageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    setCurrentPage(index);
    
    // Haptic feedback on page change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (tabs[index]) {
      router.push(tabs[index].route);
    }
  };

  const handlePageScrollStateChanged = (e: any) => {
    // Add subtle haptic feedback when starting to drag
    if (e.nativeEvent.pageScrollState === 'dragging') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleTabPress = (index: number) => {
    setCurrentPage(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (Platform.OS !== 'web' && pagerRef.current) {
      pagerRef.current.setPage(index);
    } else {
      router.push(tabs[index].route);
    }
  };

  // For web, use Stack with smooth transitions
  if (Platform.OS === 'web') {
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

  // For native, use PagerView for smooth swipe navigation
  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={getCurrentIndex()}
        onPageSelected={handlePageSelected}
        onPageScrollStateChanged={handlePageScrollStateChanged}
        overdrag={true}
        scrollEnabled={true}
        offscreenPageLimit={1}
      >
        <View key="0" collapsable={false}>
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
        </View>
        <View key="1" collapsable={false}>
          <Stack.Screen name="habits" options={{ headerShown: false }} />
        </View>
        <View key="2" collapsable={false}>
          <Stack.Screen name="history" options={{ headerShown: false }} />
        </View>
        <View key="3" collapsable={false}>
          <Stack.Screen name="progress" options={{ headerShown: false }} />
        </View>
        <View key="4" collapsable={false}>
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </View>
      </PagerView>
      
      <FloatingTabBar 
        tabs={tabs} 
        currentIndex={currentPage}
        onTabPress={handleTabPress}
      />
    </View>
  );
}
