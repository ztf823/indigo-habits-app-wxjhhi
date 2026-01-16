
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation } from "@/utils/affirmations";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import {
  getAllAffirmations,
  getAllHabits,
  createAffirmation,
  updateAffirmation,
  deleteAffirmation,
  updateHabit,
  deleteHabit,
  getHabitCompletion,
  setHabitCompletion,
  getProfile,
} from "@/utils/database";

interface Affirmation {
  id: string;
  text: string;
  isCustom: number;
  isFavorite?: number;
  isRepeating?: number;
}

interface Habit {
  id: string;
  title: string;
  completed?: boolean;
  color: string;
  isFavorite?: number;
  isRepeating?: number;
}

const MAX_AFFIRMATIONS = 5;
const MAX_HABITS = 3;

export default function HomeScreen() {
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const loadPremiumStatus = useCallback(async () => {
    try {
      const profile = await getProfile();
      setIsPremium(profile?.isPremium === 1);
    } catch (error) {
      console.error("Error loading premium status:", error);
    }
  }, []);

  const loadAffirmations = useCallback(async () => {
    try {
      const dbAffirmations = (await getAllAffirmations()) as Affirmation[];

      // If no affirmations, create initial ones
      if (dbAffirmations.length === 0) {
        console.log("No affirmations found, creating initial affirmations...");
        const initialAffirmations = [];
        for (let i = 0; i < 2; i++) {
          const affirmation = getRandomAffirmation();
          const newAffirmation = {
            id: `affirmation_${Date.now()}_${i}`,
            text: affirmation,
            isCustom: false,
            orderIndex: i,
          };
          await createAffirmation(newAffirmation);
          initialAffirmations.push({ ...newAffirmation, isCustom: 0 });
        }
        setAffirmations(initialAffirmations);
      } else {
        setAffirmations(dbAffirmations);
      }
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const dbHabits = (await getAllHabits()) as Habit[];
      const today = new Date().toISOString().split("T")[0];

      // Load completion status for today
      const habitsWithCompletion = await Promise.all(
        dbHabits.map(async (habit) => {
          const completion = await getHabitCompletion(habit.id, today);
          return {
            ...habit,
            completed: completion
              ? (completion as any).completed === 1
              : false,
          };
        })
      );

      setHabits(habitsWithCompletion);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log("Loading home screen data from SQLite...");
      setLoading(true);

      await Promise.all([
        loadPremiumStatus(),
        loadAffirmations(),
        loadHabits(),
      ]);
    } catch (error) {
      console.error("Error loading home screen data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loadPremiumStatus, loadAffirmations, loadHabits]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleHabit = async (habitId: string) => {
    try {
      console.log(`User toggled habit: ${habitId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const today = new Date().toISOString().split("T")[0];
      const habit = habits.find((h) => h.id === habitId);

      if (!habit) return;

      const newCompleted = !habit.completed;

      // Update local state immediately
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, completed: newCompleted } : h
        )
      );

      // Save to database
      await setHabitCompletion(habitId, today, newCompleted);

      console.log(
        `Habit ${habitId} marked as ${newCompleted ? "completed" : "incomplete"}`
      );
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const toggleFavoriteHabit = async (habitId: string) => {
    try {
      console.log(`User toggled favorite for habit: ${habitId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newFavorite = habit.isFavorite === 1 ? 0 : 1;

      // Update local state
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, isFavorite: newFavorite } : h
        )
      );

      // Save to database
      await updateHabit(habitId, { isFavorite: newFavorite === 1 });

      console.log(`Habit ${habitId} favorite status: ${newFavorite === 1}`);
    } catch (error) {
      console.error("Error toggling favorite habit:", error);
    }
  };

  const toggleFavoriteAffirmation = async (affirmationId: string) => {
    try {
      console.log(`User toggled favorite for affirmation: ${affirmationId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const affirmation = affirmations.find((a) => a.id === affirmationId);
      if (!affirmation) return;

      const newFavorite = affirmation.isFavorite === 1 ? 0 : 1;

      // Update local state
      setAffirmations((prev) =>
        prev.map((a) =>
          a.id === affirmationId ? { ...a, isFavorite: newFavorite } : a
        )
      );

      // Save to database
      await updateAffirmation(affirmationId, {
        isFavorite: newFavorite === 1,
      });

      console.log(
        `Affirmation ${affirmationId} favorite status: ${newFavorite === 1}`
      );
    } catch (error) {
      console.error("Error toggling favorite affirmation:", error);
    }
  };

  const generateNewAffirmation = async (affirmationId: string) => {
    try {
      console.log(`User requested new affirmation for: ${affirmationId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newText = getRandomAffirmation();

      // Update local state
      setAffirmations((prev) =>
        prev.map((a) => (a.id === affirmationId ? { ...a, text: newText } : a))
      );

      // Save to database
      await updateAffirmation(affirmationId, { text: newText });

      console.log("New affirmation generated");
    } catch (error) {
      console.error("Error generating new affirmation:", error);
      Alert.alert(
        "Error",
        "Failed to generate new affirmation. Please try again."
      );
    }
  };

  const removeAffirmation = async (affirmationId: string) => {
    try {
      console.log(`User removed affirmation: ${affirmationId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update local state
      setAffirmations((prev) => prev.filter((a) => a.id !== affirmationId));

      // Delete from database
      await deleteAffirmation(affirmationId);

      console.log("Affirmation removed");
    } catch (error) {
      console.error("Error removing affirmation:", error);
      Alert.alert("Error", "Failed to remove affirmation. Please try again.");
    }
  };

  const removeHabit = async (habitId: string) => {
    try {
      console.log(`User removed habit: ${habitId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update local state
      setHabits((prev) => prev.filter((h) => h.id !== habitId));

      // Delete from database (soft delete)
      await deleteHabit(habitId);

      console.log("Habit removed");
    } catch (error) {
      console.error("Error removing habit:", error);
      Alert.alert("Error", "Failed to remove habit. Please try again.");
    }
  };

  const openHabitsTab = () => {
    console.log("User tapped edit button - navigating to Habits tab");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/habits");
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

  const maxAffirmations = isPremium ? 10 : MAX_AFFIRMATIONS;
  const completedHabits = habits.filter((h) => h.completed).length;
  const totalHabits = habits.length;

  return (
    <LinearGradient
      colors={["#4F46E5", "#87CEEB"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Affirmations Section */}
        <View style={styles.affirmationsSection}>
          {affirmations.slice(0, 2).map((affirmation) => (
            <View key={affirmation.id} style={styles.affirmationCard}>
              <View style={styles.affirmationHeader}>
                <TouchableOpacity
                  onPress={() => toggleFavoriteAffirmation(affirmation.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name={
                      affirmation.isFavorite === 1 ? "star.fill" : "star"
                    }
                    android_material_icon_name={
                      affirmation.isFavorite === 1 ? "star" : "star-border"
                    }
                    size={24}
                    color={affirmation.isFavorite === 1 ? "#FFD700" : "#9CA3AF"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeAffirmation(affirmation.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.affirmationText}>{affirmation.text}</Text>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => generateNewAffirmation(affirmation.id)}
              >
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Free limit text */}
          {!isPremium && (
            <Text style={styles.limitText}>
              Free: {MAX_AFFIRMATIONS} affirmations. Unlock unlimited in
              Profile.
            </Text>
          )}
        </View>

        {/* Daily Habits Section */}
        <View style={styles.habitsCard}>
          <View style={styles.habitsHeader}>
            <Text style={styles.habitsTitle}>Daily Habits</Text>
            <View style={styles.habitCounter}>
              <Text style={styles.habitCounterText}>
                {completedHabits}/{totalHabits}
              </Text>
            </View>
          </View>

          <View style={styles.habitsList}>
            {habits.map((habit) => (
              <View key={habit.id} style={styles.habitItem}>
                <TouchableOpacity
                  style={[
                    styles.habitCheckbox,
                    habit.completed && styles.habitCheckboxCompleted,
                  ]}
                  onPress={() => toggleHabit(habit.id)}
                >
                  {habit.completed && (
                    <IconSymbol
                      ios_icon_name="checkmark"
                      android_material_icon_name="check"
                      size={20}
                      color="white"
                    />
                  )}
                </TouchableOpacity>

                <Text
                  style={[
                    styles.habitTitle,
                    habit.completed && styles.habitTitleCompleted,
                  ]}
                >
                  {habit.title}
                </Text>

                <TouchableOpacity
                  onPress={() => toggleFavoriteHabit(habit.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name={
                      habit.isFavorite === 1 ? "star.fill" : "star"
                    }
                    android_material_icon_name={
                      habit.isFavorite === 1 ? "star" : "star-border"
                    }
                    size={20}
                    color={habit.isFavorite === 1 ? "#FFD700" : "#9CA3AF"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeHabit(habit.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={20}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Edit Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={openHabitsTab}>
        <IconSymbol
          ios_icon_name="pencil"
          android_material_icon_name="edit"
          size={28}
          color="white"
        />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: Platform.OS === "android" ? 48 : 60,
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
  affirmationsSection: {
    marginBottom: 24,
  },
  affirmationCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  affirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    padding: 4,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 28,
    marginBottom: 20,
    textAlign: "left",
  },
  generateButton: {
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: "center",
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  limitText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 8,
  },
  habitsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  habitsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  habitsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  habitCounter: {
    backgroundColor: "#E0E7FF",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  habitCounterText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
  },
  habitsList: {
    gap: 16,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  habitCheckbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  habitCheckboxCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  habitTitleCompleted: {
    color: "#6B7280",
  },
  floatingButton: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
