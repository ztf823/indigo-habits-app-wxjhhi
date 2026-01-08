
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const [streak, setStreak] = useState<number>(0);
  const [totalEntries, setTotalEntries] = useState<number>(0);

  const loadProgressData = useCallback(async () => {
    try {
      const savedStreak = await AsyncStorage.getItem("streak");
      const savedEntries = await AsyncStorage.getItem("totalEntries");
      
      if (savedStreak) setStreak(parseInt(savedStreak));
      if (savedEntries) setTotalEntries(parseInt(savedEntries));
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  return (
    <LinearGradient colors={["#4F46E5", "#06B6D4"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Your Progress</Text>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalEntries}</Text>
              <Text style={styles.statLabel}>Total Entries</Text>
            </View>
          </View>

          <View style={styles.badgesCard}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <Text style={styles.comingSoon}>Coming soon...</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Keep journaling daily to build your streak and unlock achievements!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 20 : 0,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  badgesCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 20,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
