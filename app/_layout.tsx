import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { initDatabase, isDatabaseReady, retryDatabaseInit } from "@/utils/database";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [loaded, fontError] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.warn("[App] Font load error (continuing anyway):", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (!loaded && !fontError) return;

    let active = true;
    async function prepare() {
      try {
        await initDatabase();
        if (!isDatabaseReady()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await retryDatabaseInit();
        }
      } catch (error) {
        console.warn("[App] Database initialization failed; continuing:", error);
      } finally {
        if (active) setIsReady(true);
      }
    }

    void prepare();
    return () => {
      active = false;
    };
  }, [loaded, fontError]);

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
