
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { initDatabase, isDatabaseReady, retryDatabaseInit } from "@/utils/database";
import { initializeRevenueCat } from "@/utils/revenueCat";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  // Catch any unhandled promise rejections before they reach the native bridge
  // and trigger RCTFatal on iOS 26 Beta
  useEffect(() => {
    const handler = (event: any) => {
      console.warn('[App] Unhandled promise rejection caught:', event?.reason ?? event);
      if (event?.preventDefault) event.preventDefault();
    };
    // @ts-expect-error global may not have addEventListener in all envs
    if (typeof global !== 'undefined' && global.addEventListener) {
      // @ts-expect-error global may not have addEventListener in all envs
      global.addEventListener('unhandledrejection', handler);
      // @ts-expect-error global may not have removeEventListener in all envs
      return () => global.removeEventListener('unhandledrejection', handler);
    }
  }, []);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        if (!isDatabaseReady()) {
          // First attempt failed — try once more after a short delay
          console.warn('[App] Database init failed, retrying in 500ms...');
          await new Promise(resolve => setTimeout(resolve, 500));
          await retryDatabaseInit();
        }
        if (!isDatabaseReady()) {
          console.error('[App] Database unavailable after retry — app will run in degraded mode');
        }
      } catch (error) {
        console.error('[App] Unexpected error during prepare:', error);
      } finally {
        setIsReady(true);
      }
    }

    if (loaded) {
      prepare();
    }
  }, [loaded]);

  // Fire RevenueCat init AFTER the app has rendered — never block launch on it
  useEffect(() => {
    if (loaded && isReady) {
      initializeRevenueCat().catch((e) =>
        console.warn("[App] RevenueCat background init error:", e)
      );
    }
  }, [loaded, isReady]);

  useEffect(() => {
    if (loaded && isReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isReady]);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <WidgetProvider>
          <NavigationThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <SystemBars style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "none",
              }}
            >
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
              <Stack.Screen name="formsheet" options={{ presentation: "formSheet" }} />
              <Stack.Screen name="transparent-modal" options={{ presentation: "transparentModal" }} />
              <Stack.Screen name="entry/[id]" />
            </Stack>
            <StatusBar style="light" />
          </NavigationThemeProvider>
        </WidgetProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
