
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { BACKEND_URL } from "@/utils/api";
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

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/habits`);
      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          // Initialize with default habits
          for (const habit of DEFAULT_HABITS) {
            await createHabit(habit.title, habit.color);
          }
          loadHabits();
        } else {
          setHabits(data);
        }
      }
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  const createHabit = async (title: string, color: string = "#4F46E5") => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, color }),
      });

      if (response.ok) {
        loadHabits();
        setNewHabitTitle("");
        setShowAddModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const updateHabit = async (id: string, title: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        loadHabits();
        setEditingHabit(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error updating habit:", error);
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
              await fetch(`${BACKEND_URL}/api/habits/${id}`, {
                method: "DELETE",
              });
              loadHabits();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("Error deleting habit:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => createHabit(newHabitTitle)}
            >
              <Text style={styles.modalButtonText}>Add Habit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowAddModal(false);
                setNewHabitTitle("");
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
