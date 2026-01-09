
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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    checkBackendAndLoadHabits();
  }, []);

  const checkBackendAndLoadHabits = async () => {
    setIsLoading(true);
    
    if (!isBackendConfigured()) {
      console.log("[Habits] Backend not configured, using demo data");
      setBackendReady(false);
      loadDemoHabits();
      setIsLoading(false);
      return;
    }

    setBackendReady(true);
    await loadHabits();
    setIsLoading(false);
  };

  const loadDemoHabits = () => {
    setHabits(
      DEFAULT_HABITS.map((h, index) => ({
        id: `demo-${index}`,
        title: h.title,
        color: h.color,
        isActive: true,
      }))
    );
  };

  const loadHabits = async () => {
    try {
      console.log("[Habits] Loading habits from backend...");
      
      // TODO: Backend Integration - Load habits from /api/habits
      const data = await authenticatedApiCall("/api/habits");
      
      if (Array.isArray(data)) {
        setHabits(data.filter((h) => h.isActive));
        console.log("[Habits] Loaded", data.length, "habits");
      }
    } catch (error: any) {
      console.error("[Habits] Error loading habits:", error);
      
      if (error.message?.includes("Backend URL not configured")) {
        loadDemoHabits();
      } else {
        Alert.alert(
          "Connection Error",
          "Unable to load your habits. Please check your internet connection.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHabits();
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
      // TODO: Backend Integration - Create habit via /api/habits
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
        Alert.alert("Limit Reached", "Upgrade to Pro for unlimited habits!");
      } else {
        Alert.alert("Error", "Failed to create habit. Please try again.");
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
      setShowAddModal(false);
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
      setShowEditModal(false);
      setEditingHabit(null);
      setNewHabitTitle("");
      Alert.alert("Success", "Habit updated! (Demo mode - won't be saved)");
      return;
    }

    try {
      // TODO: Backend Integration - Update habit via /api/habits/{id}
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

      setShowEditModal(false);
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
              // TODO: Backend Integration - Delete habit via /api/habits/{id}
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
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
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

        <Text style={styles.title}>My Habits</Text>
        <Text style={styles.subtitle}>
          {backendReady ? "Manage your daily habits" : "Demo habits - Add your own when backend is ready"}
        </Text>

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
          <View style={styles.habitsList}>
            {habits.map((habit) => (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitInfo}>
                  <View
                    style={[styles.colorIndicator, { backgroundColor: habit.color }]}
                  />
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                </View>
                <View style={styles.habitActions}>
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
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
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
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
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
                  setShowAddModal(false);
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
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
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
                  setShowEditModal(false);
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#E0E7FF",
    marginTop: 8,
    textAlign: "center",
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
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
  habitInfo: {
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
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
  },
  habitActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
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
