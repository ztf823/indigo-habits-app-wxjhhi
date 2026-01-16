
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import { IconSymbol } from "@/components/IconSymbol";
import { getStreakData } from "@/utils/database";
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
  daysRequired: number;
  earned: boolean;
  earnedAt?: string;
  glowColor: string;
}

const BADGES: Badge[] = [
  { id: "1", name: "Indigo Warrior", description: "3-day streak", daysRequired: 3, earned: false, glowColor: "#4B0082" },
  { id: "2", name: "Indigo Guardian", description: "7-day streak", daysRequired: 7, earned: false, glowColor: "#5B1A9E" },
  { id: "3", name: "Indigo Sentinel", description: "14-day streak", daysRequired: 14, earned: false, glowColor: "#6B2AB8" },
  { id: "4", name: "Indigo Champion", description: "21-day streak", daysRequired: 21, earned: false, glowColor: "#7B3AD2" },
  { id: "5", name: "Indigo Legend", description: "30-day streak", daysRequired: 30, earned: false, glowColor: "#8B4AEC" },
  { id: "6", name: "Indigo Sovereign", description: "60-day streak", daysRequired: 60, earned: false, glowColor: "#9B5AFF" },
  { id: "7", name: "Indigo Eternal", description: "90-day streak", daysRequired: 90, earned: false, glowColor: "#AB6AFF" },
  { id: "8", name: "Indigo Vanguard", description: "120-day streak", daysRequired: 120, earned: false, glowColor: "#BB7AFF" },
  { id: "9", name: "Indigo Titan", description: "150-day streak", daysRequired: 150, earned: false, glowColor: "#CB8AFF" },
  { id: "10", name: "Indigo Immortal", description: "180-day streak", daysRequired: 180, earned: false, glowColor: "#DB9AFF" },
  { id: "11", name: "Indigo Apex", description: "240-day streak", daysRequired: 240, earned: false, glowColor: "#EBAAFF" },
  { id: "12", name: "Indigo Master", description: "365-day streak", daysRequired: 365, earned: false, glowColor: "#FFD700" },
];

export default function ProgressScreen() {
  const [streaks, setStreaks] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
  });
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const loadProgress = async () => {
    setIsLoading(true);
    
    try {
      console.log("[Progress] Loading progress from SQLite...");
      
      // Load streak data from database
      const streakData = await getStreakData();
      setStreaks(streakData as StreakData);
      console.log("[Progress] Loaded streak data:", streakData);

      // Update badges based on current streak
      const updatedBadges = BADGES.map(badge => ({
        ...badge,
        earned: (streakData as StreakData).longestStreak >= badge.daysRequired,
        earnedAt: (streakData as StreakData).longestStreak >= badge.daysRequired ? new Date().toISOString() : undefined,
      }));
      setBadges(updatedBadges);
      
    } catch (error) {
      console.error("[Progress] Error loading progress:", error);
    }
    
    setIsLoading(false);
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

  // Find next badge to earn
  const nextBadge = badges.find(b => !b.earned);

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
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

        {/* Next Badge Section */}
        {nextBadge && (
          <View style={styles.nextBadgeCard}>
            <Text style={styles.nextBadgeTitle}>Next Badge</Text>
            <View style={styles.nextBadgeContent}>
              <View style={[styles.nextBadgeIcon, { backgroundColor: nextBadge.glowColor + "20" }]}>
                <IconSymbol
                  ios_icon_name="trophy"
                  android_material_icon_name="emoji-events"
                  size={40}
                  color={nextBadge.glowColor}
                />
              </View>
              <View style={styles.nextBadgeInfo}>
                <Text style={styles.nextBadgeName}>{nextBadge.name}</Text>
                <Text style={styles.nextBadgeDescription}>
                  {nextBadge.daysRequired - streaks.longestStreak} more days to unlock
                </Text>
              </View>
            </View>
          </View>
        )}

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
                <View
                  style={[
                    styles.badgeIconContainer,
                    badge.earned && { backgroundColor: badge.glowColor + "20" },
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={badge.earned ? "trophy.fill" : "trophy"}
                    android_material_icon_name="emoji-events"
                    size={40}
                    color={badge.earned ? badge.glowColor : "#9CA3AF"}
                  />
                </View>
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
                  <View style={styles.earnedBadge}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={16}
                      color="#10B981"
                    />
                    <Text style={styles.earnedText}>Earned</Text>
                  </View>
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
    paddingTop: 60,
    paddingBottom: 100,
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
  nextBadgeCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBadgeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  nextBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  nextBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  nextBadgeInfo: {
    flex: 1,
  },
  nextBadgeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  nextBadgeDescription: {
    fontSize: 14,
    color: "#6B7280",
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
    opacity: 0.5,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 8,
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
  earnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  earnedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
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
