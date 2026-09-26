import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { height } = useWindowDimensions();
  const tabRoutes = useMemo(() => [
    '/(tabs)/(home)/',
    '/(tabs)/habits',
    '/(tabs)/history',
    '/(tabs)/progress',
    '/(tabs)/profile',
  ], []);
  const segments = pathname.split('/').filter(Boolean);
  const activeRoute = segments.includes('(home)') ? '(home)' : segments[segments.length - 1];
  const activeIndex = Math.max(0, tabRoutes.findIndex((route) =>
    activeRoute === '(home)' ? route.includes('(home)') : route.endsWith(`/${activeRoute}`)
  ));
  const pageSwipe = useMemo(() => Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .runOnJS(true)
    .onEnd((event) => {
      // Leave the native tab bar to handle taps; horizontal swipes on page content
      // move between tabs while vertical scrolling remains unaffected.
      if (event.absoluteY >= height - 100) return;
      if (Math.abs(event.velocityX) <= 300 && Math.abs(event.translationX) <= 100) return;
      const direction = Math.abs(event.velocityX) > 300 ? event.velocityX : event.translationX;
      const nextIndex = direction < 0
        ? (activeIndex + 1) % tabRoutes.length
        : (activeIndex - 1 + tabRoutes.length) % tabRoutes.length;
      router.navigate(tabRoutes[nextIndex] as any);
    }), [activeIndex, height, router, tabRoutes]);

  return (
    <GestureDetector gesture={pageSwipe}>
      <View style={{ flex: 1 }}>
        <NativeTabs>
          <NativeTabs.Trigger key="home" name="(home)">
            <Icon sf="house.fill" />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger key="habits" name="habits">
            <Icon sf="checkmark.circle.fill" />
            <Label>Habits</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger key="history" name="history">
            <Icon sf="clock.fill" />
            <Label>History</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger key="progress" name="progress">
            <Icon sf="chart.line.uptrend.xyaxis" />
            <Label>Progress</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger key="profile" name="profile">
            <Icon sf="person.fill" />
            <Label>Profile</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </View>
    </GestureDetector>
  );
}
