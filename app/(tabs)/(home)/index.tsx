
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
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
  getProfile,
  createJournalEntry,
  getAllJournalEntries,
  updateJournalEntry,
} from "@/utils/database";
import { playChime } from "@/utils/sounds";

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

interface JournalEntry {
  id: string;
  content: string;
  photoUri?: string;
  audioUri?: string;
  date: string;
  isFavorite?: number;
}

// Free users: 5 affirmations and 5 habits
// Pro users: unlimited
const FREE_MAX_AFFIRMATIONS = 5;
const FREE_MAX_HABITS = 5;

export default function HomeScreen() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Journal state
  const [journalContent, setJournalContent] = useState("");
  const [journalPhoto, setJournalPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const [journalIsFavorite, setJournalIsFavorite] = useState(false);

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

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

  const loadAffirmations = useCallback(async () => {
    try {
      const dbAffirmations = (await getAllAffirmations()) as Affirmation[];
      
      // Filter for repeating affirmations
      let repeatingAffirmations = dbAffirmations.filter(a => a.isRepeating === 1);
      
      // Determine max affirmations based on premium status
      const maxAffirmations = isPremium ? repeatingAffirmations.length : FREE_MAX_AFFIRMATIONS;
      
      // If we have less than the limit, fill with random ones
      if (repeatingAffirmations.length < maxAffirmations) {
        const needed = maxAffirmations - repeatingAffirmations.length;
        console.log(`Creating ${needed} default affirmations...`);
        
        for (let i = 0; i < needed; i++) {
          const affirmation = getRandomAffirmation();
          const newAffirmation = {
            id: `affirmation_${Date.now()}_${i}`,
            text: affirmation,
            isCustom: false,
            isRepeating: false,
            isFavorite: false,
            orderIndex: repeatingAffirmations.length + i,
          };
          await createAffirmation(newAffirmation);
          repeatingAffirmations.push({ ...newAffirmation, isCustom: 0, isRepeating: 0, isFavorite: 0 });
        }
      }
      
      // Apply limit: free users get 5, premium users get all
      const displayAffirmations = isPremium 
        ? repeatingAffirmations 
        : repeatingAffirmations.slice(0, FREE_MAX_AFFIRMATIONS);
      
      setAffirmations(displayAffirmations);
      console.log(`Loaded ${displayAffirmations.length} affirmations (${isPremium ? 'unlimited' : 'free limit'})`);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  }, [isPremium]);

  const loadHabits = useCallback(async () => {
    try {
      const dbHabits = (await getAllHabits()) as Habit[];
      const today = new Date().toISOString().split("T")[0];

      // Filter for repeating habits
      let repeatingHabits = dbHabits.filter(h => h.isRepeating === 1);

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

      // Apply limit: free users get 5, premium users get all
      const displayHabits = isPremium 
        ? habitsWithCompletion 
        : habitsWithCompletion.slice(0, FREE_MAX_HABITS);

      setHabits(displayHabits);
      console.log(`Loaded ${displayHabits.length} habits (${isPremium ? 'unlimited' : 'free limit'})`);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  }, [isPremium]);

  const loadTodayJournal = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const allEntries = await getAllJournalEntries() as JournalEntry[];
      const todayEntry = allEntries.find(e => e.date === today);
      
      if (todayEntry) {
        setJournalContent(todayEntry.content || "");
        setJournalPhoto(todayEntry.photoUri || null);
        setAudioUri(todayEntry.audioUri || null);
        setCurrentJournalId(todayEntry.id);
        setJournalIsFavorite((todayEntry as any).isFavorite === 1);
      } else {
        setJournalContent("");
        setJournalPhoto(null);
        setAudioUri(null);
        setCurrentJournalId(null);
        setJournalIsFavorite(false);
      }
    } catch (error) {
      console.error("Error loading today's journal:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log("Loading home screen data from SQLite...");
      setLoading(true);

      // Load premium status first, then load data based on that
      await loadPremiumStatus();
    } catch (error) {
      console.error("Error loading home screen data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loadPremiumStatus]);

  // Load affirmations and habits after premium status is loaded
  useEffect(() => {
    if (!loading) {
      loadAffirmations();
      loadHabits();
      loadTodayJournal();
    }
  }, [isPremium, loading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save journal every 30 seconds
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

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

      // Play chime sound
      if (newCompleted) {
        playChime();
      }

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

      // Play chime sound
      playChime();

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

      // Play chime sound
      playChime();

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

      // Play chime sound
      playChime();

      console.log("New affirmation generated");
    } catch (error) {
      console.error("Error generating new affirmation:", error);
      Alert.alert("Error", "Failed to generate new affirmation. Please try again.");
    }
  };

  const handleJournalTextChange = (text: string) => {
    setJournalContent(text);
    
    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    // Set new auto-save timer for 30 seconds
    autoSaveTimer.current = setTimeout(() => {
      console.log("Auto-saving journal entry...");
      saveJournalEntry();
    }, 30000);
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim() && !journalPhoto && !audioUri) return;
    
    try {
      setIsSaving(true);
      console.log("Saving journal entry...");
      
      const today = new Date().toISOString().split("T")[0];
      
      if (currentJournalId) {
        // Update existing entry
        await updateJournalEntry(currentJournalId, {
          content: journalContent,
          photoUri: journalPhoto || undefined,
          audioUri: audioUri || undefined,
        });
      } else {
        // Create new entry
        const entryId = `journal_${Date.now()}`;
        await createJournalEntry({
          id: entryId,
          content: journalContent,
          photoUri: journalPhoto || undefined,
          audioUri: audioUri || undefined,
          date: today,
        });
        setCurrentJournalId(entryId);
      }
      
      console.log("Journal entry saved");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Play chime sound
      playChime();
    } catch (error) {
      console.error("Error saving journal entry:", error);
    } finally {
      setIsSaving(false);
    }
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
        
        // Auto-save after adding photo
        setTimeout(() => saveJournalEntry(), 500);
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
      
      // Auto-save after recording
      setTimeout(() => saveJournalEntry(), 500);
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
    }
  };

  const toggleJournalFavorite = async () => {
    if (!currentJournalId) return;
    
    try {
      console.log("User toggled journal favorite");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newFavorite = !journalIsFavorite;
      setJournalIsFavorite(newFavorite);
      
      // Save to database
      await updateJournalEntry(currentJournalId, {
        isFavorite: newFavorite,
      } as any);
      
      // Play chime sound
      playChime();
    } catch (error) {
      console.error("Error toggling journal favorite:", error);
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
        {/* Header with Date */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{today}</Text>
          {!isPremium && (
            <View style={styles.limitBadge}>
              <Text style={styles.limitBadgeText}>Free: {affirmations.length}/{FREE_MAX_AFFIRMATIONS} affirmations, {habits.length}/{FREE_MAX_HABITS} habits</Text>
            </View>
          )}
        </View>

        {/* Affirmations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Affirmations Today</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.affirmationsScroll}
          >
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
                      color={affirmation.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.affirmationText}>{affirmation.text}</Text>

                <View style={styles.affirmationActions}>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={() => generateNewAffirmation(affirmation.id)}
                  >
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Daily Habits Section */}
        <View style={styles.section}>
          <View style={styles.habitsHeader}>
            <Text style={styles.sectionTitle}>Daily Habits</Text>
            <View style={styles.habitCounter}>
              <Text style={styles.habitCounterText}>
                {completedHabits}/{totalHabits}
              </Text>
            </View>
          </View>

          <View style={styles.habitsCard}>
            {habits.map((habit) => (
              <View key={habit.id} style={styles.habitItem}>
                <TouchableOpacity
                  style={[
                    styles.habitCheckbox,
                    { borderColor: habit.color },
                    habit.completed && { backgroundColor: "#10B981" },
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
                    color={habit.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Journal Entry Section */}
        <View style={styles.section}>
          <View style={styles.journalHeader}>
            <Text style={styles.sectionTitle}>Today's Journal</Text>
            <View style={styles.journalHeaderRight}>
              <Text style={styles.journalDate}>{new Date().toLocaleDateString()}</Text>
              <TouchableOpacity
                onPress={toggleJournalFavorite}
                style={styles.iconButton}
              >
                <IconSymbol
                  ios_icon_name={journalIsFavorite ? "star.fill" : "star"}
                  android_material_icon_name={journalIsFavorite ? "star" : "star-border"}
                  size={24}
                  color={journalIsFavorite ? "#FFD700" : "#C0C0C0"}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.journalCard}>
            <TextInput
              style={styles.journalInput}
              placeholder="Write your thoughts..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={journalContent}
              onChangeText={handleJournalTextChange}
              onBlur={saveJournalEntry}
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
              <View style={styles.attachmentPreview}>
                <Image source={{ uri: journalPhoto }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  onPress={() => setJournalPhoto(null)}
                  style={styles.removeButton}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={20}
                    color="#EF4444"
                  />
                </TouchableOpacity>
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
                <TouchableOpacity
                  onPress={() => setAudioUri(null)}
                  style={styles.removeButton}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={20}
                    color="#EF4444"
                  />
                </TouchableOpacity>
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
      </ScrollView>
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
    marginBottom: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  limitBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  limitBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
  },
  affirmationsScroll: {
    paddingRight: 20,
  },
  affirmationCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  affirmationHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
    minHeight: 84,
  },
  affirmationActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  generateButton: {
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  habitsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  habitCounter: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  habitCounterText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
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
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  habitCheckbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    marginRight: 12,
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
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  journalHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  journalDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  journalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  journalInput: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  journalActions: {
    flexDirection: "row",
    gap: 16,
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
  attachmentPreview: {
    marginTop: 12,
    position: "relative",
  },
  photoThumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
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
    flex: 1,
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
