
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getAllHabits,
  getAllAffirmations,
  createHabit,
  updateHabit,
  deleteHabit,
  createAffirmation,
  updateAffirmation,
  deleteAffirmation,
  getProfile,
} from "@/utils/database";
import { getRandomAffirmation } from "@/utils/affirmations";
import { playChime } from "@/utils/sounds";
import {
  saveHabitReminder,
  removeHabitReminder,
  getHabitReminderTime,
} from "@/utils/notifications";

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

// 🚀 PREVIEW MODE: Removed display limits
const FREE_HOME_DISPLAY_LIMIT = 999999; // Effectively unlimited

// Default habits matching home screen
const DEFAULT_HABITS = [
  { title: "Morning meditation", color: "#10B981" },
  { title: "Exercise", color: "#3B82F6" },
  { title: "Read 10 pages", color: "#F59E0B" },
  { title: "Drink 8 glasses of water", color: "#06B6D4" },
  { title: "Practice gratitude", color: "#8B5CF6" },
];

export default function HabitsScreen() {
  const [activeTab, setActiveTab] = useState<"habits" | "affirmations">("habits");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 🚀 PREVIEW MODE: Always set premium to true
  const [isPremium, setIsPremium] = useState(true);

  // Habit modal state
  const [habitModalVisible, setHabitModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitColor, setHabitColor] = useState(COLORS[0]);

  // Affirmation modal state
  const [affirmationModalVisible, setAffirmationModalVisible] = useState(false);
  const [affirmationText, setAffirmationText] = useState("");

  // Habit reminder state
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedHabitForReminder, setSelectedHabitForReminder] = useState<Habit | null>(null);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [habitReminders, setHabitReminders] = useState<Record<string, string>>({});

  const loadPremiumStatus = useCallback(async () => {
    try {
      // 🚀 PREVIEW MODE: Always set premium to true
      setIsPremium(true);
      console.log('🚀 PREVIEW MODE: Premium status forced to true for testing');
    } catch (error) {
      console.error("Error loading premium status:", error);
    }
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const dbHabits = await getAllHabits() as Habit[];
      
      // If no habits exist, create default ones
      if (dbHabits.length === 0) {
        console.log(`Creating ${DEFAULT_HABITS.length} default habits...`);
        
        for (let i = 0; i < DEFAULT_HABITS.length; i++) {
          const defaultHabit = DEFAULT_HABITS[i];
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
      
      setHabits(dbHabits);
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
  }, []);

  const loadAffirmations = useCallback(async () => {
    try {
      const dbAffirmations = await getAllAffirmations() as Affirmation[];
      setAffirmations(dbAffirmations);
      console.log(`Loaded ${dbAffirmations.length} affirmations`);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPremiumStatus(),
        loadHabits(),
        loadAffirmations(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loadPremiumStatus, loadHabits, loadAffirmations]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddHabit = async () => {
    if (!habitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit title");
      return;
    }

    // 🚀 PREVIEW MODE: No limits - create unlimited habits
    try {
      console.log("User adding new habit:", habitTitle);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newHabit = {
        id: `habit_${Date.now()}`,
        title: habitTitle.trim(),
        color: habitColor,
        isRepeating: false, // New habits start with Daily Repeat OFF
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

  const toggleHabitRepeating = async (habitId: string) => {
    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newRepeating = habit.isRepeating === 1 ? 0 : 1;
      
      // 🚀 PREVIEW MODE: No limits - allow unlimited repeating habits
      console.log("🚀 PREVIEW MODE: Toggling habit daily repeat (no limits):", habitId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, isRepeating: newRepeating } : h
        )
      );

      await updateHabit(habitId, { isRepeating: newRepeating === 1 });
      playChime();
    } catch (error) {
      console.error("Error toggling habit repeating:", error);
    }
  };

  const handleAddCustomAffirmation = async () => {
    if (!affirmationText.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    // 🚀 PREVIEW MODE: No limits - create unlimited affirmations
    try {
      console.log("User adding custom affirmation");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      setAffirmationText("");
      
      playChime();
    } catch (error) {
      console.error("Error adding affirmation:", error);
      Alert.alert("Error", "Failed to add affirmation. Please try again.");
    }
  };

  const toggleAffirmationRepeating = async (affirmationId: string) => {
    try {
      const affirmation = affirmations.find((a) => a.id === affirmationId);
      if (!affirmation) return;

      const newRepeating = affirmation.isRepeating === 1 ? 0 : 1;
      
      // 🚀 PREVIEW MODE: No limits - allow unlimited repeating affirmations
      console.log("🚀 PREVIEW MODE: Toggling affirmation daily repeat (no limits):", affirmationId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setAffirmations((prev) =>
        prev.map((a) =>
          a.id === affirmationId ? { ...a, isRepeating: newRepeating } : a
        )
      );

      await updateAffirmation(affirmationId, { isRepeating: newRepeating === 1 });
      playChime();
    } catch (error) {
      console.error("Error toggling affirmation repeating:", error);
    }
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

  const openReminderModal = async (habit: Habit) => {
    try {
      console.log("🚀 PREVIEW MODE: User tapped clock icon for habit:", habit.title);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setSelectedHabitForReminder(habit);
      
      // Load existing reminder time if any
      const existingTime = habitReminders[habit.id];
      if (existingTime) {
        const [hours, minutes] = existingTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setReminderTime(date);
      } else {
        // Default to 9:00 AM
        const date = new Date();
        date.setHours(9, 0, 0, 0);
        setReminderTime(date);
      }
      
      setReminderModalVisible(true);
    } catch (error) {
      console.error("Error opening reminder modal:", error);
    }
  };

  const handleSaveReminder = async () => {
    if (!selectedHabitForReminder) return;
    
    try {
      console.log("🚀 PREVIEW MODE: Saving habit reminder for:", selectedHabitForReminder.title);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const timeString = formatTimeToString(reminderTime);
      await saveHabitReminder(selectedHabitForReminder.id, timeString, selectedHabitForReminder.title);
      
      // Update local state
      setHabitReminders(prev => ({
        ...prev,
        [selectedHabitForReminder.id]: timeString,
      }));
      
      setReminderModalVisible(false);
      playChime();
      
      Alert.alert(
        'Reminder Set! ⏰',
        `You'll receive a reminder at ${formatTimeDisplay(reminderTime)} for "${selectedHabitForReminder.title}"`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error("Error saving habit reminder:", error);
      Alert.alert("Error", "Failed to save reminder. Please try again.");
    }
  };

  const handleRemoveReminder = async () => {
    if (!selectedHabitForReminder) return;
    
    try {
      console.log("🚀 PREVIEW MODE: Removing habit reminder for:", selectedHabitForReminder.title);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      await removeHabitReminder(selectedHabitForReminder.id);
      
      // Update local state
      setHabitReminders(prev => {
        const updated = { ...prev };
        delete updated[selectedHabitForReminder.id];
        return updated;
      });
      
      setReminderModalVisible(false);
      playChime();
      
      Alert.alert(
        'Reminder Removed',
        `Reminder for "${selectedHabitForReminder.title}" has been removed.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error("Error removing habit reminder:", error);
      Alert.alert("Error", "Failed to remove reminder. Please try again.");
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      console.log("User changed reminder time:", selectedDate);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setReminderTime(selectedDate);
    }
  };

  const formatTimeToString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#6366F1", "#87CEEB"]}
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
  const repeatingAffirmations = affirmations.filter(a => a.isRepeating === 1).length;

  return (
    <LinearGradient
      colors={["#6366F1", "#87CEEB"]}
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
          {/* 🚀 PREVIEW MODE: Show unlimited status */}
          <Text style={styles.headerSubtitle}>
            {activeTab === "habits" 
              ? `${habits.length} total • ${repeatingHabits} on home screen (unlimited)`
              : `${affirmations.length} total • ${repeatingAffirmations} on home screen (unlimited)`
            }
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "habits" && styles.activeTab]}
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
              ]}
            >
              Habits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "affirmations" && styles.activeTab]}
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
                    <View key={habit.id} style={styles.habitCard}>
                      <View style={styles.habitTop}>
                        <View style={styles.habitLeft}>
                          <View
                            style={[styles.habitDot, { backgroundColor: habit.color }]}
                          />
                          <Text style={styles.habitTitle}>{habit.title}</Text>
                        </View>
                        <View style={styles.habitActions}>
                          {/* 🚀 PREVIEW MODE: Clock icon for individual habit reminders */}
                          <TouchableOpacity
                            onPress={() => openReminderModal(habit)}
                            style={[
                              styles.iconButton,
                              habitReminders[habit.id] && styles.iconButtonActive,
                            ]}
                          >
                            <IconSymbol
                              ios_icon_name="alarm.fill"
                              android_material_icon_name="alarm"
                              size={20}
                              color={habitReminders[habit.id] ? "#10B981" : "#6366F1"}
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
                      
                      {/* Daily/Repeat Toggle */}
                      <View style={styles.habitBottom}>
                        <TouchableOpacity
                          style={[
                            styles.repeatToggle,
                            habit.isRepeating === 1 && styles.repeatToggleActive,
                          ]}
                          onPress={() => toggleHabitRepeating(habit.id)}
                        >
                          <IconSymbol
                            ios_icon_name="repeat"
                            android_material_icon_name="repeat"
                            size={16}
                            color={habit.isRepeating === 1 ? "white" : "#6366F1"}
                          />
                          <Text
                            style={[
                              styles.repeatToggleText,
                              habit.isRepeating === 1 && styles.repeatToggleTextActive,
                            ]}
                          >
                            {habit.isRepeating === 1 ? "Daily Repeat ON" : "Daily Repeat OFF"}
                          </Text>
                        </TouchableOpacity>
                        {habit.isRepeating === 1 && (
                          <Text style={styles.repeatHint}>
                            Will appear on home screen
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
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
                  {affirmations.map((affirmation) => (
                    <View key={affirmation.id} style={styles.affirmationCard}>
                      <Text style={styles.affirmationText}>{affirmation.text}</Text>
                      
                      <View style={styles.affirmationMeta}>
                        <View style={styles.affirmationBadges}>
                          {affirmation.isCustom === 1 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>Custom</Text>
                            </View>
                          )}
                          {affirmation.isFavorite === 1 && (
                            <TouchableOpacity
                              style={styles.badge}
                              onPress={() => toggleAffirmationFavorite(affirmation.id)}
                            >
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={14}
                                color="#F59E0B"
                              />
                              <Text style={styles.badgeText}>Favorite</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteAffirmationItem(affirmation.id)}
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

                      {/* Daily/Repeat Toggle */}
                      <View style={styles.affirmationBottom}>
                        <TouchableOpacity
                          style={[
                            styles.repeatToggle,
                            affirmation.isRepeating === 1 && styles.repeatToggleActive,
                          ]}
                          onPress={() => toggleAffirmationRepeating(affirmation.id)}
                        >
                          <IconSymbol
                            ios_icon_name="repeat"
                            android_material_icon_name="repeat"
                            size={16}
                            color={affirmation.isRepeating === 1 ? "white" : "#6366F1"}
                          />
                          <Text
                            style={[
                              styles.repeatToggleText,
                              affirmation.isRepeating === 1 && styles.repeatToggleTextActive,
                            ]}
                          >
                            {affirmation.isRepeating === 1 ? "Daily Repeat ON" : "Daily Repeat OFF"}
                          </Text>
                        </TouchableOpacity>
                        {affirmation.isRepeating === 1 && (
                          <Text style={styles.repeatHint}>
                            Will appear on home screen
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setHabitModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingHabit ? "Edit Habit" : "New Habit"}
            </Text>
            <TouchableOpacity
              onPress={editingHabit ? handleEditHabit : handleAddHabit}
            >
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Habit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Morning meditation"
              value={habitTitle}
              onChangeText={setHabitTitle}
              autoFocus
            />

            <Text style={styles.label}>Color</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAffirmationModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Affirmation</Text>
            <TouchableOpacity onPress={handleAddCustomAffirmation}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>Affirmation Text</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., I am worthy of love and respect."
              value={affirmationText}
              onChangeText={setAffirmationText}
              multiline
              numberOfLines={4}
              autoFocus
            />
          </View>
        </View>
      </Modal>

      {/* Habit Reminder Modal - 🚀 PREVIEW MODE */}
      <Modal
        visible={reminderModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Set Reminder</Text>
            <TouchableOpacity onPress={handleSaveReminder}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* 🚀 PREVIEW MODE Badge */}
            <View style={styles.previewBadge}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace-premium"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.previewBadgeText}>
                🚀 PREVIEW MODE: Pro feature unlocked
              </Text>
            </View>

            {selectedHabitForReminder && (
              <React.Fragment>
                <Text style={styles.label}>Habit</Text>
                <View style={styles.habitPreview}>
                  <View
                    style={[
                      styles.habitDot,
                      { backgroundColor: selectedHabitForReminder.color },
                    ]}
                  />
                  <Text style={styles.habitPreviewText}>
                    {selectedHabitForReminder.title}
                  </Text>
                </View>

                <Text style={styles.label}>Reminder Time</Text>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="access-time"
                    size={24}
                    color="#6366F1"
                  />
                  <Text style={styles.timePickerText}>
                    {formatTimeDisplay(reminderTime)}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}

                <Text style={styles.reminderNote}>
                  🔔 You'll receive a soft Tibetan bowl chime at this time every day
                </Text>

                {habitReminders[selectedHabitForReminder.id] && (
                  <TouchableOpacity
                    style={styles.removeReminderButton}
                    onPress={handleRemoveReminder}
                  >
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20}
                      color="#EF4444"
                    />
                    <Text style={styles.removeReminderText}>Remove Reminder</Text>
                  </TouchableOpacity>
                )}
              </React.Fragment>
            )}
          </View>
        </View>
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
    backgroundColor: "rgba(255, 255, 255, 0.25)",
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
