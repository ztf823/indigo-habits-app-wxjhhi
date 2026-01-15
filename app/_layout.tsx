
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      setIsReady(true);
    }
  }, [loaded]);

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
      <WidgetProvider>
        <ThemeProvider
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
        </ThemeProvider>
      </WidgetProvider>
    </GestureHandlerRootView>
  );
}
