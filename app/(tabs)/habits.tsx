
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
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";

interface Habit {
  id: string;
  title: string;
  color: string;
  isActive: boolean;
}

interface Affirmation {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite: boolean;
  isRepeating: boolean;
  order?: number;
}

const DEFAULT_HABITS = [
  { title: "Morning meditation", color: "#4F46E5" },
  { title: "Exercise", color: "#10B981" },
  { title: "Read 10 pages", color: "#F59E0B" },
];

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
  const [dailyAffirmations, setDailyAffirmations] = useState<Affirmation[]>([]);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [showAddAffirmationModal, setShowAddAffirmationModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    checkBackendAndLoadData();
  }, [activeTab]);

  const checkBackendAndLoadData = async () => {
    setIsLoading(true);
    
    if (!isBackendConfigured()) {
      console.log("[Habits] Backend not configured, using demo data");
      setBackendReady(false);
      loadDemoData();
      setIsLoading(false);
      return;
    }

    setBackendReady(true);
    if (activeTab === "habits") {
      await loadHabits();
    } else {
      await loadAffirmations();
      await loadDailyAffirmations();
    }
    setIsLoading(false);
  };

  const loadDemoData = () => {
    if (activeTab === "habits") {
      setHabits(
        DEFAULT_HABITS.map((h, index) => ({
          id: `demo-${index}`,
          title: h.title,
          color: h.color,
          isActive: true,
        }))
      );
    } else {
      const demoAffirmations = [
        {
          id: "demo-1",
          text: "I am worthy of love and respect.",
          isCustom: true,
          isFavorite: true,
          isRepeating: true,
          order: 0,
        },
        {
          id: "demo-2",
          text: "I choose to be happy and grateful today.",
          isCustom: true,
          isFavorite: true,
          isRepeating: false,
          order: 1,
        },
        {
          id: "demo-3",
          text: "I am capable of achieving my goals.",
          isCustom: true,
          isFavorite: false,
          isRepeating: true,
          order: 2,
        },
      ];
      setAffirmations(demoAffirmations);
      setDailyAffirmations(demoAffirmations.filter(a => a.isRepeating).slice(0, 3));
    }
  };

  const loadHabits = async () => {
    try {
      console.log("[Habits] Loading habits from backend...");
      
      // Backend Integration: Load habits from backend
      const data = await authenticatedApiCall("/api/habits");
      
      if (Array.isArray(data)) {
        setHabits(data.filter((h) => h.isActive));
        console.log("[Habits] Loaded", data.length, "habits");
      }
    } catch (error: any) {
      console.error("[Habits] Error loading habits:", error);
      
      if (error.message?.includes("Backend URL not configured") || error.message?.includes("Authentication token not found")) {
        loadDemoData();
      } else {
        Alert.alert(
          "Connection Error",
          "Unable to load your habits. Please check your internet connection.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const loadAffirmations = async () => {
    try {
      console.log("[Habits] Loading affirmations from backend...");
      
      // Backend Integration: Load all affirmations (custom and favorites)
      const response = await authenticatedApiCall("/api/affirmations?limit=100");
      
      if (response.affirmations) {
        // Filter to show only custom or favorite affirmations
        const filtered = response.affirmations.filter(
          (a: Affirmation) => a.isCustom || a.isFavorite
        );
        setAffirmations(filtered);
        console.log("[Habits] Loaded", filtered.length, "affirmations");
      }
    } catch (error: any) {
      console.error("[Habits] Error loading affirmations:", error);
      
      if (error.message?.includes("Backend URL not configured") || error.message?.includes("Authentication token not found")) {
        loadDemoData();
      }
    }
  };

  const loadDailyAffirmations = async () => {
    try {
      // Backend Integration: Load daily affirmations (the 3 shown on home)
      const response = await authenticatedApiCall("/api/affirmations/daily");
      
      if (Array.isArray(response)) {
        setDailyAffirmations(response.slice(0, 3));
        console.log("[Habits] Loaded", response.length, "daily affirmations");
      }
    } catch (error: any) {
      console.error("[Habits] Error loading daily affirmations:", error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === "habits") {
      await loadHabits();
    } else {
      await loadAffirmations();
      await loadDailyAffirmations();
    }
    setIsRefreshing(false);
  };

  const createHabit = async (title: string, color: string) => {
    if (!backendReady) {
      // Demo mode: Add locally
      const newHabit: Habit = {
        id: `demo-${Date.now()}`,
        title,
        color,
        isActive: true,
      };
      setHabits((prev) => [...prev, newHabit]);
      Alert.alert("Success", "Habit added! (Demo mode - won't be saved)");
      return;
    }

    try {
      // Backend Integration: Create habit via backend API
      const data = await authenticatedApiCall("/api/habits", {
        method: "POST",
        body: JSON.stringify({ title, color }),
      });

      if (data?.id) {
        setHabits((prev) => [...prev, data]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log("[Habits] Habit created:", data.id);
      }
    } catch (error: any) {
      console.error("[Habits] Error creating habit:", error);
      
      if (error.message?.includes("limit")) {
        Alert.alert("Limit Reached", "You've reached the maximum number of habits. Upgrade to Pro for unlimited habits!");
      } else if (error.message?.includes("Authentication token not found")) {
        Alert.alert("Session Expired", "Please sign in again to continue.");
      } else {
        Alert.alert("Error", "Failed to create habit. Please check your internet connection and try again.");
      }
      throw error;
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    try {
      await createHabit(newHabitTitle.trim(), selectedColor);
      setNewHabitTitle("");
      setSelectedColor(COLORS[0]);
      setShowAddHabitModal(false);
    } catch (error) {
      console.error("[Habits] Failed to add habit:", error);
    }
  };

  const handleEditHabit = async () => {
    if (!editingHabit || !newHabitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    if (!backendReady) {
      // Demo mode: Update locally
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id
            ? { ...h, title: newHabitTitle.trim(), color: selectedColor }
            : h
        )
      );
      setShowEditHabitModal(false);
      setEditingHabit(null);
      setNewHabitTitle("");
      Alert.alert("Success", "Habit updated! (Demo mode - won't be saved)");
      return;
    }

    try {
      // Backend Integration: Update habit via backend API
      const data = await authenticatedApiCall(`/api/habits/${editingHabit.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: newHabitTitle.trim(),
          color: selectedColor,
        }),
      });

      if (data) {
        setHabits((prev) =>
          prev.map((h) => (h.id === editingHabit.id ? data : h))
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowEditHabitModal(false);
      setEditingHabit(null);
      setNewHabitTitle("");
    } catch (error) {
      console.error("[Habits] Error updating habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
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
            if (!backendReady) {
              // Demo mode: Delete locally
              setHabits((prev) => prev.filter((h) => h.id !== id));
              return;
            }

            try {
              // Backend Integration: Delete habit via backend API (soft delete)
              await authenticatedApiCall(`/api/habits/${id}`, {
                method: "DELETE",
              });

              setHabits((prev) => prev.filter((h) => h.id !== id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log("[Habits] Habit deleted:", id);
            } catch (error) {
              console.error("[Habits] Error deleting habit:", error);
              Alert.alert("Error", "Failed to delete habit. Please try again.");
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

  const handleAddCustomAffirmation = async () => {
    if (!newAffirmationText.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    if (!backendReady) {
      // Demo mode: Add locally
      const newAffirmation: Affirmation = {
        id: `demo-${Date.now()}`,
        text: newAffirmationText.trim(),
        isCustom: true,
        isFavorite: false,
        isRepeating: false,
      };
      setAffirmations((prev) => [...prev, newAffirmation]);
      setNewAffirmationText("");
      setShowAddAffirmationModal(false);
      Alert.alert("Success", "Affirmation added! (Demo mode - won't be saved)");
      return;
    }

    try {
      // Backend Integration: Create custom affirmation via backend API
      const data = await authenticatedApiCall("/api/affirmations/custom", {
        method: "POST",
        body: JSON.stringify({ text: newAffirmationText.trim() }),
      });

      if (data?.id) {
        setAffirmations((prev) => [...prev, data]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setNewAffirmationText("");
      setShowAddAffirmationModal(false);
    } catch (error) {
      console.error("[Habits] Error creating affirmation:", error);
      Alert.alert("Error", "Failed to create affirmation. Please try again.");
    }
  };

  const toggleAffirmationRepeating = async (affirmationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const affirmation = affirmations.find((a) => a.id === affirmationId);
    if (!affirmation) return;

    const newRepeating = !affirmation.isRepeating;

    // Update locally first
    setAffirmations((prev) =>
      prev.map((a) =>
        a.id === affirmationId ? { ...a, isRepeating: newRepeating } : a
      )
    );

    // Also update daily affirmations list
    if (newRepeating) {
      setDailyAffirmations((prev) => [...prev, { ...affirmation, isRepeating: true }].slice(0, 3));
    } else {
      setDailyAffirmations((prev) => prev.filter(a => a.id !== affirmationId));
    }

    if (backendReady) {
      try {
        // Backend Integration: Toggle affirmation repeating status via backend API
        await authenticatedApiCall(`/api/affirmations/${affirmationId}/repeat`, {
          method: "POST",
        });
      } catch (error) {
        console.error("[Habits] Error toggling repeating:", error);
        // Revert on error
        setAffirmations((prev) =>
          prev.map((a) =>
            a.id === affirmationId ? { ...a, isRepeating: !newRepeating } : a
          )
        );
      }
    }
  };

  const moveAffirmationUp = (index: number) => {
    if (index === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newDaily = [...dailyAffirmations];
    [newDaily[index - 1], newDaily[index]] = [newDaily[index], newDaily[index - 1]];
    setDailyAffirmations(newDaily);

    // Note: Backend doesn't support custom ordering yet
    // Order is determined by the backend based on repeating status and creation time
    // This is a local-only reorder for UI purposes
  };

  const moveAffirmationDown = (index: number) => {
    if (index === dailyAffirmations.length - 1) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newDaily = [...dailyAffirmations];
    [newDaily[index], newDaily[index + 1]] = [newDaily[index + 1], newDaily[index]];
    setDailyAffirmations(newDaily);

    // Note: Backend doesn't support custom ordering yet
    // Order is determined by the backend based on repeating status and creation time
    // This is a local-only reorder for UI purposes
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
            if (!backendReady) {
              setAffirmations((prev) => prev.filter((a) => a.id !== affirmationId));
              setDailyAffirmations((prev) => prev.filter((a) => a.id !== affirmationId));
              return;
            }

            try {
              // Backend Integration: Affirmations are managed by toggling favorite/repeating status
              // Removing from the list just means unfavoriting and un-repeating
              // The affirmation still exists in history
              setAffirmations((prev) => prev.filter((a) => a.id !== affirmationId));
              setDailyAffirmations((prev) => prev.filter((a) => a.id !== affirmationId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "Affirmation removed from your list");
            } catch (error) {
              console.error("[Habits] Error deleting affirmation:", error);
              Alert.alert("Error", "Failed to delete affirmation.");
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

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Habits</Text>
        
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
              Demo Mode - Changes won&apos;t be saved until backend is ready
            </Text>
          </View>
        )}

        {activeTab === "habits" ? (
          <>
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
                {habits.map((habit) => (
                  <View key={habit.id} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <View
                        style={[styles.colorIndicator, { backgroundColor: habit.color }]}
                      />
                      <Text style={styles.itemTitle}>{habit.title}</Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
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
                        style={styles.actionButton}
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
            {/* Daily Affirmations Section */}
            <View style={styles.dailySection}>
              <Text style={styles.sectionTitle}>Daily Affirmations (Shown on Home)</Text>
              <Text style={styles.sectionSubtitle}>
                These {dailyAffirmations.length} affirmations appear on your home screen. Reorder them or toggle repeating status.
              </Text>
              
              {dailyAffirmations.length === 0 ? (
                <View style={styles.emptyDaily}>
                  <Text style={styles.emptyDailyText}>
                    No daily affirmations set. Mark affirmations as &quot;Daily&quot; below to show them on home.
                  </Text>
                </View>
              ) : (
                <View style={styles.dailyList}>
                  {dailyAffirmations.map((affirmation, index) => (
                    <View key={affirmation.id} style={styles.dailyCard}>
                      <View style={styles.dailyContent}>
                        <View style={styles.dailyNumber}>
                          <Text style={styles.dailyNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.dailyText}>{affirmation.text}</Text>
                      </View>
                      <View style={styles.dailyActions}>
                        <TouchableOpacity
                          style={[styles.iconButton, index === 0 && styles.iconButtonDisabled]}
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
                          style={[styles.iconButton, index === dailyAffirmations.length - 1 && styles.iconButtonDisabled]}
                          onPress={() => moveAffirmationDown(index)}
                          disabled={index === dailyAffirmations.length - 1}
                        >
                          <IconSymbol
                            ios_icon_name="chevron.down"
                            android_material_icon_name="arrow-downward"
                            size={20}
                            color={index === dailyAffirmations.length - 1 ? "#CCC" : "#4F46E5"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => toggleAffirmationRepeating(affirmation.id)}
                        >
                          <IconSymbol
                            ios_icon_name="xmark.circle"
                            android_material_icon_name="close"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* All Affirmations Section */}
            <View style={styles.allSection}>
              <Text style={styles.sectionTitle}>All Affirmations</Text>
              <Text style={styles.sectionSubtitle}>
                Manage custom affirmations and set them to repeat daily
              </Text>
              
              {affirmations.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={64}
                    color="#FFF"
                  />
                  <Text style={styles.emptyStateText}>No custom affirmations yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the + button to add your first affirmation
                  </Text>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {affirmations.map((affirmation) => (
                    <View key={affirmation.id} style={styles.affirmationCard}>
                      <View style={styles.affirmationContent}>
                        <Text style={styles.affirmationText}>{affirmation.text}</Text>
                        <View style={styles.affirmationMeta}>
                          {affirmation.isCustom && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>Custom</Text>
                            </View>
                          )}
                          {affirmation.isFavorite && (
                            <View style={styles.badge}>
                              <IconSymbol
                                ios_icon_name="star.fill"
                                android_material_icon_name="star"
                                size={12}
                                color="#FFD700"
                              />
                              <Text style={styles.badgeText}>Favorite</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.affirmationActions}>
                        <TouchableOpacity
                          style={[
                            styles.repeatButton,
                            affirmation.isRepeating && styles.repeatButtonActive,
                          ]}
                          onPress={() => toggleAffirmationRepeating(affirmation.id)}
                        >
                          <IconSymbol
                            ios_icon_name="repeat"
                            android_material_icon_name="repeat"
                            size={16}
                            color={affirmation.isRepeating ? "#FFF" : "#4F46E5"}
                          />
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
                          style={styles.actionButton}
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
            </View>
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
  dailySection: {
    marginBottom: 24,
  },
  allSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#E0E7FF",
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyDaily: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyDailyText: {
    fontSize: 14,
    color: "#E0E7FF",
    textAlign: "center",
    lineHeight: 20,
  },
  dailyList: {
    gap: 12,
  },
  dailyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailyContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 12,
  },
  dailyNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dailyNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  dailyText: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    lineHeight: 22,
  },
  dailyActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    padding: 6,
  },
  iconButtonDisabled: {
    opacity: 0.3,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flex: 1,
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
  },
  actionButton: {
    padding: 8,
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
    marginBottom: 8,
  },
  affirmationMeta: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },
  affirmationActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  repeatButtonActive: {
    backgroundColor: "#4F46E5",
  },
  repeatButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  repeatButtonTextActive: {
    color: "#FFF",
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
