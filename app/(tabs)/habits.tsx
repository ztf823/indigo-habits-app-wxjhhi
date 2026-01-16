
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
  "#10B981", // Green
  "#3B82F6", // Blue
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
      console.log("User toggling habit repeating:", habitId);
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

  const moveHabitUp = async (index: number) => {
    if (index === 0) return;

    try {
      console.log("User moving habit up:", index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newHabits = [...habits];
      [newHabits[index], newHabits[index - 1]] = [newHabits[index - 1], newHabits[index]];

      setHabits(newHabits);

      // Update order in database
      await Promise.all(
        newHabits.map((habit, idx) =>
          updateHabit(habit.id, { orderIndex: idx })
        )
      );
    } catch (error) {
      console.error("Error moving habit:", error);
    }
  };

  const moveHabitDown = async (index: number) => {
    if (index === habits.length - 1) return;

    try {
      console.log("User moving habit down:", index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newHabits = [...habits];
      [newHabits[index], newHabits[index + 1]] = [newHabits[index + 1], newHabits[index]];

      setHabits(newHabits);

      // Update order in database
      await Promise.all(
        newHabits.map((habit, idx) =>
          updateHabit(habit.id, { orderIndex: idx })
        )
      );
    } catch (error) {
      console.error("Error moving habit:", error);
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
      console.log("User toggling affirmation repeating:", affirmationId);
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

  const moveAffirmationUp = async (index: number) => {
    if (index === 0) return;

    try {
      console.log("User moving affirmation up:", index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newAffirmations = [...affirmations];
      [newAffirmations[index], newAffirmations[index - 1]] = [
        newAffirmations[index - 1],
        newAffirmations[index],
      ];

      setAffirmations(newAffirmations);

      // Update order in database
      await Promise.all(
        newAffirmations.map((affirmation, idx) =>
          updateAffirmation(affirmation.id, { orderIndex: idx })
        )
      );
    } catch (error) {
      console.error("Error moving affirmation:", error);
    }
  };

  const moveAffirmationDown = async (index: number) => {
    if (index === affirmations.length - 1) return;

    try {
      console.log("User moving affirmation down:", index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newAffirmations = [...affirmations];
      [newAffirmations[index], newAffirmations[index + 1]] = [
        newAffirmations[index + 1],
        newAffirmations[index],
      ];

      setAffirmations(newAffirmations);

      // Update order in database
      await Promise.all(
        newAffirmations.map((affirmation, idx) =>
          updateAffirmation(affirmation.id, { orderIndex: idx })
        )
      );
    } catch (error) {
      console.error("Error moving affirmation:", error);
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
        colors={["#4F46E5", "#87CEEB"]}
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
      colors={["#4F46E5", "#87CEEB"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Habits</Text>
          {!isPremium && (
            <Text style={styles.limitText}>
              Free: {activeTab === "habits" ? `${habits.length}/${FREE_MAX_HABITS} habits` : `${affirmations.length}/${FREE_MAX_AFFIRMATIONS} affirmations`}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "habits" && styles.activeTab]}
            onPress={() => setActiveTab("habits")}
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
            onPress={() => setActiveTab("affirmations")}
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
              {habits.map((habit, index) => (
                <View key={habit.id} style={styles.item}>
                  <View
                    style={[styles.colorIndicator, { backgroundColor: habit.color }]}
                  />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{habit.title}</Text>
                    {habit.isRepeating === 1 && (
                      <Text style={styles.itemSubtitle}>Repeating daily</Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => moveHabitUp(index)}
                      disabled={index === 0}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="chevron.up"
                        android_material_icon_name="keyboard-arrow-up"
                        size={20}
                        color={index === 0 ? "#999" : "white"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveHabitDown(index)}
                      disabled={index === habits.length - 1}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="chevron.down"
                        android_material_icon_name="keyboard-arrow-down"
                        size={20}
                        color={index === habits.length - 1 ? "#999" : "white"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleHabitRepeating(habit.id)}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="repeat"
                        android_material_icon_name="repeat"
                        size={20}
                        color={habit.isRepeating === 1 ? "#10B981" : "white"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEditModal(habit)}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="pencil"
                        android_material_icon_name="edit"
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteHabit(habit.id)}
                      style={styles.actionButton}
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

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingHabit(null);
                  setHabitTitle("");
                  setHabitColor(COLORS[0]);
                  setHabitModalVisible(true);
                }}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={24}
                  color="white"
                />
                <Text style={styles.addButtonText}>Add Habit</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {affirmations.map((affirmation, index) => (
                <View key={affirmation.id} style={styles.item}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{affirmation.text}</Text>
                    <View style={styles.itemMeta}>
                      {affirmation.isCustom === 1 && (
                        <Text style={styles.itemBadge}>Custom</Text>
                      )}
                      {affirmation.isRepeating === 1 && (
                        <Text style={styles.itemBadge}>Repeating</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => moveAffirmationUp(index)}
                      disabled={index === 0}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="chevron.up"
                        android_material_icon_name="keyboard-arrow-up"
                        size={20}
                        color={index === 0 ? "#999" : "white"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveAffirmationDown(index)}
                      disabled={index === affirmations.length - 1}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="chevron.down"
                        android_material_icon_name="keyboard-arrow-down"
                        size={20}
                        color={index === affirmations.length - 1 ? "#999" : "white"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => toggleAffirmationRepeating(affirmation.id)}
                      style={styles.actionButton}
                    >
                      <IconSymbol
                        ios_icon_name="repeat"
                        android_material_icon_name="repeat"
                        size={20}
                        color={affirmation.isRepeating === 1 ? "#10B981" : "white"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteAffirmationItem(affirmation.id)}
                      style={styles.actionButton}
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

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setAffirmationText("");
                  setAffirmationModalVisible(true);
                }}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={24}
                  color="white"
                />
                <Text style={styles.addButtonText}>Add Custom Affirmation</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
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
              placeholder="e.g., Meditate, Exercise, Read"
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
                  onPress={() => setHabitColor(color)}
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
              placeholder="e.g., I am capable of achieving my goals"
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
  },
  limitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  activeTabText: {
    color: "#4F46E5",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  itemMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  itemBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
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
    color: "#4F46E5",
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
