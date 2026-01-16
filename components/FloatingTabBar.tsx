
import { IconSymbol } from '@/components/IconSymbol';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import React, { useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { Href } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface TabBarItem {
  name: string;
  route: Href;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
  onTabPress?: (index: number) => void;
  currentIndex?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FloatingTabBar({
  tabs,
  containerWidth = SCREEN_WIDTH - 40,
  borderRadius = 24,
  bottomMargin = 20,
  onTabPress,
  currentIndex = 0,
}: FloatingTabBarProps) {
  const { colors: themeColors } = useTheme();
  const router = useRouter();

  // Animated value for the indicator position
  const indicatorPosition = useSharedValue(currentIndex);

  useEffect(() => {
    indicatorPosition.value = withSpring(currentIndex, {
      damping: 20,
      stiffness: 90,
    });
  }, [currentIndex, indicatorPosition]);

  const handleTabPress = (route: Href, index: number) => {
    if (onTabPress) {
      onTabPress(index);
    } else {
      router.push(route);
    }
  };

  const tabWidth = containerWidth / tabs.length;

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(indicatorPosition.value * tabWidth, {
            damping: 20,
            stiffness: 90,
          }),
        },
      ],
    };
  });

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { marginBottom: bottomMargin }]}>
      <View style={[styles.container, { width: containerWidth, borderRadius }]}>
        <BlurView intensity={80} tint="light" style={[styles.blurContainer, { borderRadius }]}>
          {/* Animated indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                borderRadius: borderRadius / 2,
              },
              indicatorStyle,
            ]}
          />

          {/* Tab buttons */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab, index) => {
              const isActive = index === currentIndex;

              return (
                <TouchableOpacity
                  key={`tab-${tab.name}`}
                  style={[styles.tab, { width: tabWidth }]}
                  onPress={() => handleTabPress(tab.route, index)}
                  activeOpacity={0.7}
                >
                  <Animated.View style={styles.tabContent}>
                    <IconSymbol
                      ios_icon_name={tab.icon}
                      android_material_icon_name={tab.icon}
                      size={24}
                      color={isActive ? '#4B0082' : colors.text}
                      style={styles.icon}
                    />
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isActive ? '#4B0082' : colors.text,
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
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
    ...Platform.select({
      web: {
        pointerEvents: 'box-none',
      },
      default: {},
    }),
  },
  container: {
    height: 70,
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
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 8,
    left: 0,
    height: 54,
    backgroundColor: 'rgba(75, 0, 130, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(75, 0, 130, 0.2)',
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});
