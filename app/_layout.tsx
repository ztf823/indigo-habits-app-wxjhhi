import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { initDatabase, isDatabaseReady, retryDatabaseInit } from "@/utils/database";
import { useTheme } from "@/contexts/ThemeContext";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { setHabitCompletion } from "@/utils/database";
import { getLocalDateKey, setPlannedItemCompleted } from "@/utils/planner";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    let active = true;
    async function prepare() {
      try {
        await initDatabase();
        if (!isDatabaseReady()) {
          await retryDatabaseInit();
        }
        if (!isDatabaseReady()) {
          throw new Error("Database could not be opened. Your saved data is still on this device.");
        }
        if (active) {
          setStartupError(null);
          setIsReady(true);
        }
      } catch (error) {
        console.error("[App] Database initialization failed:", error);
        if (active) {
          setStartupError(error instanceof Error ? error.message : "Unable to open the app data store.");
        }
      }
    }

    void prepare();
    return () => {
      active = false;
    };
  }, []);

  const retryStartup = useCallback(async () => {
    setIsRetrying(true);
    try {
      const ready = await retryDatabaseInit();
      if (!ready) throw new Error("Database is still unavailable. Please try again.");
      setStartupError(null);
      setIsReady(true);
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : "Unable to open the app data store.");
    } finally {
      setIsRetrying(false);
    }
  }, []);

  if (startupError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#080D5C" }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Can’t open Indigo Habits</Text>
        <Text style={{ color: "#DCE4FF", fontSize: 16, textAlign: "center", marginBottom: 24 }}>{startupError}</Text>
        <Pressable onPress={retryStartup} disabled={isRetrying} style={{ minWidth: 140, padding: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#0B5FFF" }}>
          {isRetrying ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Retry</Text>}
        </Pressable>
      </View>
    );
  }

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { isDark } = useTheme();
  const router = useRouter();
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as { type?: string; habitId?: string; taskId?: string; route?: string; date?: string };
      const action = response.actionIdentifier;
      if (action === "snooze") {
        const original = response.notification.request.content;
        const originalTrigger = response.notification.request.trigger;
        const channelId = (originalTrigger as any)?.channelId;
        await Notifications.scheduleNotificationAsync({ content: { title: original.title ?? "Reminder", body: original.body ?? "", data: original.data ?? {}, sound: original.sound ?? "default", categoryIdentifier: original.categoryIdentifier ?? undefined }, trigger: { ...(channelId ? { channelId } : {}), type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600, repeats: false } });
        return;
      }
      const date = typeof data.date === "string" ? data.date : getLocalDateKey();
      if (action === "complete" && data.habitId) await setHabitCompletion(data.habitId, date, true);
      if (action === "complete" && data.taskId) await setPlannedItemCompleted(data.taskId, date, true);
      if (data.type === "journal" || data.route === "/reflection") router.push("/reflection" as any);
      else if (data.habitId || data.taskId) router.push({ pathname: "/(tabs)/calendar", params: { date, item: data.habitId || data.taskId } } as any);
      else if (data.type === "affirmation") router.push("/(tabs)" as any);
      else if (data.route) router.push(data.route as any);
    });
    return () => subscription.remove();
  }, [router]);
  return (
    <WidgetProvider>
      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: { backgroundColor: isDark ? "#080D2B" : "#FFFFFF" },
          }}
        >
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="reflection" />
          <Stack.Screen name="voice-plan" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen name="formsheet" options={{ presentation: "formSheet" }} />
          <Stack.Screen name="transparent-modal" options={{ presentation: "transparentModal" }} />
          <Stack.Screen name="entry/[id]" />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </NavigationThemeProvider>
    </WidgetProvider>
  );
}
