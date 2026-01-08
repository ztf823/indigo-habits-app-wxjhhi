
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { SuperwallProvider } from "expo-superwall";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isConnected } = useNetworkState();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SuperwallProvider
        apiKeys={{
          ios: "pk_d1efaba5b8e9b1f5e8e5e5e5e5e5e5e5", // TODO: Replace with actual Superwall API key
          android: "pk_d1efaba5b8e9b1f5e8e5e5e5e5e5e5e5", // TODO: Replace with actual Superwall API key
        }}
        onConfigurationError={(error) => {
          console.error("Superwall configuration error:", error);
        }}
      >
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
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </WidgetProvider>
      </SuperwallProvider>
    </GestureHandlerRootView>
  );
}
