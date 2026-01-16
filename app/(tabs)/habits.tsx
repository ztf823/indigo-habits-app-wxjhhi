
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
  "#6366F1", // Indigo
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

// Free users: 5 affirmations and 5 habits
// Pro users: unlimited
const FREE_MAX_AFFIRMATIONS = 5;
const FREE_MAX_HABITS = 5;

export default function HabitsScreen() {
  const [activeTab, setActiveTab] = useState<"habits" | "affirmations">("habits");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Habit modal state
  const [habitModalVisible, setHabitModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitTitle, setHabitTitle] = useState("");
  const [habitColor, setHabitColor] = useState(COLORS[0]);

  // Affirmation modal state
  const [affirmationModalVisible, setAffirmationModalVisible] = useState(false);
  const [affirmationText, setAffirmationText] = useState("");

  const loadPremiumStatus = useCallback(async () => {
    try {
      const profile = await getProfile();
      const premiumStatus = profile?.isPremium === 1;
      setIsPremium(premiumStatus);
      console.log(`User premium status: ${premiumStatus ? 'Premium' : 'Free'}`);
    } catch (error) {
      console.error("Error loading premium status:", error);
    }
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const dbHabits = await getAllHabits() as Habit[];
      setHabits(dbHabits);
      console.log(`Loaded ${dbHabits.length} habits`);
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

    // Check limit for free users
    if (!isPremium && habits.length >= FREE_MAX_HABITS) {
      Alert.alert(
        "Limit Reached",
        `Free users can create up to ${FREE_MAX_HABITS} habits. Upgrade to Premium for unlimited habits!`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => {
            // Navigate to profile/premium screen
            console.log("User wants to upgrade to premium");
          }},
        ]
      );
      return;
    }

    try {
      console.log("User adding new habit:", habitTitle);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newHabit = {
        id: `habit_${Date.now()}`,
        title: habitTitle.trim(),
        color: habitColor,
        isRepeating: false,
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
      console.log("User toggling habit daily repeat:", habitId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newRepeating = habit.isRepeating === 1 ? 0 : 1;

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

    // Check limit for free users
    if (!isPremium && affirmations.length >= FREE_MAX_AFFIRMATIONS) {
      Alert.alert(
        "Limit Reached",
        `Free users can create up to ${FREE_MAX_AFFIRMATIONS} affirmations. Upgrade to Premium for unlimited affirmations!`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => {
            // Navigate to profile/premium screen
            console.log("User wants to upgrade to premium");
          }},
        ]
      );
      return;
    }

    try {
      console.log("User adding custom affirmation");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const newAffirmation = {
        id: `affirmation_${Date.now()}`,
        text: affirmationText.trim(),
        isCustom: true,
        isFavorite: false,
        isRepeating: false,
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
      console.log("User toggling affirmation daily repeat:", affirmationId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const affirmation = affirmations.find((a) => a.id === affirmationId);
      if (!affirmation) return;

      const newRepeating = affirmation.isRepeating === 1 ? 0 : 1;

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
          <Text style={styles.headerTitle}>My Habits</Text>
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
              {/* Demo mode banner */}
              {Platform.OS === 'web' && (
                <View style={styles.demoBanner}>
                  <IconSymbol
                    ios_icon_name="info.circle.fill"
                    android_material_icon_name="info"
                    size={20}
                    color="#92400E"
                  />
                  <Text style={styles.demoText}>
                    Demo Mode - Changes won&apos;t be saved until backend is ready
                  </Text>
                </View>
              )}

              {habits.map((habit, index) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitLeft}>
                    <View
                      style={[styles.habitDot, { backgroundColor: habit.color }]}
                    />
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                  </View>
                  <View style={styles.habitActions}>
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
              ))}
            </>
          ) : (
            <>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All Affirmations</Text>
                <Text style={styles.sectionSubtitle}>
                  Manage custom affirmations and set them to repeat daily
                </Text>
              </View>

              {affirmations.map((affirmation, index) => (
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
                    <View style={styles.affirmationActions}>
                      <TouchableOpacity
                        style={[
                          styles.dailyButton,
                          affirmation.isRepeating === 1 && styles.dailyButtonActive,
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
                            styles.dailyButtonText,
                            affirmation.isRepeating === 1 && styles.dailyButtonTextActive,
                          ]}
                        >
                          Daily
                        </Text>
                      </TouchableOpacity>
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
                  </View>
                </View>
              ))}
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "white",
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
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  demoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  habitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  iconButton: {
    padding: 8,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
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
  affirmationActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dailyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  dailyButtonActive: {
    backgroundColor: "#6366F1",
  },
  dailyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  dailyButtonTextActive: {
    color: "white",
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
});
