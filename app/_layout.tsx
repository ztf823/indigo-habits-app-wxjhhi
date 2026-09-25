
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View, Text, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { colors } from "@/styles/commonStyles";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { initDatabase } from "@/utils/database";
import { initializeRevenueCat } from "@/utils/revenueCat";
import { initializeNotifications } from "@/utils/notifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(console.warn);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  const [storageError, setStorageError] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const [loaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontError) console.warn('[App] Font load error (continuing anyway):', fontError);
  }, [fontError]);

  const prepare = useCallback(async () => {
    setPreparing(true);
    setStorageError(false);
    try {
      await initDatabase();
      setIsReady(true);
    } catch (error) {
      console.error('[App] Local storage initialization failed:', error);
      setStorageError(true);
    } finally {
      setPreparing(false);
      await SplashScreen.hideAsync().catch(console.warn);
    }
  }, []);

  useEffect(() => {
    if (loaded || fontError) void prepare();
  }, [loaded, fontError, prepare]);

  // Fire RevenueCat init AFTER the app has rendered — never block launch on it
  useEffect(() => {
    if ((loaded || fontError) && isReady) {
      initializeNotifications().catch((e) =>
        console.warn("[App] Notification setup error:", e)
      );
      initializeRevenueCat().catch((e) =>
        console.warn("[App] RevenueCat background init error:", e)
      );
    }
  }, [loaded, fontError, isReady]);

  useEffect(() => {
    if ((loaded || fontError) && isReady) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [loaded, fontError, isReady]);

  if (storageError || (preparing && !isReady)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 28, backgroundColor: colors.gradientStart }}>
        <StatusBar style="light" />
        {preparing ? <ActivityIndicator color={colors.secondary} size="large" /> : <>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Unable to open your journal</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
            {Platform.OS === 'web'
              ? 'This browser could not open secure local storage. Try again, or use the installed Indigo Habits app. Your existing data has not been reset.'
              : 'Your local storage could not be opened. Please try again or restart the app. Your existing data has not been reset.'}
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => void prepare()} style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Try again</Text>
          </TouchableOpacity>
        </>}
      </View>
    );
  }

  if ((!loaded && !fontError) || !isReady) {
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
