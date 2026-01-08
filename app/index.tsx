
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

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

  if (hasSeenWelcome === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (hasSeenWelcome) {
    return <Redirect href="/(tabs)/(home)/" />;
  }

  return <Redirect href="/welcome" />;
}
