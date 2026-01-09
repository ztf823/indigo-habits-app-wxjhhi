
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import { IconSymbol } from "@/components/IconSymbol";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export default function ProgressScreen() {
  const [streaks, setStreaks] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    checkBackendAndLoadProgress();
  }, []);

  const checkBackendAndLoadProgress = async () => {
    setIsLoading(true);
    
    if (!isBackendConfigured()) {
      console.log("[Progress] Backend not configured, using demo data");
      setBackendReady(false);
      loadDemoData();
      setIsLoading(false);
      return;
    }

    setBackendReady(true);
    await loadProgress();
    setIsLoading(false);
  };

  const loadDemoData = () => {
    setStreaks({
      currentStreak: 3,
      longestStreak: 7,
      totalCompletions: 42,
    });

    setBadges([
      {
        id: "1",
        name: "Getting Started",
        description: "Complete your first day",
        earned: true,
        earnedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "3-Day Warrior",
        description: "Maintain a 3-day streak",
        earned: true,
        earnedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Week Champion",
        description: "Maintain a 7-day streak",
        earned: false,
      },
      {
        id: "4",
        name: "Month Master",
        description: "Maintain a 30-day streak",
        earned: false,
      },
    ]);
  };

  const loadProgress = async () => {
    try {
      console.log("[Progress] Loading progress from backend...");
      
      // TODO: Backend Integration - Load progress data from /api/progress
      const data = await authenticatedApiCall("/api/progress");
      
      if (data) {
        setStreaks({
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          totalCompletions: data.totalCompletions || 0,
        });

        if (data.badges) {
          setBadges(data.badges);
        }
        
        console.log("[Progress] Progress data loaded");
      }
    } catch (error: any) {
      console.error("[Progress] Error loading progress:", error);
      
      if (error.message?.includes("Backend URL not configured")) {
        loadDemoData();
      }
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadProgress();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        {/* Backend Status Banner */}
        {!backendReady && (
          <View style={styles.demoBanner}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color="#F59E0B"
            />
            <Text style={styles.demoBannerText}>
              Demo Mode - Showing sample progress data
            </Text>
          </View>
        )}

        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Track your journey to better habits</Text>

        {/* Streaks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.streaksContainer}>
            <View style={styles.streakCard}>
              <IconSymbol
                ios_icon_name="flame.fill"
                android_material_icon_name="local-fire-department"
                size={32}
                color="#F59E0B"
              />
              <Text style={styles.streakNumber}>{streaks.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={32}
                color="#FFD700"
              />
              <Text style={styles.streakNumber}>{streaks.longestStreak}</Text>
              <Text style={styles.streakLabel}>Longest Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={32}
                color="#10B981"
              />
              <Text style={styles.streakNumber}>{streaks.totalCompletions}</Text>
              <Text style={styles.streakLabel}>Total Completions</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesContainer}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeCardLocked,
                ]}
              >
                <IconSymbol
                  ios_icon_name={badge.earned ? "trophy.fill" : "trophy"}
                  android_material_icon_name={badge.earned ? "emoji-events" : "emoji-events"}
                  size={40}
                  color={badge.earned ? "#FFD700" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.badgeName,
                    !badge.earned && styles.badgeNameLocked,
                  ]}
                >
                  {badge.name}
                </Text>
                <Text
                  style={[
                    styles.badgeDescription,
                    !badge.earned && styles.badgeDescriptionLocked,
                  ]}
                >
                  {badge.description}
                </Text>
                {badge.earned && badge.earnedAt && (
                  <Text style={styles.badgeEarnedDate}>
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <IconSymbol
            ios_icon_name="heart.fill"
            android_material_icon_name="favorite"
            size={24}
            color="#EC4899"
          />
          <Text style={styles.motivationText}>
            {streaks.currentStreak > 0
              ? `Amazing! You're on a ${streaks.currentStreak}-day streak. Keep it up!`
              : "Start your journey today! Complete your first habit to begin your streak."}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  demoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#E0E7FF",
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 16,
  },
  streaksContainer: {
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 12,
    textAlign: "center",
  },
  badgeNameLocked: {
    color: "#9CA3AF",
  },
  badgeDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  badgeDescriptionLocked: {
    color: "#9CA3AF",
  },
  badgeEarnedDate: {
    fontSize: 10,
    color: "#10B981",
    marginTop: 8,
    fontWeight: "500",
  },
  motivationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});
