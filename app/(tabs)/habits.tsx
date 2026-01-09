
import React, { useState, useEffect } from "react";
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
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedApiCall } from "@/utils/api";
import * as Haptics from "expo-haptics";

interface Habit {
  id: string;
  title: string;
  color: string;
  isActive: boolean;
}

const DEFAULT_HABITS = [
  { title: "Morning meditation", color: "#8B5CF6" },
  { title: "Exercise", color: "#10B981" },
  { title: "Read 10 pages", color: "#3B82F6" },
];

const COLORS = [
  "#4F46E5", "#8B5CF6", "#10B981", "#3B82F6", 
  "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      console.log("[HabitsScreen] Loading habits...");
      
      // TODO: Backend Integration - Fetch habits from /api/habits endpoint
      const response = await authenticatedApiCall(`/api/habits`, {
        method: "GET",
      });
      
      console.log("[HabitsScreen] Habits response:", response);
      
      if (response && Array.isArray(response)) {
        if (response.length === 0) {
          // Initialize with default habits
          console.log("[HabitsScreen] No habits found, creating defaults...");
          for (const habit of DEFAULT_HABITS) {
            await createHabit(habit.title, habit.color);
          }
          // Reload after creating defaults
          const newResponse = await authenticatedApiCall(`/api/habits`, {
            method: "GET",
          });
          setHabits(newResponse || []);
        } else {
          setHabits(response);
        }
      }
    } catch (error) {
      console.error("[HabitsScreen] Error loading habits:", error);
      Alert.alert("Error", "Failed to load habits. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createHabit = async (title: string, color: string = "#4F46E5") => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    try {
      console.log("[HabitsScreen] Creating habit:", title, color);
      
      // TODO: Backend Integration - Create habit via /api/habits endpoint
      const response = await authenticatedApiCall(`/api/habits`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), color }),
      });

      console.log("[HabitsScreen] Create response:", response);

      if (response) {
        loadHabits();
        setNewHabitTitle("");
        setSelectedColor(COLORS[0]);
        setShowAddModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[HabitsScreen] Error creating habit:", error);
      Alert.alert("Error", "Failed to create habit. Please try again.");
    }
  };

  const updateHabit = async (id: string, title: string) => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    try {
      console.log("[HabitsScreen] Updating habit:", id, title);
      
      // TODO: Backend Integration - Update habit via /api/habits/:id endpoint
      const response = await authenticatedApiCall(`/api/habits/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title: title.trim() }),
      });

      console.log("[HabitsScreen] Update response:", response);

      if (response) {
        loadHabits();
        setEditingHabit(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("[HabitsScreen] Error updating habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const deleteHabit = async (id: string) => {
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
              console.log("[HabitsScreen] Deleting habit:", id);
              
              // TODO: Backend Integration - Delete habit via /api/habits/:id endpoint
              await authenticatedApiCall(`/api/habits/${id}`, {
                method: "DELETE",
              });
              
              loadHabits();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("[HabitsScreen] Error deleting habit:", error);
              Alert.alert("Error", "Failed to delete habit. Please try again.");
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHabits();
  };

  if (loading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading habits...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        <Text style={styles.title}>Manage Habits</Text>
        <Text style={styles.subtitle}>Customize your daily tasks</Text>

        {habits.map((habit) => (
          <View key={habit.id} style={styles.habitCard}>
            {editingHabit?.id === habit.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingHabit.title}
                  onChangeText={(text) =>
                    setEditingHabit({ ...editingHabit, title: text })
                  }
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => updateHabit(habit.id, editingHabit.title)}
                  style={styles.iconButton}
                >
                  <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={24} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingHabit(null)}
                  style={styles.iconButton}
                >
                  <IconSymbol ios_icon_name="xmark" android_material_icon_name="close" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.habitInfo}>
                  <View
                    style={[styles.colorDot, { backgroundColor: habit.color }]}
                  />
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                </View>
                <View style={styles.habitActions}>
                  <TouchableOpacity
                    onPress={() => setEditingHabit(habit)}
                    style={styles.iconButton}
                  >
                    <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteHabit(habit.id)}
                    style={styles.iconButton}
                  >
                    <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add_circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New Habit</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter habit name..."
              placeholderTextColor="#9CA3AF"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
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
                >
                  {selectedColor === color && (
                    <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => createHabit(newHabitTitle, selectedColor)}
            >
              <Text style={styles.modalButtonText}>Add Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowAddModal(false);
                setNewHabitTitle("");
                setSelectedColor(COLORS[0]);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    color: "#FFFFFF",
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 24,
  },
  habitCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  habitActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
    paddingVertical: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#1F2937",
  },
  modalButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
