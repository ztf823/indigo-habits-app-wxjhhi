
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation } from "@/utils/affirmations";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
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
  createJournalEntry,
  getAllJournalEntries,
  updateJournalEntry,
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
const MAX_HABITS = 5;

export default function HomeScreen() {
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Journal state
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [journalContent, setJournalContent] = useState("");
  const [journalPhoto, setJournalPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

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
      
      // Filter for repeating affirmations
      const repeatingAffirmations = dbAffirmations.filter(a => a.isRepeating === 1);
      
      // If we have less than 5 repeating affirmations, fill with random ones
      if (repeatingAffirmations.length < MAX_AFFIRMATIONS) {
        const needed = MAX_AFFIRMATIONS - repeatingAffirmations.length;
        console.log(`Creating ${needed} default affirmations...`);
        
        for (let i = 0; i < needed; i++) {
          const affirmation = getRandomAffirmation();
          const newAffirmation = {
            id: `affirmation_${Date.now()}_${i}`,
            text: affirmation,
            isCustom: false,
            isRepeating: false,
            orderIndex: repeatingAffirmations.length + i,
          };
          await createAffirmation(newAffirmation);
          repeatingAffirmations.push({ ...newAffirmation, isCustom: 0, isRepeating: 0 });
        }
      }
      
      setAffirmations(repeatingAffirmations.slice(0, MAX_AFFIRMATIONS));
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const dbHabits = (await getAllHabits()) as Habit[];
      const today = new Date().toISOString().split("T")[0];

      // Filter for repeating habits
      const repeatingHabits = dbHabits.filter(h => h.isRepeating === 1);

      // Load completion status for today
      const habitsWithCompletion = await Promise.all(
        repeatingHabits.map(async (habit) => {
          const completion = await getHabitCompletion(habit.id, today);
          return {
            ...habit,
            completed: completion ? (completion as any).completed === 1 : false,
          };
        })
      );

      setHabits(habitsWithCompletion.slice(0, MAX_HABITS));
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

      console.log(`Habit ${habitId} marked as ${newCompleted ? "completed" : "incomplete"}`);
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
        prev.map((a) => (a.id === affirmationId ? { ...a, text: newText } : a))
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
    console.log("User tapped journal button");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJournalModalVisible(true);
  };

  const closeJournalModal = async () => {
    console.log("User closed journal modal");
    
    // Save before closing if there's content
    if (journalContent.trim()) {
      await saveJournalEntry();
    }
    
    setJournalModalVisible(false);
    setJournalContent("");
    setJournalPhoto(null);
    setAudioUri(null);
    
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim()) return;
    
    try {
      setIsSaving(true);
      console.log("Saving journal entry...");
      
      const today = new Date().toISOString().split("T")[0];
      const entryId = `journal_${Date.now()}`;
      
      await createJournalEntry({
        id: entryId,
        content: journalContent,
        photoUri: journalPhoto || undefined,
        date: today,
      });
      
      console.log("Journal entry saved");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error saving journal entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleJournalTextChange = (text: string) => {
    setJournalContent(text);
    
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new auto-save timer for 30 seconds
    const timer = setTimeout(() => {
      console.log("Auto-saving journal entry...");
      saveJournalEntry();
    }, 30000);
    
    setAutoSaveTimer(timer);
  };

  const pickImage = async () => {
    try {
      console.log("User tapped camera button");
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setJournalPhoto(result.assets[0].uri);
        console.log("Photo added to journal entry");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const startRecording = async () => {
    try {
      console.log("User started recording audio");
      
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant microphone access.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      console.log("User stopped recording audio");
      
      if (!recording) return;
      
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      
      console.log("Recording saved:", uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
    }
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

  const completedHabits = habits.filter((h) => h.completed).length;
  const totalHabits = habits.length;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
        {/* Header with Date and Journal Button */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{today}</Text>
          <TouchableOpacity onPress={openJournalModal} style={styles.journalButton}>
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Affirmations Section */}
        <View style={styles.affirmationsSection}>
          <Text style={styles.sectionTitle}>Your Affirmations</Text>
          {affirmations.map((affirmation) => (
            <View key={affirmation.id} style={styles.affirmationCard}>
              <View style={styles.affirmationHeader}>
                <TouchableOpacity
                  onPress={() => toggleFavoriteAffirmation(affirmation.id)}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name={affirmation.isFavorite === 1 ? "star.fill" : "star"}
                    android_material_icon_name={affirmation.isFavorite === 1 ? "star" : "star-border"}
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
                    { borderColor: habit.color },
                    habit.completed && { backgroundColor: habit.color },
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
                    ios_icon_name={habit.isFavorite === 1 ? "star.fill" : "star"}
                    android_material_icon_name={habit.isFavorite === 1 ? "star" : "star-border"}
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

        {/* Journal Entry Section */}
        <View style={styles.journalSection}>
          <Text style={styles.sectionTitle}>Today's Journal</Text>
          <TouchableOpacity
            style={styles.journalPreview}
            onPress={openJournalModal}
          >
            <IconSymbol
              ios_icon_name="book.closed"
              android_material_icon_name="menu-book"
              size={32}
              color="#4F46E5"
            />
            <Text style={styles.journalPreviewText}>
              Tap to write in your journal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Journal Modal */}
      <Modal
        visible={journalModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeJournalModal}
      >
        <LinearGradient
          colors={["#4F46E5", "#87CEEB"]}
          style={styles.modalGradient}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeJournalModal}>
              <IconSymbol
                ios_icon_name="chevron.down"
                android_material_icon_name="keyboard-arrow-down"
                size={28}
                color="white"
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Journal Entry</Text>
            <TouchableOpacity onPress={closeJournalModal}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.journalCard}>
              <Text style={styles.journalDate}>{today}</Text>
              
              <TextInput
                style={styles.journalInput}
                placeholder="Write your thoughts..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={journalContent}
                onChangeText={handleJournalTextChange}
                autoFocus
              />

              <View style={styles.journalActions}>
                <TouchableOpacity onPress={pickImage} style={styles.actionButton}>
                  <IconSymbol
                    ios_icon_name="camera"
                    android_material_icon_name="camera-alt"
                    size={24}
                    color="#4F46E5"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  style={[
                    styles.actionButton,
                    isRecording && styles.recordingButton,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={isRecording ? "stop.circle" : "mic"}
                    android_material_icon_name={isRecording ? "stop" : "mic"}
                    size={24}
                    color={isRecording ? "#EF4444" : "#4F46E5"}
                  />
                </TouchableOpacity>
              </View>

              {journalPhoto && (
                <View style={styles.photoPreview}>
                  <Text style={styles.photoPreviewText}>Photo attached</Text>
                </View>
              )}

              {audioUri && (
                <View style={styles.audioPreview}>
                  <IconSymbol
                    ios_icon_name="waveform"
                    android_material_icon_name="graphic-eq"
                    size={20}
                    color="#4F46E5"
                  />
                  <Text style={styles.audioPreviewText}>Audio memo attached</Text>
                </View>
              )}

              {isSaving && (
                <View style={styles.savingIndicator}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  journalButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
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
  habitsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
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
  journalSection: {
    marginBottom: 24,
  },
  journalPreview: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  journalPreviewText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  doneButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  journalCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
  },
  journalDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 16,
  },
  journalInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
    textAlignVertical: "top",
  },
  journalActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingButton: {
    backgroundColor: "#FEE2E2",
  },
  photoPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  photoPreviewText: {
    fontSize: 14,
    color: "#6B7280",
  },
  audioPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  audioPreviewText: {
    fontSize: 14,
    color: "#6B7280",
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  savingText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
