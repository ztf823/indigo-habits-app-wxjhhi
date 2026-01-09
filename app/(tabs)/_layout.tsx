
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useRouter, usePathname } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import HomeScreen from './(home)/index';
import ProgressScreen from './progress';
import HistoryScreen from './history';
import HabitsScreen from './habits';
import ProfileScreen from './profile';

export default function TabLayout() {
  const pagerRef = useRef<PagerView>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);

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
      icon: 'show-chart',
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
      icon: 'check-circle',
      label: 'Habits',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  // Map pathname to page index
  useEffect(() => {
    const getPageIndex = () => {
      if (pathname.includes('/(home)') || pathname === '/(tabs)') return 0;
      if (pathname.includes('/progress')) return 1;
      if (pathname.includes('/history')) return 2;
      if (pathname.includes('/habits')) return 3;
      if (pathname.includes('/profile')) return 4;
      return 0;
    };

    const pageIndex = getPageIndex();
    if (pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
      pagerRef.current?.setPage(pageIndex);
    }
  }, [pathname]);

  const handlePageSelected = (e: any) => {
    const position = e.nativeEvent.position;
    setCurrentPage(position);
    router.push(tabs[position].route);
  };

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="0" style={styles.page}>
          <HomeScreen />
        </View>
        <View key="1" style={styles.page}>
          <ProgressScreen />
        </View>
        <View key="2" style={styles.page}>
          <HistoryScreen />
        </View>
        <View key="3" style={styles.page}>
          <HabitsScreen />
        </View>
        <View key="4" style={styles.page}>
          <ProfileScreen />
        </View>
      </PagerView>
      <FloatingTabBar 
        tabs={tabs} 
        onTabPress={handleTabPress}
        currentIndex={currentPage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
