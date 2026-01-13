
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    console.log("Index screen: Checking welcome status");
    async function checkWelcomeStatus() {
      try {
        const welcomeStatus = await AsyncStorage.getItem("hasSeenWelcome");
        console.log("Welcome status from storage:", welcomeStatus);
        setHasSeenWelcome(welcomeStatus === "true");
      } catch (error) {
        console.error("Error checking welcome status:", error);
        setHasSeenWelcome(false);
      }
    }

    checkWelcomeStatus();
  }, []);

  if (hasSeenWelcome === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#4F46E5" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // If user hasn't seen welcome, show welcome screen
  if (!hasSeenWelcome) {
    console.log("Redirecting to welcome screen");
    return <Redirect href="/welcome" />;
  }

  // Skip auth - go directly to home
  console.log("Redirecting to home screen");
  return <Redirect href="/(tabs)/(home)/" />;
}
