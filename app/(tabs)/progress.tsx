
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { BACKEND_URL } from "@/utils/api";

interface StreakData {
  affirmationStreak: number;
  taskStreak: number;
  journalStreak: number;
  combinedStreak: number;
  longestStreak: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export default function ProgressScreen() {
  const [loading, setLoading] = useState(true);
  const [streaks, setStreaks] = useState<StreakData>({
    affirmationStreak: 0,
    taskStreak: 0,
    journalStreak: 0,
    combinedStreak: 0,
    longestStreak: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/progress`);
      if (response.ok) {
        const data = await response.json();
        setStreaks({
          affirmationStreak: data.affirmationStreak || 0,
          taskStreak: data.taskStreak || 0,
          journalStreak: data.currentStreak || 0,
          combinedStreak: data.combinedStreak || 0,
          longestStreak: data.longestStreak || 0,
        });
        setBadges(data.badges || []);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your Progress</Text>

        {/* Streaks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Streaks</Text>
          
          <View style={styles.streakCard}>
            <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto_awesome" size={32} color="#F59E0B" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Affirmation Streak</Text>
              <Text style={styles.streakValue}>{streaks.affirmationStreak} days</Text>
            </View>
          </View>

          <View style={styles.streakCard}>
            <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={32} color="#10B981" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Task Streak</Text>
              <Text style={styles.streakValue}>{streaks.taskStreak} days</Text>
            </View>
          </View>

          <View style={styles.streakCard}>
            <IconSymbol ios_icon_name="book.fill" android_material_icon_name="menu_book" size={32} color="#3B82F6" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Journal Streak</Text>
              <Text style={styles.streakValue}>{streaks.journalStreak} days</Text>
            </View>
          </View>

          <View style={[styles.streakCard, styles.combinedCard]}>
            <IconSymbol ios_icon_name="flame.fill" android_material_icon_name="local_fire_department" size={40} color="#EF4444" />
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Combined Streak</Text>
              <Text style={[styles.streakValue, styles.combinedValue]}>{streaks.combinedStreak} days</Text>
              <Text style={styles.longestStreak}>Longest: {streaks.longestStreak} days</Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeCard, !badge.earned && styles.badgeLocked]}
              >
                <Text style={styles.badgeIcon}>
                  {badge.id === "bronze" ? "🥉" : badge.id === "silver" ? "🥈" : "🥇"}
                </Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                {badge.earned && badge.earnedAt && (
                  <Text style={styles.badgeEarned}>
                    Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                  </Text>
                )}
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
    paddingTop: 60,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  combinedCard: {
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderWidth: 2,
    borderColor: "#EF4444",
  },
  streakInfo: {
    marginLeft: 16,
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  combinedValue: {
    fontSize: 28,
    color: "#EF4444",
  },
  longestStreak: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  badgeEarned: {
    fontSize: 10,
    color: "#10B981",
    marginTop: 8,
  },
});
