
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Habit {
  id: string;
  title: string;
  color: string;
  isActive: boolean;
  isRepeating: boolean;
}

interface Affirmation {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite: boolean;
  isRepeating: boolean;
  order?: number;
}

const STORAGE_KEYS = {
  AFFIRMATIONS: "indigo_habits_affirmations",
  HABITS: "indigo_habits_habits",
  HAS_PREMIUM: "indigo_habits_has_premium",
};

const COLORS = [
  "#4F46E5", // Indigo
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

export default function HabitsScreen() {
  const [activeTab, setActiveTab] = useState<"habits" | "affirmations">("habits");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [showAddAffirmationModal, setShowAddAffirmationModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    await loadPremiumStatus();
    if (activeTab === "habits") {
      await loadHabits();
    } else {
      await loadAffirmations();
    }
    setIsLoading(false);
  };

  const loadPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem(STORAGE_KEYS.HAS_PREMIUM);
      setHasPremium(premiumStatus === "true");
      console.log("[Habits] Premium status:", premiumStatus === "true");
    } catch (error) {
      console.error("[Habits] Error loading premium status:", error);
    }
  };

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
      if (storedHabits) {
        const parsed = JSON.parse(storedHabits);
        setHabits(parsed.filter((h: Habit) => h.isActive));
        console.log("[Habits] Loaded", parsed.length, "habits");
      } else {
        setHabits([]);
      }
    } catch (error) {
      console.error("[Habits] Error loading habits:", error);
    }
  };

  const loadAffirmations = async () => {
    try {
      const storedAffirmations = await AsyncStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
      if (storedAffirmations) {
        const parsed = JSON.parse(storedAffirmations);
        setAffirmations(parsed);
        console.log("[Habits] Loaded", parsed.length, "affirmations");
      } else {
        setAffirmations([]);
      }
    } catch (error) {
      console.error("[Habits] Error loading affirmations:", error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    // Check limit for free users
    const repeatingCount = habits.filter(h => h.isRepeating).length;
    if (!hasPremium && repeatingCount >= 5) {
      Alert.alert(
        "Limit Reached",
        "Free users can have up to 5 daily habits. Upgrade to Premium for unlimited habits!",
        [{ text: "OK" }]
      );
      return;
    }

    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title: newHabitTitle.trim(),
      color: selectedColor,
      isActive: true,
      isRepeating: false,
    };

    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
      console.log("[Habits] Habit added:", newHabit.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[Habits] Error saving habit:", error);
    }

    setNewHabitTitle("");
    setSelectedColor(COLORS[0]);
    setShowAddHabitModal(false);
  };

  const handleEditHabit = async () => {
    if (!editingHabit || !newHabitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    const updatedHabits = habits.map((h) =>
      h.id === editingHabit.id
        ? { ...h, title: newHabitTitle.trim(), color: selectedColor }
        : h
    );
    setHabits(updatedHabits);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
      console.log("[Habits] Habit updated:", editingHabit.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[Habits] Error updating habit:", error);
    }

    setShowEditHabitModal(false);
    setEditingHabit(null);
    setNewHabitTitle("");
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
            const updatedHabits = habits.filter((h) => h.id !== id);
            setHabits(updatedHabits);

            try {
              await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
              console.log("[Habits] Habit deleted:", id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("[Habits] Error deleting habit:", error);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
    setSelectedColor(habit.color);
    setShowEditHabitModal(true);
  };

  const toggleHabitRepeating = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const newRepeating = !habit.isRepeating;

    // Check limit for free users
    if (!hasPremium && newRepeating) {
      const repeatingCount = habits.filter(h => h.isRepeating).length;
      if (repeatingCount >= 5) {
        Alert.alert(
          "Limit Reached",
          "Free users can have up to 5 daily habits. Upgrade to Premium for unlimited!",
          [{ text: "OK" }]
        );
        return;
      }
    }

    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, isRepeating: newRepeating } : h
    );
    setHabits(updatedHabits);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updatedHabits));
      console.log("[Habits] Habit repeating toggled:", habitId, newRepeating);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[Habits] Error toggling repeating:", error);
    }
  };

  const moveHabitUp = async (index: number) => {
    if (index === 0) return;

    const newHabits = [...habits];
    [newHabits[index - 1], newHabits[index]] = [newHabits[index], newHabits[index - 1]];
    setHabits(newHabits);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(newHabits));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[Habits] Error reordering habits:", error);
    }
  };

  const moveHabitDown = async (index: number) => {
    if (index === habits.length - 1) return;

    const newHabits = [...habits];
    [newHabits[index], newHabits[index + 1]] = [newHabits[index + 1], newHabits[index]];
    setHabits(newHabits);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(newHabits));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[Habits] Error reordering habits:", error);
    }
  };

  const handleAddCustomAffirmation = async () => {
    if (!newAffirmationText.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    // Check limit for free users
    const repeatingCount = affirmations.filter(a => a.isRepeating).length;
    if (!hasPremium && repeatingCount >= 5) {
      Alert.alert(
        "Limit Reached",
        "Free users can have up to 5 daily affirmations. Upgrade to Premium for unlimited!",
        [{ text: "OK" }]
      );
      return;
    }

    const newAffirmation: Affirmation = {
      id: `affirmation-${Date.now()}`,
      text: newAffirmationText.trim(),
      isCustom: true,
      isFavorite: false,
      isRepeating: false,
    };

    const updatedAffirmations = [...affirmations, newAffirmation];
    setAffirmations(updatedAffirmations);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(updatedAffirmations));
      console.log("[Habits] Affirmation added:", newAffirmation.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[Habits] Error saving affirmation:", error);
    }

    setNewAffirmationText("");
    setShowAddAffirmationModal(false);
  };

  const toggleAffirmationRepeating = async (affirmationId: string) => {
    const affirmation = affirmations.find((a) => a.id === affirmationId);
    if (!affirmation) return;

    const newRepeating = !affirmation.isRepeating;

    // Check limit for free users
    if (!hasPremium && newRepeating) {
      const repeatingCount = affirmations.filter(a => a.isRepeating).length;
      if (repeatingCount >= 5) {
        Alert.alert(
          "Limit Reached",
          "Free users can have up to 5 daily affirmations. Upgrade to Premium for unlimited!",
          [{ text: "OK" }]
        );
        return;
      }
    }

    const updatedAffirmations = affirmations.map((a) =>
      a.id === affirmationId ? { ...a, isRepeating: newRepeating } : a
    );
    setAffirmations(updatedAffirmations);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(updatedAffirmations));
      console.log("[Habits] Affirmation repeating toggled:", affirmationId, newRepeating);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[Habits] Error toggling repeating:", error);
    }
  };

  const moveAffirmationUp = async (index: number) => {
    if (index === 0) return;

    const newAffirmations = [...affirmations];
    [newAffirmations[index - 1], newAffirmations[index]] = [newAffirmations[index], newAffirmations[index - 1]];
    setAffirmations(newAffirmations);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(newAffirmations));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[Habits] Error reordering affirmations:", error);
    }
  };

  const moveAffirmationDown = async (index: number) => {
    if (index === affirmations.length - 1) return;

    const newAffirmations = [...affirmations];
    [newAffirmations[index], newAffirmations[index + 1]] = [newAffirmations[index + 1], newAffirmations[index]];
    setAffirmations(newAffirmations);

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(newAffirmations));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[Habits] Error reordering affirmations:", error);
    }
  };

  const deleteAffirmation = async (affirmationId: string) => {
    Alert.alert(
      "Delete Affirmation",
      "Are you sure you want to delete this affirmation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedAffirmations = affirmations.filter((a) => a.id !== affirmationId);
            setAffirmations(updatedAffirmations);

            try {
              await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(updatedAffirmations));
              console.log("[Habits] Affirmation deleted:", affirmationId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("[Habits] Error deleting affirmation:", error);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const dailyHabits = habits.filter(h => h.isRepeating);
  const dailyAffirmations = affirmations.filter(a => a.isRepeating);

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage</Text>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "habits" && styles.activeTab]}
            onPress={() => setActiveTab("habits")}
          >
            <Text style={[styles.tabText, activeTab === "habits" && styles.activeTabText]}>
              Habits
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "affirmations" && styles.activeTab]}
            onPress={() => setActiveTab("affirmations")}
          >
            <Text style={[styles.tabText, activeTab === "affirmations" && styles.activeTabText]}>
              Affirmations
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        {activeTab === "habits" ? (
          <>
            {/* Daily Habits Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Daily Habits on Home: {dailyHabits.length}/5</Text>
              <Text style={styles.infoText}>
                Toggle &quot;Daily&quot; to show habits on your home screen. {!hasPremium && "Free users: max 5 daily habits."}
              </Text>
            </View>

            {habits.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={64}
                  color="#FFF"
                />
                <Text style={styles.emptyStateText}>No habits yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button below to add your first habit
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {habits.map((habit, index) => (
                  <View key={habit.id} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <View
                        style={[styles.colorIndicator, { backgroundColor: habit.color }]}
                      />
                      <Text style={styles.itemTitle}>{habit.title}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[
                          styles.repeatButton,
                          habit.isRepeating && styles.repeatButtonActive,
                        ]}
                        onPress={() => toggleHabitRepeating(habit.id)}
                      >
                        <Text
                          style={[
                            styles.repeatButtonText,
                            habit.isRepeating && styles.repeatButtonTextActive,
                          ]}
                        >
                          {habit.isRepeating ? "Daily" : "Repeat"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => moveHabitUp(index)}
                        disabled={index === 0}
                      >
                        <IconSymbol
                          ios_icon_name="chevron.up"
                          android_material_icon_name="arrow-upward"
                          size={20}
                          color={index === 0 ? "#CCC" : "#4F46E5"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => moveHabitDown(index)}
                        disabled={index === habits.length - 1}
                      >
                        <IconSymbol
                          ios_icon_name="chevron.down"
                          android_material_icon_name="arrow-downward"
                          size={20}
                          color={index === habits.length - 1 ? "#CCC" : "#4F46E5"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => openEditModal(habit)}
                      >
                        <IconSymbol
                          ios_icon_name="pencil"
                          android_material_icon_name="edit"
                          size={20}
                          color="#4F46E5"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDeleteHabit(habit.id)}
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
              </View>
            )}
          </>
        ) : (
          <>
            {/* Daily Affirmations Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Daily Affirmations on Home: {dailyAffirmations.length}/5</Text>
              <Text style={styles.infoText}>
                Toggle &quot;Daily&quot; to show affirmations on your home screen. {!hasPremium && "Free users: max 5 daily affirmations."}
              </Text>
            </View>

            {affirmations.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={64}
                  color="#FFF"
                />
                <Text style={styles.emptyStateText}>No affirmations yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button to add your first affirmation
                </Text>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {affirmations.map((affirmation, index) => (
                  <View key={affirmation.id} style={styles.affirmationCard}>
                    <View style={styles.affirmationContent}>
                      <Text style={styles.affirmationText}>{affirmation.text}</Text>
                    </View>
                    <View style={styles.affirmationActions}>
                      <TouchableOpacity
                        style={[
                          styles.repeatButton,
                          affirmation.isRepeating && styles.repeatButtonActive,
                        ]}
                        onPress={() => toggleAffirmationRepeating(affirmation.id)}
                      >
                        <Text
                          style={[
                            styles.repeatButtonText,
                            affirmation.isRepeating && styles.repeatButtonTextActive,
                          ]}
                        >
                          {affirmation.isRepeating ? "Daily" : "Repeat"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => moveAffirmationUp(index)}
                        disabled={index === 0}
                      >
                        <IconSymbol
                          ios_icon_name="chevron.up"
                          android_material_icon_name="arrow-upward"
                          size={20}
                          color={index === 0 ? "#CCC" : "#4F46E5"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => moveAffirmationDown(index)}
                        disabled={index === affirmations.length - 1}
                      >
                        <IconSymbol
                          ios_icon_name="chevron.down"
                          android_material_icon_name="arrow-downward"
                          size={20}
                          color={index === affirmations.length - 1 ? "#CCC" : "#4F46E5"}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => deleteAffirmation(affirmation.id)}
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
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (activeTab === "habits") {
            setShowAddHabitModal(true);
          } else {
            setShowAddAffirmationModal(true);
          }
        }}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={28}
          color="#FFF"
        />
      </TouchableOpacity>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddHabitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddHabitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Habit name (e.g., Morning meditation)"
              placeholderTextColor="#9CA3AF"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              autoFocus
            />

            <Text style={styles.colorLabel}>Choose a color:</Text>
            <View style={styles.colorPicker}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddHabitModal(false);
                  setNewHabitTitle("");
                  setSelectedColor(COLORS[0]);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleAddHabit}
              >
                <Text style={[styles.modalButtonText, { color: "#FFF" }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal
        visible={showEditHabitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditHabitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Habit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Habit name"
              placeholderTextColor="#9CA3AF"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              autoFocus
            />

            <Text style={styles.colorLabel}>Choose a color:</Text>
            <View style={styles.colorPicker}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEditHabitModal(false);
                  setEditingHabit(null);
                  setNewHabitTitle("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleEditHabit}
              >
                <Text style={[styles.modalButtonText, { color: "#FFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Custom Affirmation Modal */}
      <Modal
        visible={showAddAffirmationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddAffirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Affirmation</Text>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your affirmation..."
              placeholderTextColor="#9CA3AF"
              value={newAffirmationText}
              onChangeText={setNewAffirmationText}
              multiline
              numberOfLines={4}
              autoFocus
            />

            <Text style={styles.helperText}>
              You can set this affirmation to repeat daily after adding it
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddAffirmationModal(false);
                  setNewAffirmationText("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleAddCustomAffirmation}
              >
                <Text style={[styles.modalButtonText, { color: "#FFF" }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  activeTabText: {
    color: "#4F46E5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 8,
    textAlign: "center",
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  iconButton: {
    padding: 6,
  },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  repeatButtonActive: {
    backgroundColor: "#4F46E5",
  },
  repeatButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
  },
  repeatButtonTextActive: {
    color: "#FFF",
  },
  affirmationCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  affirmationContent: {
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  affirmationActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    fontStyle: "italic",
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#1F2937",
    borderWidth: 3,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonSave: {
    backgroundColor: "#4F46E5",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
});
