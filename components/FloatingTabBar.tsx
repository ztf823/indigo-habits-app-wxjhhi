
import { IconSymbol } from '@/components/IconSymbol';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { colors } from '@/styles/commonStyles';
import { BlurView } from 'expo-blur';

export interface TabBarItem {
  route: Href;
  label: string;
  ios_icon_name: string;
  android_material_icon_name: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
  onTabPress?: (index: number) => void;
  currentIndex?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 40,
  borderRadius = 30,
  bottomMargin = 20,
  onTabPress,
  currentIndex = 0,
}: FloatingTabBarProps) {
  const router = useRouter();
  const theme = useTheme();
  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    const tabWidth = containerWidth / tabs.length;
    indicatorPosition.value = withSpring(currentIndex * tabWidth, {
      damping: 20,
      stiffness: 90,
    });
  }, [currentIndex, containerWidth, tabs.length, indicatorPosition]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  const handleTabPress = (route: Href, index: number) => {
    console.log(`User tapped tab: ${tabs[index].label}`);
    if (onTabPress) {
      onTabPress(index);
    }
    router.push(route);
  };

  const tabWidth = containerWidth / tabs.length;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, { marginBottom: bottomMargin }]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={[
          styles.container,
          {
            width: containerWidth,
            borderRadius,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              borderRadius: borderRadius - 4,
            },
            animatedIndicatorStyle,
          ]}
        />

        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={`tab-${index}-${tab.label}`}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => handleTabPress(tab.route, index)}
            activeOpacity={0.7}
          >
            <IconSymbol
              ios_icon_name={tab.ios_icon_name}
              android_material_icon_name={tab.android_material_icon_name}
              size={24}
              color={currentIndex === index ? '#6366F1' : '#6B7280'}
            />
            <Text
              style={[
                styles.label,
                {
                  color: currentIndex === index ? '#6366F1' : '#6B7280',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  indicator: {
    position: 'absolute',
    height: '80%',
    backgroundColor: '#EEF2FF',
    top: '10%',
    left: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
