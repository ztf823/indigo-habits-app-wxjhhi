
import { authenticatedApiCall } from "@/utils/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";

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
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const data = await authenticatedApiCall("/api/progress");
      setStreaks({
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        totalCompletions: data.totalCompletions,
      });
      setBadges(data.badges);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProgress();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#6366F1", "#87CEEB"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Your Progress</Text>

        {/* Streaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.streaksGrid}>
            <View style={styles.streakCard}>
              <IconSymbol 
                ios_icon_name="flame.fill" 
                android_material_icon_name="local-fire-department" 
                size={32} 
                color="#F59E0B" 
              />
              <Text style={styles.streakNumber}>{streaks?.currentStreak || 0}</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={32} 
                color="#FFD700" 
              />
              <Text style={styles.streakNumber}>{streaks?.longestStreak || 0}</Text>
              <Text style={styles.streakLabel}>Longest Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check-circle" 
                size={32} 
                color="#10B981" 
              />
              <Text style={styles.streakNumber}>{streaks?.totalCompletions || 0}</Text>
              <Text style={styles.streakLabel}>Total Completions</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeCardLocked,
                ]}
              >
                <IconSymbol
                  ios_icon_name={badge.earned ? "trophy.fill" : "lock.fill"}
                  android_material_icon_name={badge.earned ? "emoji-events" : "lock"}
                  size={32}
                  color={badge.earned ? "#FFD700" : "#9CA3AF"}
                />
                <Text style={[
                  styles.badgeName,
                  !badge.earned && styles.badgeNameLocked,
                ]}>
                  {badge.name}
                </Text>
                <Text style={[
                  styles.badgeDescription,
                  !badge.earned && styles.badgeDescriptionLocked,
                ]}>
                  {badge.description}
                </Text>
              </View>
            ))}
          </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
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
  streaksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeCardLocked: {
    opacity: 0.5,
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
    textAlign: "center",
    marginTop: 4,
  },
  badgeDescriptionLocked: {
    color: "#D1D5DB",
  },
});
