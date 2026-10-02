
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Switch,
} from "react-native";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import {
  getAllHabits,
  getAllAffirmations,
  createHabit,
  updateHabit,
  deleteHabit,
  createAffirmation,
  updateAffirmation,
  deleteAffirmation,
} from "@/utils/database";
import { playChime } from "@/utils/sounds";
import {
  removeHabitReminder,
  getHabitReminderTime,
} from "@/utils/notifications";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/styles/commonStyles";
import { ALL_DAYS, WEEKDAYS, getAllHabitSchedules, getAffirmationSchedules, saveHabitSchedule, removeHabitSchedule, saveAffirmationSchedule, removeAffirmationSchedule, HabitSchedule, AffirmationSchedule, formatTime, normalizeTime, sortTimes, timeToMinutes, getIntervalTimes } from "@/utils/planner";
import { scheduleAffirmationReminders, cancelAffirmationReminders, scheduleHabitReminder, cancelHabitReminder } from "@/utils/notifications";
import TimePickerField from "@/components/TimePickerField";
import { usePremium } from "@/hooks/usePremium";

interface Habit {
  id: string;
  title: string;
  color: string;
  isActive: number;
  isRepeating: number;
  orderIndex?: number;
}

interface Affirmation {
  id: string;
  text: string;
  isCustom: number;
  isFavorite: number;
  isRepeating: number;
  orderIndex?: number;
}

const COLORS = [
  "#10B981", // Green
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
];

// Default habits matching home screen
const DEFAULT_HABITS = [
  { title: "Morning meditation", color: "#10B981" },
  { title: "Exercise", color: "#3B82F6" },
  { title: "Read 10 pages", color: "#F59E0B" },
  { title: "Drink 8 glasses of water", color: "#06B6D4" },
  { title: "Practice gratitude", color: "#8B5CF6" },
];

