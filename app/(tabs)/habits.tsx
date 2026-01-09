
import { authenticatedApiCall } from "@/utils/api";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
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
import React, { useState, useEffect } from "react";

interface Habit {
  id: string;
  title: string;
  color: string;
  isActive: boolean;
}

const DEFAULT_HABITS = [
  { title: "Morning meditation", color: "#6366F1" },
  { title: "Exercise", color: "#10B981" },
  { title: "Read 10 pages", color: "#F59E0B" },
];

const COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
  "#EC4899", "#14B8A6", "#F97316"
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const data = await authenticatedApiCall("/api/habits");
      const activeHabits = data.filter((h: Habit) => h.isActive);
      
      if (activeHabits.length === 0) {
        // Create default habits on first launch
        for (const habit of DEFAULT_HABITS) {
          await createHabit(habit.title, habit.color);
        }
        const newData = await authenticatedApiCall("/api/habits");
        setHabits(newData.filter((h: Habit) => h.isActive));
      } else {
        setHabits(activeHabits);
      }
    } catch (error) {
      console.error("Error loading habits:", error);
      Alert.alert("Error", "Failed to load habits");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createHabit = async (title: string, color: string) => {
    try {
      await authenticatedApiCall("/api/habits", {
        method: "POST",
        body: JSON.stringify({ title, color }),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Error creating habit:", error);
      throw error;
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) {
      Alert.alert("Error", "Please enter a habit name");
      return;
    }

    try {
      await createHabit(newHabitTitle, selectedColor);
      setNewHabitTitle("");
      setSelectedColor(COLORS[0]);
      setShowAddModal(false);
      loadHabits();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create habit");
    }
  };

  const handleEditHabit = async () => {
    if (!editingHabit || !newHabitTitle.trim()) return;

    try {
      await authenticatedApiCall(`/api/habits/${editingHabit.id}`, {
        method: "PUT",
        body: JSON.stringify({ 
          title: newHabitTitle,
          color: selectedColor,
        }),
      });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      setEditingHabit(null);
      setNewHabitTitle("");
      loadHabits();
    } catch (error: any) {
      console.error("Error updating habit:", error);
      Alert.alert("Error", error.message || "Failed to update habit");
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
              await authenticatedApiCall(`/api/habits/${id}`, {
                method: "DELETE",
              });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadHabits();
            } catch (error: any) {
              console.error("Error deleting habit:", error);
              Alert.alert("Error", error.message || "Failed to delete habit");
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

  const onRefresh = () => {
    setRefreshing(true);
    loadHabits();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#6366F1", "#87CEEB"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Manage Your Habits</Text>
        <Text style={styles.subtitle}>
          Customize your daily habits to track
        </Text>

        <View style={styles.habitsList}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitInfo}>
                <View
                  style={[styles.colorDot, { backgroundColor: habit.color }]}
                />
                <Text style={styles.habitTitle}>{habit.title}</Text>
              </View>
              <View style={styles.habitActions}>
                <TouchableOpacity
                  onPress={() => openEditModal(habit)}
                  style={styles.actionButton}
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
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol 
            ios_icon_name="plus.circle.fill" 
            android_material_icon_name="add-circle" 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.addButtonText}>Add New Habit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Habit name"
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
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
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
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Save
                </Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#E0E7FF",
    marginBottom: 24,
  },
  habitsList: {
    gap: 12,
    marginBottom: 24,
  },
  habitCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    flex: 1,
  },
  habitActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: "#6366F1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    color: "#6B7280",
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
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#1F2937",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonSave: {
    backgroundColor: "#6366F1",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalButtonTextSave: {
    color: "#FFF",
  },
});
