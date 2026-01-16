
import React, { useState, useEffect, useRef, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation } from "@/utils/affirmations";
import * as ImagePicker from "expo-image-picker";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
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
  createJournalEntry,
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
const AUTO_SAVE_DELAY = 1000;

export default function HomeScreen() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  
  // Journal modal state
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [journalContent, setJournalContent] = useState("");
  const [journalPhotoUri, setJournalPhotoUri] = useState<string | null>(null);
  const [savingJournal, setSavingJournal] = useState(false);
  
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

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
      const dbAffirmations = await getAllAffirmations() as Affirmation[];
      
      // If no affirmations, create initial ones
      if (dbAffirmations.length === 0) {
        console.log("No affirmations found, creating initial affirmations...");
        const initialAffirmations = [];
        for (let i = 0; i < MAX_AFFIRMATIONS; i++) {
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
      const dbHabits = await getAllHabits() as Habit[];
      const today = new Date().toISOString().split('T')[0];
      
      // Load completion status for today
      const habitsWithCompletion = await Promise.all(
        dbHabits.map(async (habit) => {
          const completion = await getHabitCompletion(habit.id, today);
          return {
            ...habit,
            completed: completion ? (completion as any).completed === 1 : false,
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

  const autoSaveJournalEntry = useCallback(async () => {
    if (!journalContent && !journalPhotoUri) return;
    
    console.log("Auto-saving journal entry...");
    // Auto-save happens in background, no need to show loading
  }, [journalContent, journalPhotoUri]);

  // Auto-save journal entry
  useEffect(() => {
    if (journalModalVisible && (journalContent || journalPhotoUri)) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setTimeout(() => {
        autoSaveJournalEntry();
      }, AUTO_SAVE_DELAY);
    }
    
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [journalContent, journalPhotoUri, journalModalVisible, autoSaveJournalEntry]);

  const toggleHabit = async (habitId: string) => {
    try {
      console.log(`User toggled habit: ${habitId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const today = new Date().toISOString().split('T')[0];
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
      
      console.log(`Habit ${habitId} marked as ${newCompleted ? 'completed' : 'incomplete'}`);
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
      await updateAffirmation(affirmationId, { isFavorite: newFavorite === 1 });
      
      console.log(`Affirmation ${affirmationId} favorite status: ${newFavorite === 1}`);
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
        prev.map((a) =>
          a.id === affirmationId ? { ...a, text: newText } : a
        )
      );
      
      // Save to database
      await updateAffirmation(affirmationId, { text: newText });
      
      console.log("New affirmation generated");
    } catch (error) {
      console.error("Error generating new affirmation:", error);
      Alert.alert("Error", "Failed to generate new affirmation. Please try again.");
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

  const openJournalModal = () => {
    console.log("User opened journal modal");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJournalModalVisible(true);
  };

  const closeJournalModal = () => {
    console.log("User closed journal modal");
    setJournalModalVisible(false);
    setJournalContent("");
    setJournalPhotoUri(null);
  };

  const saveJournalEntry = async () => {
    if (!journalContent && !journalPhotoUri) {
      Alert.alert("Empty Entry", "Please write something or add a photo.");
      return;
    }

    try {
      console.log("User saved journal entry");
      setSavingJournal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const today = new Date().toISOString().split('T')[0];
      const currentAffirmation = affirmations[0]?.text || "";
      
      await createJournalEntry({
        id: `journal_${Date.now()}`,
        content: journalContent,
        photoUri: journalPhotoUri || undefined,
        affirmationText: currentAffirmation,
        date: today,
      });
      
      Alert.alert("Success", "Journal entry saved!");
      closeJournalModal();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    } finally {
      setSavingJournal(false);
    }
  };

  const pickJournalImage = async () => {
    try {
      console.log("User tapped camera button");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log("Image selected:", result.assets[0].uri);
        setJournalPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const startVoiceToText = () => {
    console.log("Voice to text feature - coming soon");
    Alert.alert("Coming Soon", "Voice to text feature will be available in a future update.");
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#4F46E5", "#06B6D4"]}
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
  const maxHabits = isPremium ? 10 : MAX_HABITS;

  return (
    <LinearGradient
      colors={["#4F46E5", "#06B6D4"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Affirmations Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your affirmation today</Text>
          </View>
          
          {affirmations.slice(0, maxAffirmations).map((affirmation, index) => (
            <View key={affirmation.id} style={styles.affirmationItem}>
              <View style={styles.affirmationContent}>
                <Text style={styles.affirmationText}>{affirmation.text}</Text>
              </View>
              <View style={styles.affirmationActions}>
                <TouchableOpacity
                  onPress={() => toggleFavoriteAffirmation(affirmation.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name={affirmation.isFavorite === 1 ? "star.fill" : "star"}
                    android_material_icon_name={affirmation.isFavorite === 1 ? "star" : "star-border"}
                    size={20}
                    color={affirmation.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => generateNewAffirmation(affirmation.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name="arrow.clockwise"
                    android_material_icon_name="refresh"
                    size={20}
                    color="#C0C0C0"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeAffirmation(affirmation.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={20}
                    color="#C0C0C0"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Journal Entry Box */}
        <TouchableOpacity
          style={styles.journalBox}
          onPress={openJournalModal}
          activeOpacity={0.9}
        >
          <View style={styles.journalHeader}>
            <Text style={styles.journalPlaceholder}>
              How was your day?
            </Text>
            <TouchableOpacity onPress={pickJournalImage} style={styles.cameraButton}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera-alt"
                size={24}
                color="#4F46E5"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Daily Habits */}
        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          <View style={styles.habitsContainer}>
            {habits.slice(0, maxHabits).map((habit) => (
              <View key={habit.id} style={styles.habitItem}>
                <TouchableOpacity
                  style={[
                    styles.habitCircle,
                    {
                      backgroundColor: habit.completed
                        ? habit.color
                        : "transparent",
                      borderColor: habit.color,
                      borderWidth: 2,
                    },
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
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <TouchableOpacity
                  onPress={() => toggleFavoriteHabit(habit.id)}
                  style={styles.habitStar}
                >
                  <IconSymbol
                    ios_icon_name={habit.isFavorite === 1 ? "star.fill" : "star"}
                    android_material_icon_name={habit.isFavorite === 1 ? "star" : "star-border"}
                    size={16}
                    color={habit.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeHabit(habit.id)}
                  style={styles.habitRemove}
                >
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={16}
                    color="#C0C0C0"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Journal Modal */}
      <Modal
        visible={journalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeJournalModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeJournalModal}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Journal Entry</Text>
            <TouchableOpacity onPress={saveJournalEntry} disabled={savingJournal}>
              {savingJournal ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {journalPhotoUri && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: journalPhotoUri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setJournalPhotoUri(null)}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={28}
                    color="rgba(0,0,0,0.5)"
                  />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.journalInput}
              placeholder="Write about your day..."
              placeholderTextColor="#999"
              multiline
              value={journalContent}
              onChangeText={setJournalContent}
              autoFocus
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={pickJournalImage} style={styles.footerButton}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera-alt"
                size={24}
                color="#4F46E5"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={startVoiceToText} style={styles.footerButton}>
              <IconSymbol
                ios_icon_name="mic.fill"
                android_material_icon_name="mic"
                size={24}
                color="#4F46E5"
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  dateHeader: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    opacity: 0.9,
    textAlign: "right",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  affirmationItem: {
    marginBottom: 12,
  },
  affirmationContent: {
    marginBottom: 8,
  },
  affirmationText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    lineHeight: 24,
  },
  affirmationActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  journalBox: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  journalPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  cameraButton: {
    padding: 8,
  },
  habitsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },
  habitsContainer: {
    gap: 12,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  habitCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  habitStar: {
    padding: 8,
  },
  habitRemove: {
    padding: 8,
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
    flex: 1,
    padding: 20,
  },
  photoPreview: {
    marginBottom: 16,
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  photoRemove: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  journalInput: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerButton: {
    padding: 12,
  },
});
