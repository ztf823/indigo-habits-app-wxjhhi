
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DayStatus } from "@/types";

export default function ProgressScreen() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [calendarDays, setCalendarDays] = useState<DayStatus[]>([]);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // TODO: Backend Integration - Fetch user progress data from backend
      // For now, load from AsyncStorage
      const streak = await AsyncStorage.getItem("currentStreak");
      if (streak) setCurrentStreak(parseInt(streak));

      const longest = await AsyncStorage.getItem("longestStreak");
      if (longest) setLongestStreak(parseInt(longest));

      const total = await AsyncStorage.getItem("totalDays");
      if (total) setTotalDays(parseInt(total));

      // Generate calendar for current month
      generateCalendar();
    } catch (error) {
      console.error("Error loading progress data:", error);
    }
  };

  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: DayStatus[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date: date.toISOString().split("T")[0],
        completed: Math.random() > 0.5, // TODO: Replace with actual data
        habitsCompleted: 0,
        totalHabits: 3,
      });
    }
    setCalendarDays(days);
  };

  const getMonthName = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const availableBadges = [
    { id: "first_day", name: "First Day", icon: "star", earned: true },
    { id: "week_streak", name: "7 Day Streak", icon: "local-fire-department", earned: true },
    { id: "month_streak", name: "30 Day Streak", icon: "emoji-events", earned: false },
    { id: "perfect_week", name: "Perfect Week", icon: "check-circle", earned: true },
    { id: "early_bird", name: "Early Bird", icon: "wb-sunny", earned: false },
    { id: "night_owl", name: "Night Owl", icon: "nightlight", earned: false },
  ];

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="flame.fill"
              android_material_icon_name="local-fire-department"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="trophy.fill"
              android_material_icon_name="emoji-events"
              size={32}
              color={colors.accent}
            />
            <Text style={styles.statNumber}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar-today"
              size={32}
              color={colors.secondary}
            />
            <Text style={styles.statNumber}>{totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>{getMonthName()}</Text>
          <View style={styles.calendarGrid}>
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <React.Fragment key={`day-label-${index}`}>
                <Text style={styles.dayLabel}>
                  {day}
                </Text>
              </React.Fragment>
            ))}
            {calendarDays.map((day, index) => (
              <React.Fragment key={`calendar-day-${index}`}>
                <View
                  style={[
                    styles.calendarDay,
                    day.completed && styles.calendarDayCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      day.completed && styles.calendarDayTextCompleted,
                    ]}
                  >
                    {new Date(day.date).getDate()}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgesCard}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesGrid}>
            {availableBadges.map((badge, index) => (
              <React.Fragment key={`badge-${index}`}>
                <View
                  style={[
                    styles.badgeItem,
                    !badge.earned && styles.badgeItemLocked,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={badge.icon}
                    android_material_icon_name={badge.icon}
                    size={32}
                    color={badge.earned ? colors.accent : colors.iconSilver}
                  />
                  <Text
                    style={[
                      styles.badgeName,
                      !badge.earned && styles.badgeNameLocked,
                    ]}
                  >
                    {badge.name}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayLabel: {
    width: "12%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  calendarDay: {
    width: "12%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarDayCompleted: {
    backgroundColor: colors.accentGlow,
    borderColor: colors.accent,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  calendarDayTextCompleted: {
    color: colors.accent,
  },
  badgesCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeItem: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  badgeItemLocked: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
    marginTop: 8,
    textAlign: "center",
  },
  badgeNameLocked: {
    color: colors.textSecondary,
  },
});
