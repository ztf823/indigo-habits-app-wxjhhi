
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean | null>(null);

  useEffect(() => {
    console.log("Index screen: Checking splash status");
    async function checkSplashStatus() {
      try {
        const splashStatus = await AsyncStorage.getItem("hasSeenSplash");
        console.log("Splash status from storage:", splashStatus);
        setHasSeenSplash(splashStatus === "true");
      } catch (error) {
        console.error("Error checking splash status:", error);
        setHasSeenSplash(false);
      }
    }

    checkSplashStatus();
  }, []);

  if (hasSeenSplash === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#4B0082" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Always show splash on first launch, then go directly to home
  if (!hasSeenSplash) {
    console.log("Redirecting to splash screen");
    // Mark as seen immediately
    AsyncStorage.setItem("hasSeenSplash", "true").catch(console.error);
    return <Redirect href="/splash" />;
  }

  // Go directly to home
  console.log("Redirecting to home screen");
  return <Redirect href="/(tabs)/(home)/" />;
}