export default function HabitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editAffirmation?: string; scheduleAffirmation?: string }>();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const { isPro, loading: premiumLoading } = usePremium();
  const [activeTab, setActiveTab] = useState<"habits" | "affirmations">("habits");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [habitSchedules, setHabitSchedules] = useState<Record<string, HabitSchedule>>({});
  const [scheduleHabit, setScheduleHabit] = useState<Habit | null>(null);
  const [scheduleDays, setScheduleDays] = useState<number[]>(ALL_DAYS);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleReminder, setScheduleReminder] = useState(false);
  const [schedulePaused, setSchedulePaused] = useState(false);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [affirmationScheduleModalVisible, setAffirmationScheduleModalVisible] = useState(false);
  const [scheduleAffirmation, setScheduleAffirmation] = useState<Affirmation | null>(null);
  const [affirmationDays, setAffirmationDays] = useState<number[]>(ALL_DAYS);
  const [affirmationTimes, setAffirmationTimes] = useState<string[]>(["09:00"]);
  const [newAffirmationTime, setNewAffirmationTime] = useState("18:00");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [affirmationSchedules, setAffirmationSchedules] = useState<AffirmationSchedule[]>([]);

  // Habit modal state
  const [habitModalVisible, setHabitModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitColor, setHabitColor] = useState(COLORS[0]);

  // Affirmation modal state
  const [affirmationModalVisible, setAffirmationModalVisible] = useState(false);
  const [editingAffirmation, setEditingAffirmation] = useState<Affirmation | null>(null);
  const [affirmationText, setAffirmationText] = useState("");

  // Habit reminder state
  const [habitReminders, setHabitReminders] = useState<Record<string, string>>({});

  const loadHabits = useCallback(async () => {
    try {
      const [dbHabits, schedules] = await Promise.all([getAllHabits(), getAllHabitSchedules()]) as [Habit[], Record<string, HabitSchedule>];
      
      // If no habits exist, create default ones
      if (dbHabits.length === 0) {
        const initialHabits = isPro ? DEFAULT_HABITS : DEFAULT_HABITS.slice(0, 3);
        console.log(`Creating ${initialHabits.length} default habits...`);
        
        for (let i = 0; i < initialHabits.length; i++) {
          const defaultHabit = initialHabits[i];
          const newHabit = {
            id: `habit_${Date.now()}_${i}`,
            title: defaultHabit.title,
            color: defaultHabit.color,
            isRepeating: true, // Default habits are repeating
            isFavorite: false,
            orderIndex: i,
          };
          await createHabit(newHabit);
          dbHabits.push({ ...newHabit, isActive: 1, isRepeating: 1 } as any);
        }
      }
      
      setHabits([...dbHabits].sort((a, b) => {
        const aTime = timeToMinutes(schedules[a.id]?.time);
        const bTime = timeToMinutes(schedules[b.id]?.time);
        if (aTime === null && bTime !== null) return 1;
        if (bTime === null && aTime !== null) return -1;
        return (aTime ?? 0) - (bTime ?? 0) || a.title.localeCompare(b.title);
      }));
      setHabitSchedules(schedules);
      console.log(`Loaded ${dbHabits.length} habits`);
      
      // Load habit reminders
      const reminders: Record<string, string> = {};
      for (const habit of dbHabits) {
        const time = await getHabitReminderTime(habit.id);
        if (time) {
          reminders[habit.id] = time;
        }
      }
      setHabitReminders(reminders);
      console.log(`Loaded ${Object.keys(reminders).length} habit reminders`);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  }, [isPro]);

  const loadAffirmations = useCallback(async () => {
    try {
      const [dbAffirmations, schedules] = await Promise.all([getAllAffirmations(), getAffirmationSchedules()]) as [Affirmation[], AffirmationSchedule[]];
      setAffirmations(dbAffirmations);
      setAffirmationSchedules(schedules);
      console.log(`Loaded ${dbAffirmations.length} affirmations`);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (premiumLoading) return;
    try {
      setLoading(true);
      await Promise.all([
        loadHabits(),
        loadAffirmations(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loadHabits, loadAffirmations, premiumLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const requestedId = params.editAffirmation;
    if (!requestedId) return;
    const affirmation = affirmations.find(item => item.id === requestedId);
    if (!affirmation) return;
    setActiveTab("affirmations");
    setEditingAffirmation(affirmation);
    setAffirmationText(affirmation.text);
    setAffirmationModalVisible(true);
    (router as any).setParams({ editAffirmation: undefined });
  }, [affirmations, params.editAffirmation, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddHabit = async () => {
    if (premiumLoading) {
      Alert.alert("Checking subscription", "Please wait while Indigo Habits verifies your subscription.");
      return;
    }
    const habitLimit = isPro ? Number.POSITIVE_INFINITY : 5;
    if (habits.filter((habit) => habit.isActive === 1).length >= habitLimit) {
      Alert.alert(
        "Free plan limit reached",
        "The free plan includes up to 5 active habits. Upgrade to Indigo Premium for unlimited habits.",
        isPro ? [{ text: "OK" }] : [{ text: "Not now", style: "cancel" }, { text: "View Premium", onPress: () => router.push("/(tabs)/profile" as any) }],
      );
      return;
    }
    if (!habitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit title");
      return;
    }

    try {
      console.log("User adding new habit:", habitTitle);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newHabit = {
        id: `habit_${Date.now()}`,
        title: habitTitle.trim(),
        color: habitColor,
        isRepeating: true, // New habits appear on Home immediately and repeat daily by default
        orderIndex: habits.length,
      };

      await createHabit(newHabit);
      await loadHabits();

      setHabitModalVisible(false);
      setHabitTitle("");
      setHabitColor(COLORS[0]);
      
      playChime();
    } catch (error) {
      console.error("Error adding habit:", error);
      Alert.alert("Error", "Failed to add habit. Please try again.");
    }
  };

  const handleEditHabit = async () => {
    if (!habitTitle.trim() || !editingHabit) {
      Alert.alert("Error", "Please enter a habit title");
      return;
    }

    try {
      console.log("User editing habit:", editingHabit.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await updateHabit(editingHabit.id, {
        title: habitTitle.trim(),
        color: habitColor,
      });

      await loadHabits();

      setHabitModalVisible(false);
      setEditingHabit(null);
      setHabitTitle("");
      setHabitColor(COLORS[0]);
      
      playChime();
    } catch (error) {
      console.error("Error editing habit:", error);
      Alert.alert("Error", "Failed to edit habit. Please try again.");
    }
  };

  const handleDeleteHabit = async (id: string) => {
    Alert.alert(
      "Delete Habit",
      "Are you sure you want to delete this habit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("User deleting habit:", id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await deleteHabit(id);
              await removeHabitSchedule(id);
              await removeHabitReminder(id);
              await loadHabits();
              playChime();
            } catch (error) {
              console.error("Error deleting habit:", error);
              Alert.alert("Error", "Failed to delete habit. Please try again.");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (habit: Habit) => {
    console.log("User editing habit:", habit.id);
    setEditingHabit(habit);
    setHabitTitle(habit.title);
    setHabitColor(habit.color);
    setHabitModalVisible(true);
  };

  const openHabitSchedule = async (habit: Habit) => {
    const saved = await getAllHabitSchedules();
    const schedule = saved[habit.id] || { days: ALL_DAYS, time: "", reminderEnabled: false, paused: false };
    setScheduleHabit(habit);
    setScheduleDays(schedule.days);
    setScheduleTime(schedule.time);
    setScheduleReminder(schedule.reminderEnabled);
    setSchedulePaused(schedule.paused);
    setScheduleModalVisible(true);
  };

  const saveHabitScheduleChanges = async () => {
    if (!scheduleHabit) return;
    if (scheduleReminder && !isPro) {
      Alert.alert("Premium reminder", "Individual habit notifications are included with Premium.", [
        { text: "Not now", style: "cancel" },
        { text: "View Premium", onPress: () => router.push("/(tabs)/profile" as any) },
      ]);
      return;
    }
    if (!schedulePaused && scheduleDays.length === 0) {
      Alert.alert("Choose days", "Select at least one day, or pause this habit.");
      return;
    }
    const normalizedTime = normalizeTime(scheduleTime);
    if (scheduleReminder && !normalizedTime) {
      Alert.alert("Add a reminder time", "Choose a time with the AM/PM clock.");
      return;
    }
    try {
      const schedule: HabitSchedule = { ...habitSchedules[scheduleHabit.id], days: schedulePaused ? [] : scheduleDays, time: normalizedTime || "", reminderEnabled: scheduleReminder, paused: schedulePaused };
      await saveHabitSchedule(scheduleHabit.id, schedule);
      if (scheduleReminder && !schedulePaused) {
        const reminderTimes = schedule.repeatEveryMinutes ? getIntervalTimes(schedule.time, schedule.endTime || "21:00", schedule.repeatEveryMinutes) : schedule.time;
        await scheduleHabitReminder(scheduleHabit.id, scheduleHabit.title, reminderTimes, schedule.days);

      } else {
        await removeHabitReminder(scheduleHabit.id);
      }
      setHabitSchedules(prev => ({ ...prev, [scheduleHabit.id]: schedule }));
      setHabitReminders(prev => { const next={...prev}; if(scheduleReminder&&!schedulePaused)next[scheduleHabit.id]=schedule.time;else delete next[scheduleHabit.id]; return next; });
      setScheduleModalVisible(false);
      await loadHabits();
    } catch (error) {
      console.error("Could not save habit schedule", error);
      Alert.alert("Could not save schedule", "Please try again.");
    }
  };

  const openAffirmationSchedule = async (affirmation: Affirmation) => {
    const saved = (await getAffirmationSchedules()).find(item => item.affirmationId === affirmation.id);
    setScheduleAffirmation(affirmation);
    setAffirmationDays(saved?.days || WEEKDAYS);
    setAffirmationTimes(sortTimes(saved?.times || ["09:00"]));
    setNewAffirmationTime("18:00");
    setAffirmationScheduleModalVisible(true);
  };

  useEffect(() => {
    const requestedId = params.scheduleAffirmation;
    if (!requestedId) return;
    const affirmation = affirmations.find(item => item.id === requestedId);
    if (!affirmation) return;
    setActiveTab("affirmations");
    void openAffirmationSchedule(affirmation);
    (router as any).setParams({ scheduleAffirmation: undefined });
  }, [affirmations, params.scheduleAffirmation, router]);

  const saveAffirmationScheduleChanges = async () => {
    if (!scheduleAffirmation) return;
    if (premiumLoading) {
      Alert.alert("Checking subscription", "Please wait while Indigo Habits verifies your subscription.");
      return;
    }
    const times = sortTimes(affirmationTimes);
    if (!affirmationDays.length || !times.length) {
      Alert.alert("Check the schedule", "Choose at least one day and one time.");
      return;
    }
    if (!premiumLoading && !isPro) {
      const existing = (await getAffirmationSchedules()).filter(item => item.enabled && item.affirmationId !== scheduleAffirmation.id);
      const exceedsLimit = affirmationDays.some(day =>
        new Set([...existing.filter(item => item.days.includes(day)).map(item => item.affirmationId), scheduleAffirmation.id]).size > 3
      );
      if (exceedsLimit) {
        Alert.alert("Free plan limit reached", "You can have up to 3 Daily Affirmations on any day. Upgrade to Indigo Premium to schedule more.", [
          { text: "Not now", style: "cancel" },
          { text: "View Premium", onPress: () => router.push("/(tabs)/profile" as any) },
        ]);
        return;
      }
    }
    try {
      const schedule: AffirmationSchedule = { enabled: true, affirmationId: scheduleAffirmation.id, days: affirmationDays, times };
      await saveAffirmationSchedule(schedule);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const notified = await scheduleAffirmationReminders(scheduleAffirmation.id, scheduleAffirmation.text, schedule.days, schedule.times);
      if (!notified) Alert.alert("Reminder not enabled", "The affirmation is scheduled in your plan, but notification permission is off.");
      setAffirmationSchedules(prev => [...prev.filter(item => item.affirmationId !== schedule.affirmationId), schedule]);
      setAffirmationScheduleModalVisible(false);
    } catch (error) {
      console.error("Could not save affirmation schedule", error);
      Alert.alert("Could not save schedule", "Check notification permission and try again.");
    }
  };

  const removeAffirmationScheduleChanges = async () => {
    if (!scheduleAffirmation) return;
    await removeAffirmationSchedule(scheduleAffirmation.id);
    await cancelAffirmationReminders(scheduleAffirmation.id);
    setAffirmationSchedules(prev => prev.filter(item => item.affirmationId !== scheduleAffirmation.id));
    setAffirmationScheduleModalVisible(false);
  };

  const handleAddCustomAffirmation = async () => {
    if (!affirmationText.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (editingAffirmation) {
        const text = affirmationText.trim();
        await updateAffirmation(editingAffirmation.id, { text });
        const schedule = affirmationSchedules.find(item => item.affirmationId === editingAffirmation.id);
        if (schedule) {
          await scheduleAffirmationReminders(editingAffirmation.id, text, schedule.days, schedule.times);
        }
        await loadAffirmations();
        setAffirmationModalVisible(false);
        setEditingAffirmation(null);
        setAffirmationText("");
        playChime();
        return;
      }

      console.log("User adding custom affirmation");

      const newAffirmation = {
        id: `affirmation_${Date.now()}`,
        text: affirmationText.trim(),
        isCustom: true,
        isFavorite: false,
        isRepeating: false, // New affirmations start with Daily Repeat OFF
        orderIndex: affirmations.length,
      };

      await createAffirmation(newAffirmation);
      await loadAffirmations();

      setAffirmationModalVisible(false);
      setEditingAffirmation(null);
      setAffirmationText("");
      
      playChime();
    } catch (error) {
      console.error("Error adding affirmation:", error);
      Alert.alert("Error", "Failed to add affirmation. Please try again.");
    }
  };

  const openEditAffirmation = (affirmation: Affirmation) => {
    setEditingAffirmation(affirmation);
    setAffirmationText(affirmation.text);
    setAffirmationModalVisible(true);
  };

  const toggleAffirmationFavorite = async (affirmationId: string) => {
    try {
      console.log("User toggling affirmation favorite:", affirmationId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const affirmation = affirmations.find((a) => a.id === affirmationId);
      if (!affirmation) return;

      const newFavorite = affirmation.isFavorite === 1 ? 0 : 1;

      setAffirmations((prev) =>
        prev.map((a) =>
          a.id === affirmationId ? { ...a, isFavorite: newFavorite } : a
        )
      );

      await updateAffirmation(affirmationId, { isFavorite: newFavorite === 1 });
      playChime();
    } catch (error) {
      console.error("Error toggling affirmation favorite:", error);
    }
  };

  const deleteAffirmationItem = async (affirmationId: string) => {
    Alert.alert(
      "Delete Affirmation",
      "Are you sure you want to delete this affirmation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("User deleting affirmation:", affirmationId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await deleteAffirmation(affirmationId);
              await removeAffirmationSchedule(affirmationId);
              await cancelAffirmationReminders(affirmationId);
              await loadAffirmations();
              playChime();
            } catch (error) {
              console.error("Error deleting affirmation:", error);
              Alert.alert("Error", "Failed to delete affirmation. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={isDark ? ["#070B20", "#0A102C", "#101C3D"] : ["#5B70D5", "#1455D9", "#23B9EB"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const repeatingHabits = habits.filter(h => h.isRepeating === 1).length;
  const todaysAffirmationSchedules = new Set(affirmationSchedules
    .filter(schedule => schedule.enabled && schedule.days.includes(new Date().getDay()))
    .map(schedule => schedule.affirmationId));
  const scheduledAffirmationsForHome = affirmations.filter(affirmation => todaysAffirmationSchedules.has(affirmation.id)).length;
  const automaticAffirmationSlots = isPro ? 3 : Math.max(0, 3 - scheduledAffirmationsForHome);
  const availableAutomaticAffirmations = affirmations.filter(affirmation => !todaysAffirmationSchedules.has(affirmation.id)).length;
  const homeAffirmationRotationCount = scheduledAffirmationsForHome + Math.min(automaticAffirmationSlots, availableAutomaticAffirmations);

  return (
    <LinearGradient
        colors={isDark ? ["#070B20", "#0A102C", "#101C3D"] : ["#5B70D5", "#1455D9", "#23B9EB"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === "habits" ? "Manage Habits" : "Manage Affirmations"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeTab === "habits" 
              ? `${habits.length} total • ${repeatingHabits} on home screen`
              : `${affirmations.length} total • ${homeAffirmationRotationCount} in today’s rotation`
            }
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "habits" && styles.activeTab, activeTab === "habits" && { backgroundColor: themeColors.card }]}
            onPress={() => {
              console.log("User switched to Habits tab");
              setActiveTab("habits");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "habits" && styles.activeTabText,
                activeTab === "habits" && { color: themeColors.primary },
              ]}
            >
              Habits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "affirmations" && styles.activeTab, activeTab === "affirmations" && { backgroundColor: themeColors.card }]}
            onPress={() => {
              console.log("User switched to Affirmations tab");
              setActiveTab("affirmations");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "affirmations" && styles.activeTabText,
                activeTab === "affirmations" && { color: themeColors.primary },
              ]}
            >
              Affirmations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
        >
          {activeTab === "habits" ? (
            <>
              {habits.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add-circle"
                    size={64}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                  <Text style={styles.emptyStateText}>No habits yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the + button to create your first habit
                  </Text>
                </View>
              ) : (
                <>
                  {habits.map((habit) => (
                    <View key={habit.id} style={[styles.habitCard, { backgroundColor: themeColors.card }]}>
                      <View style={styles.habitTop}>
                        <View style={styles.habitLeft}>
                          <View
                            style={[styles.habitDot, { backgroundColor: habit.color }]}
                          />
                          <Text style={[styles.habitTitle, { color: themeColors.text }]}>{habit.title}</Text>
                        </View>
                        <View style={styles.habitActions}>
                          <TouchableOpacity
                            onPress={() => openHabitSchedule(habit)}
                            style={[
                              styles.iconButton,
                              (habitReminders[habit.id] || habitSchedules[habit.id]?.time) && styles.iconButtonActive,
                            ]}
                          >
                            <IconSymbol
                              ios_icon_name="alarm.fill"
                              android_material_icon_name="alarm"
                              size={20}
                              color={(habitReminders[habit.id] || habitSchedules[habit.id]?.time) ? "#10B981" : "#6366F1"}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => openEditModal(habit)}
                            style={styles.iconButton}
                          >
                            <IconSymbol
                              ios_icon_name="pencil"
                              android_material_icon_name="edit"
                              size={20}
                              color="#6366F1"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteHabit(habit.id)}
                            style={styles.iconButton}
                          >
                            <IconSymbol
                              ios_icon_name="trash"
                              android_material_icon_name="delete"
                              size={20}
                              color="#EF4444"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.habitBottom}>
                        <TouchableOpacity style={styles.repeatToggle} onPress={() => openHabitSchedule(habit)}>
                          <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar-month" size={16} color="#456AFF" />
                          <Text style={styles.repeatToggleText}>
                            {habitSchedules[habit.id]?.paused ? "Paused" : `${(habitSchedules[habit.id]?.days || [0,1,2,3,4,5,6]).length} days`}
                            {habitSchedules[habit.id]?.time ? ` · ${formatTime(habitSchedules[habit.id].time)}` : " · Set schedule"}
                          </Text>
                          {habitSchedules[habit.id]?.reminderEnabled && <Text style={styles.reminderTimeText}>Reminder on</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <View style={{flexDirection:"row",gap:8,marginBottom:12}}>
                {[false,true].map(favorites => <TouchableOpacity key={String(favorites)} onPress={()=>setShowFavoritesOnly(favorites)} style={{paddingHorizontal:15,paddingVertical:9,borderRadius:18,backgroundColor:showFavoritesOnly===favorites?"#426CFF":"rgba(255,255,255,.34)"}}><Text style={{color:"white",fontWeight:"700"}}>{favorites?"Favorites":"All"}</Text></TouchableOpacity>)}
              </View>
              {affirmations.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="plus.circle.fill"
                    android_material_icon_name="add-circle"
                    size={64}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                  <Text style={styles.emptyStateText}>No affirmations yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the + button to create your first affirmation
                  </Text>
                </View>
              ) : (
                <>
                  {affirmations.filter(a=>!showFavoritesOnly||a.isFavorite===1).map((affirmation) => {
                    const scheduled = affirmationSchedules.find(item=>item.affirmationId===affirmation.id);
                    return <View key={affirmation.id} style={[styles.affirmationCard, { backgroundColor: themeColors.card }]}>
                      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit affirmation: ${affirmation.text}`} onPress={() => openEditAffirmation(affirmation)}>
                        <Text style={[styles.affirmationText, { color: themeColors.text }]}>{affirmation.text}</Text>
                      </TouchableOpacity>
                      <View style={styles.affirmationMeta}>
                        <View style={styles.affirmationBadges}>{affirmation.isCustom===1&&<View style={styles.badge}><Text style={styles.badgeText}>Custom</Text></View>}</View>
                        <TouchableOpacity onPress={()=>toggleAffirmationFavorite(affirmation.id)} style={[styles.badge,{backgroundColor:affirmation.isFavorite===1?'#FFF4D5':'#EEF1FF'}]}>
                          <IconSymbol ios_icon_name={affirmation.isFavorite===1?'star.fill':'star'} android_material_icon_name="star" size={14} color="#F59E0B"/><Text style={styles.badgeText}>{affirmation.isFavorite===1?'Saved':'Save'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={()=>deleteAffirmationItem(affirmation.id)} style={styles.iconButton}><IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color="#EF4444"/></TouchableOpacity>
                      </View>
                      <View style={[styles.affirmationBottom,{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}]}>
                        <Text style={styles.repeatHint}>{scheduled?`Scheduled · ${scheduled.days.length} days · ${scheduled.times.map(formatTime).join(', ')}`:'Not scheduled'}</Text>
                        <TouchableOpacity style={[styles.repeatToggle,styles.repeatToggleActive]} onPress={()=>openAffirmationSchedule(affirmation)}><Text style={[styles.repeatToggleText,styles.repeatToggleTextActive]}>{scheduled?'Edit schedule':'Schedule'}</Text></TouchableOpacity>
                      </View>
                    </View>;
                  })}
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === "habits") {
              console.log("User tapped add habit button");
              setEditingHabit(null);
              setHabitTitle("");
              setHabitColor(COLORS[0]);
              setHabitModalVisible(true);
            } else {
              console.log("User tapped add affirmation button");
              setAffirmationText("");
              setAffirmationModalVisible(true);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={28}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Habit Modal */}
      <Modal
        visible={habitModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHabitModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={() => setHabitModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              {editingHabit ? "Edit Habit" : "New Habit"}
            </Text>
            <TouchableOpacity
              onPress={editingHabit ? handleEditHabit : handleAddHabit}
            >
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.label, { color: themeColors.text }]}>Habit Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? themeColors.border : "#F3F4F6", color: themeColors.text }]}
              placeholder="e.g., Morning meditation"
              value={habitTitle}
              onChangeText={setHabitTitle}
              autoFocus
            />

            <Text style={[styles.label, { color: themeColors.text }]}>Color</Text>
            <View style={styles.colorPicker}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    habitColor === color && styles.selectedColor,
                  ]}
                  onPress={() => {
                    setHabitColor(color);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Affirmation Modal */}
      <Modal
        visible={affirmationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAffirmationModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: themeColors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity onPress={() => setAffirmationModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{editingAffirmation ? "Edit Affirmation" : "New Affirmation"}</Text>
            <TouchableOpacity onPress={handleAddCustomAffirmation}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={[styles.label, { color: themeColors.text }]}>Affirmation Text</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDark ? themeColors.border : "#F3F4F6", color: themeColors.text }]}
              placeholder="e.g., I am worthy of love and respect."
              value={affirmationText}
              onChangeText={setAffirmationText}
              multiline
              numberOfLines={4}
              autoFocus
            />
            {editingAffirmation && <Text style={styles.repeatHint}>Tap any affirmation in this list to edit it.</Text>}
          </View>
        </View>
      </Modal>

      <Modal visible={scheduleModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setScheduleModalVisible(false)}>
        <View style={[styles.modalContainer,{backgroundColor:themeColors.card}]}>
          <View style={[styles.modalHeader,{borderBottomColor:themeColors.border}]}><TouchableOpacity onPress={()=>setScheduleModalVisible(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity><Text style={[styles.modalTitle,{color:themeColors.text}]}>Habit Schedule</Text><TouchableOpacity onPress={saveHabitScheduleChanges}><Text style={styles.modalSave}>Save</Text></TouchableOpacity></View>
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.label,{color:themeColors.text}]}>{scheduleHabit?.title}</Text>
            <View style={{flexDirection:'row',gap:8,marginVertical:8}}>{[{label:'Daily',days:ALL_DAYS},{label:'Weekdays',days:WEEKDAYS},{label:'Weekend',days:[0,6]}].map(p=><TouchableOpacity key={p.label} onPress={()=>{setScheduleDays(p.days);setSchedulePaused(false)}} style={{padding:10,borderRadius:12,backgroundColor:'#E9EDFF'}}><Text style={{color:'#315CDF',fontWeight:'700'}}>{p.label}</Text></TouchableOpacity>)}</View>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginVertical:12}}>{['S','M','T','W','T','F','S'].map((d,i)=><TouchableOpacity key={i} onPress={()=>setScheduleDays(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i].sort())} style={{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:scheduleDays.includes(i)?'#426CFF':'#EEF1FA'}}><Text style={{color:scheduleDays.includes(i)?'white':'#65708F',fontWeight:'700'}}>{d}</Text></TouchableOpacity>)}</View>
            <Text style={[styles.label,{color:themeColors.text}]}>Time (optional)</Text><TimePickerField value={scheduleTime} onChange={setScheduleTime} placeholder="Choose a time" textColor={themeColors.text} backgroundColor={isDark?themeColors.border:'#F3F4F6'} borderColor={themeColors.border} darkMode={isDark} />
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:14}}><Text style={{color:themeColors.text,fontWeight:'600'}}>Reminder notification{!isPro?' · Premium':''}</Text><Switch value={scheduleReminder} onValueChange={value=>{if(value&&!isPro){Alert.alert("Premium reminder","Individual habit notifications are included with Premium.",[{text:"Not now",style:"cancel"},{text:"View Premium",onPress:()=>router.push("/(tabs)/profile" as any)}]);return;}setScheduleReminder(value);}} /></View>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12}}><Text style={{color:themeColors.text,fontWeight:'600'}}>Pause this habit</Text><Switch value={schedulePaused} onValueChange={setSchedulePaused} /></View>
          </ScrollView>
        </View>
      </Modal>
      <Modal visible={affirmationScheduleModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setAffirmationScheduleModalVisible(false)}>
        <View style={[styles.modalContainer,{backgroundColor:themeColors.card}]}><View style={[styles.modalHeader,{borderBottomColor:themeColors.border}]}><TouchableOpacity onPress={()=>setAffirmationScheduleModalVisible(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity><Text style={[styles.modalTitle,{color:themeColors.text}]}>Schedule Affirmation</Text><TouchableOpacity onPress={saveAffirmationScheduleChanges}><Text style={styles.modalSave}>Save</Text></TouchableOpacity></View>
          <ScrollView style={styles.modalContent}><Text style={[styles.affirmationText,{color:themeColors.text}]}>{scheduleAffirmation?.text}</Text><Text style={[styles.label,{color:themeColors.text,marginTop:22}]}>Repeat on</Text><View style={{flexDirection:'row',justifyContent:'space-between',marginVertical:12}}>{['S','M','T','W','T','F','S'].map((d,i)=><TouchableOpacity key={i} onPress={()=>setAffirmationDays(prev=>prev.includes(i)?prev.filter(x=>x!==i):[...prev,i].sort())} style={{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:affirmationDays.includes(i)?'#426CFF':'#EEF1FA'}}><Text style={{color:affirmationDays.includes(i)?'white':'#65708F',fontWeight:'700'}}>{d}</Text></TouchableOpacity>)}</View><Text style={[styles.label,{color:themeColors.text}]}>Reminder times</Text>
          {affirmationTimes.map((time,index)=><View key={`${time}-${index}`} style={{flexDirection:'row',alignItems:'center',gap:10,marginTop:9}}><View style={{flex:1}}><TimePickerField value={time} onChange={next=>setAffirmationTimes(prev=>sortTimes(prev.map((item,i)=>i===index?next:item)))} textColor={themeColors.text} backgroundColor={isDark?themeColors.border:'#F3F4F6'} borderColor={themeColors.border} darkMode={isDark}/></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${formatTime(time)} reminder`} onPress={()=>setAffirmationTimes(prev=>prev.filter((_,i)=>i!==index))} style={{paddingHorizontal:9,paddingVertical:12}}><Text style={{color:'#D8445B',fontWeight:'700'}}>Remove</Text></TouchableOpacity></View>)}
          <View style={{flexDirection:'row',alignItems:'center',gap:10,marginTop:12}}><View style={{flex:1}}><TimePickerField value={newAffirmationTime} onChange={setNewAffirmationTime} textColor={themeColors.text} backgroundColor={isDark?themeColors.border:'#F3F4F6'} borderColor={themeColors.border} darkMode={isDark}/></View><TouchableOpacity onPress={()=>{if(affirmationTimes.includes(newAffirmationTime)){Alert.alert('Time already added','Choose a different time.');return}setAffirmationTimes(prev=>sortTimes([...prev,newAffirmationTime]));Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}} style={{paddingHorizontal:9,paddingVertical:12}}><Text style={{color:'#4057DD',fontWeight:'700'}}>＋ Add</Text></TouchableOpacity></View>
          <Text style={styles.repeatHint}>Times are sorted automatically from earliest to latest.</Text>
          {affirmationSchedules.some(item=>item.affirmationId===scheduleAffirmation?.id)&&<TouchableOpacity style={{paddingVertical:18}} onPress={removeAffirmationScheduleChanges}><Text style={{color:'#D8445B',fontWeight:'700'}}>Remove schedule</Text></TouchableOpacity>}</ScrollView></View>
      </Modal>
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
  header: {
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.9)",
  },
  activeTabText: {
    color: "#6366F1",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 8,
    textAlign: "center",
  },
  habitCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  habitTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  habitDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  habitActions: {
    flexDirection: "row",
    gap: 8,
  },
  habitBottom: {
    gap: 8,
  },
  reminderTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reminderTimeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
  },
  iconButton: {
    padding: 8,
  },
  iconButtonActive: {
    backgroundColor: "#DCFCE7",
    borderRadius: 8,
  },
  repeatToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
  },
  repeatToggleActive: {
    backgroundColor: "#6366F1",
  },
  repeatToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  repeatToggleTextActive: {
    color: "white",
  },
  repeatHint: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  affirmationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  affirmationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 22,
  },
  affirmationMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  affirmationBadges: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
  },
  affirmationBottom: {
    gap: 8,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCancel: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366F1",
  },
  modalContent: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 24,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColor: {
    borderColor: "#1F2937",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  previewBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    flex: 1,
  },
  habitPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  habitPreviewText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F3F4F6",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  timePickerText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  reminderNote: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  removeReminderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
  },
  removeReminderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
});
