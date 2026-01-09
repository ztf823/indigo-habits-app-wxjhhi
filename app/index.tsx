
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function checkWelcomeStatus() {
      try {
        const welcomeStatus = await AsyncStorage.getItem("hasSeenWelcome");
        setHasSeenWelcome(welcomeStatus === "true");
      } catch (error) {
        console.error("Error checking welcome status:", error);
        setHasSeenWelcome(false);
      }
    }

    checkWelcomeStatus();
  }, []);

  if (hasSeenWelcome === null || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // If user hasn't seen welcome, show welcome screen
  if (!hasSeenWelcome) {
    return <Redirect href="/welcome" />;
  }

  // If user is not authenticated, redirect to auth
  if (!user) {
    return <Redirect href="/auth" />;
  }

  // User is authenticated, go to home
  return <Redirect href="/(tabs)/(home)/" />;
}
