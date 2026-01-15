
import React, { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation, getMultipleRandomAffirmations } from "@/utils/affirmations";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  PanResponder,
} from "react-native";

interface Affirmation {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite?: boolean;
  isRepeating?: boolean;
}

interface Habit {
  id: string;
  title: string;
  completed: boolean;
  color: string;
  isRepeating?: boolean;
}

const MAX_AFFIRMATIONS = 5;
const MAX_HABITS = 5;
const AUTO_SAVE_DELAY = 30000; // 30 seconds

const STORAGE_KEYS = {
  AFFIRMATIONS: "indigo_habits_affirmations",
  HABITS: "indigo_habits_habits",
  JOURNAL_ENTRIES: "indigo_habits_journal_entries",
  HAS_PREMIUM: "indigo_habits_has_premium",
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  
  // Journal modal state
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [journalContent, setJournalContent] = useState("");
  const [journalPhotoUri, setJournalPhotoUri] = useState<string | null>(null);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef("");

  // Pan responder for swipe-down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped down more than 100 pixels, close the modal
        if (gestureState.dy > 100) {
          console.log("[Home] User swiped down to dismiss journal modal");
          closeJournalModal();
        }
      },
    })
  ).current;

  useEffect(() => {
    console.log("[Home] Loading home screen data from local storage");
    loadData();
  }, []);

  // Auto-save journal entries every 30 seconds
  useEffect(() => {
    if (!journalModalVisible) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't auto-save if content is empty or hasn't changed
    if (!journalContent.trim() || journalContent === lastSavedContentRef.current) {
      return;
    }

    // Set new timer for auto-save (30 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      console.log("[Home] Auto-saving journal entry after 30 seconds");
      autoSaveJournalEntry();
    }, AUTO_SAVE_DELAY);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [journalContent, journalPhotoUri, journalModalVisible]);

  const autoSaveJournalEntry = async () => {
    if (!journalContent.trim() || journalContent === lastSavedContentRef.current) {
      return;
    }

    setIsSavingJournal(true);

    try {
      console.log("[Home] Auto-saving journal entry to local storage");
      const existingEntriesJson = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
      
      const newEntry = {
        id: `journal-${Date.now()}`,
        content: journalContent,
        photoUrl: journalPhotoUri || undefined,
        createdAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNAL_ENTRIES,
        JSON.stringify([newEntry, ...existingEntries])
      );

      lastSavedContentRef.current = journalContent;
      console.log("[Home] Journal entry auto-saved locally");
    } catch (error: any) {
      console.error("[Home] Error auto-saving journal:", error);
    }

    setIsSavingJournal(false);
  };

  const loadData = async () => {
    await loadPremiumStatus();
    await loadAffirmations();
    await loadHabits();
  };

  const loadPremiumStatus = async () => {
    try {
      const premiumStatus = await AsyncStorage.getItem(STORAGE_KEYS.HAS_PREMIUM);
      setHasPremium(premiumStatus === "true");
      console.log("[Home] Premium status:", premiumStatus === "true");
    } catch (error) {
      console.error("[Home] Error loading premium status:", error);
    }
  };

  const loadAffirmations = async () => {
    try {
      const storedAffirmations = await AsyncStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
      if (storedAffirmations) {
        const parsed = JSON.parse(storedAffirmations);
        // Filter to only show repeating affirmations on home, limit to 5
        const repeating = parsed.filter((a: Affirmation) => a.isRepeating).slice(0, MAX_AFFIRMATIONS);
        setAffirmations(repeating);
        console.log("[Home] Loaded affirmations from local storage:", repeating.length);
      } else {
        // Initialize with random affirmations
        const randomAffirmations = getMultipleRandomAffirmations(MAX_AFFIRMATIONS);
        const initialAffirmations = randomAffirmations.map((text, index) => ({
          id: `demo-${index}`,
          text,
          isCustom: false,
          isFavorite: false,
          isRepeating: true,
        }));
        setAffirmations(initialAffirmations);
        await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(initialAffirmations));
        console.log("[Home] Initialized affirmations with random data");
      }
    } catch (error) {
      console.error("[Home] Error loading affirmations:", error);
      const randomAffirmations = getMultipleRandomAffirmations(MAX_AFFIRMATIONS);
      setAffirmations(
        randomAffirmations.map((text, index) => ({
          id: `demo-${index}`,
          text,
          isCustom: false,
          isFavorite: false,
          isRepeating: true,
        }))
      );
    }
  };

  const loadHabits = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
      if (storedHabits) {
        const parsed = JSON.parse(storedHabits);
        // Filter to only show repeating habits on home, limit to 5
        const repeating = parsed.filter((h: Habit) => h.isRepeating).slice(0, MAX_HABITS);
        setHabits(repeating);
        console.log("[Home] Loaded habits from local storage:", repeating.length);
      } else {
        // Initialize with default habits
        const defaultHabits = [
          { id: "1", title: "Morning meditation", completed: false, color: "#4CAF50", isRepeating: true },
          { id: "2", title: "Exercise", completed: false, color: "#2196F3", isRepeating: true },
          { id: "3", title: "Read 10 pages", completed: false, color: "#FF9800", isRepeating: true },
          { id: "4", title: "Drink water", completed: false, color: "#00BCD4", isRepeating: true },
        ];
        setHabits(defaultHabits);
        await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(defaultHabits));
        console.log("[Home] Initialized habits with default data");
      }
    } catch (error) {
      console.error("[Home] Error loading habits:", error);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const newCompleted = !habit.completed;
    const updatedHabits = habits.map((h) => (h.id === habitId ? { ...h, completed: newCompleted } : h));
    setHabits(updatedHabits);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Update in full storage
      const storedHabits = await AsyncStorage.getItem(STORAGE_KEYS.HABITS);
      if (storedHabits) {
        const allHabits = JSON.parse(storedHabits);
        const updated = allHabits.map((h: Habit) => (h.id === habitId ? { ...h, completed: newCompleted } : h));
        await AsyncStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(updated));
        console.log("[Home] Habit toggled and saved:", habitId, newCompleted);
      }
    } catch (error) {
      console.error("[Home] Error saving habit:", error);
    }
  };

  const toggleFavoriteAffirmation = async (affirmationId: string) => {
    console.log("[Home] User tapped favorite button for affirmation:", affirmationId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const affirmation = affirmations.find((a) => a.id === affirmationId);
    if (!affirmation) return;

    const newFavorite = !affirmation.isFavorite;
    const updatedAffirmations = affirmations.map((a) =>
      a.id === affirmationId ? { ...a, isFavorite: newFavorite } : a
    );
    setAffirmations(updatedAffirmations);

    try {
      // Update in full storage
      const storedAffirmations = await AsyncStorage.getItem(STORAGE_KEYS.AFFIRMATIONS);
      if (storedAffirmations) {
        const allAffirmations = JSON.parse(storedAffirmations);
        const updated = allAffirmations.map((a: Affirmation) =>
          a.id === affirmationId ? { ...a, isFavorite: newFavorite } : a
        );
        await AsyncStorage.setItem(STORAGE_KEYS.AFFIRMATIONS, JSON.stringify(updated));
        console.log("[Home] Affirmation favorite status saved");
      }
    } catch (error) {
      console.error("[Home] Error saving favorite status:", error);
    }
  };

  const openJournalModal = () => {
    console.log("[Home] User tapped floating pencil icon - opening journal modal");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJournalModalVisible(true);
  };

  const closeJournalModal = async () => {
    console.log("[Home] User closed journal modal");
    
    // Save one final time before closing
    if (journalContent.trim() && journalContent !== lastSavedContentRef.current) {
      await saveJournalEntry();
    }
    
    setJournalModalVisible(false);
    
    // Clear the journal content after closing
    setTimeout(() => {
      setJournalContent("");
      setJournalPhotoUri(null);
      lastSavedContentRef.current = "";
    }, 300);
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim()) {
      console.log("[Home] No content to save");
      return;
    }

    console.log("[Home] Saving journal entry to local storage");
    setIsSavingJournal(true);

    try {
      const existingEntriesJson = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      const existingEntries = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
      
      const newEntry = {
        id: `journal-${Date.now()}`,
        content: journalContent,
        photoUrl: journalPhotoUri || undefined,
        createdAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNAL_ENTRIES,
        JSON.stringify([newEntry, ...existingEntries])
      );

      lastSavedContentRef.current = journalContent;
      console.log("[Home] Journal entry saved locally:", newEntry.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("[Home] Error saving journal:", error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    }

    setIsSavingJournal(false);
  };

  const pickJournalImage = async () => {
    console.log("[Home] User tapped camera icon in journal");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setJournalPhotoUri(localUri);
      console.log("[Home] Photo selected:", localUri);
    }
  };

  const startVoiceToText = async () => {
    console.log("[Home] User tapped voice-to-text button");
    Alert.alert(
      "Voice to Text",
      "Voice-to-text feature coming soon! For now, please type your journal entry.",
      [{ text: "OK" }]
    );
  };

  return (
    <>
      <LinearGradient colors={["#4B0082", "#87CEEB"]} style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Affirmations Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Affirmations Today</Text>
              <Text style={styles.countBadge}>{affirmations.length}/{MAX_AFFIRMATIONS}</Text>
            </View>

            {affirmations.length === 0 ? (
              <View style={styles.emptyAffirmations}>
                <Text style={styles.emptyText}>No daily affirmations set</Text>
                <Text style={styles.emptySubtext}>Go to Habits tab to add affirmations</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.affirmationsScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {affirmations.map((affirmation, index) => (
                  <View key={`affirmation-${affirmation.id}-${index}`} style={styles.affirmationItem}>
                    <View style={styles.affirmationContent}>
                      <Text style={styles.affirmationText}>{affirmation.text}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleFavoriteAffirmation(affirmation.id)}
                    >
                      <IconSymbol
                        ios_icon_name={
                          affirmation.isFavorite
                            ? "star.fill"
                            : "star"
                        }
                        android_material_icon_name={
                          affirmation.isFavorite
                            ? "star"
                            : "star-border"
                        }
                        size={20}
                        color={
                          affirmation.isFavorite
                            ? "#FFD700"
                            : "#999"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {!hasPremium && affirmations.length >= MAX_AFFIRMATIONS && (
              <Text style={styles.limitText}>
                Free: {MAX_AFFIRMATIONS} affirmations. Unlock unlimited in Profile.
              </Text>
            )}
          </View>

          {/* Habits Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Habits</Text>
              <Text style={styles.countBadge}>{habits.length}/{MAX_HABITS}</Text>
            </View>

            {habits.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No daily habits set</Text>
                <Text style={styles.emptySubtext}>Go to Habits tab to add habits</Text>
              </View>
            ) : (
              <React.Fragment>
                {habits.map((habit, index) => (
                  <View key={`habit-${habit.id}-${index}`} style={styles.habitItem}>
                    <TouchableOpacity
                      style={styles.habitCheckbox}
                      onPress={() => toggleHabit(habit.id)}
                    >
                      <View
                        style={[
                          styles.habitCircle,
                          habit.completed && { backgroundColor: habit.color },
                        ]}
                      >
                        {habit.completed && (
                          <IconSymbol
                            ios_icon_name="checkmark"
                            android_material_icon_name="check"
                            size={20}
                            color="#FFF"
                          />
                        )}
                      </View>
                      <Text style={styles.habitTitle}>{habit.title}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </React.Fragment>
            )}

            {!hasPremium && habits.length >= MAX_HABITS && (
              <Text style={styles.limitText}>
                Free: {MAX_HABITS} habits. Unlock unlimited in Profile.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Floating Pencil Icon */}
        <TouchableOpacity
          style={styles.floatingPencil}
          onPress={openJournalModal}
          activeOpacity={0.8}
        >
          <IconSymbol
            ios_icon_name="pencil"
            android_material_icon_name="edit"
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Journal Modal */}
      <Modal
        visible={journalModalVisible}
        animationType="slide"
        onRequestClose={closeJournalModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.journalModalContainer}
        >
          <View style={styles.journalModalContent} {...panResponder.panHandlers}>
            {/* Swipe indicator */}
            <View style={styles.swipeIndicatorContainer}>
              <View style={styles.swipeIndicator} />
            </View>

            {/* Journal Text Area */}
            <TextInput
              style={styles.journalTextArea}
              placeholder="Start writing..."
              placeholderTextColor="#999"
              multiline
              value={journalContent}
              onChangeText={setJournalContent}
              autoFocus
              textAlignVertical="top"
            />

            {/* Photo Preview */}
            {journalPhotoUri && (
              <View style={styles.journalPhotoContainer}>
                <Image source={{ uri: journalPhotoUri }} style={styles.journalPhoto} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setJournalPhotoUri(null)}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={28}
                    color="#FFF"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Controls */}
            <View style={styles.journalControls}>
              {/* Camera Button */}
              <TouchableOpacity
                style={styles.journalControlButton}
                onPress={pickJournalImage}
              >
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera-alt"
                  size={28}
                  color="#4B0082"
                />
              </TouchableOpacity>

              {/* Voice-to-Text Button */}
              <TouchableOpacity
                style={styles.journalControlButton}
                onPress={startVoiceToText}
              >
                <IconSymbol
                  ios_icon_name="mic.fill"
                  android_material_icon_name="mic"
                  size={28}
                  color="#4B0082"
                />
              </TouchableOpacity>

              {/* Auto-save indicator */}
              {isSavingJournal && (
                <View style={styles.savingIndicatorModal}>
                  <ActivityIndicator size="small" color="#4B0082" />
                  <Text style={styles.savingTextModal}>Saving...</Text>
                </View>
              )}

              {/* Done Button */}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={closeJournalModal}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  countBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B0082",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyAffirmations: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  affirmationsScroll: {
    maxHeight: 300,
    marginBottom: 12,
  },
  affirmationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  affirmationContent: {
    flex: 1,
    marginRight: 12,
  },
  affirmationText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  habitCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#DDD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  habitTitle: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  limitText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  floatingPencil: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4B0082",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
      },
    }),
  },
  journalModalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  journalModalContent: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 48 : 60,
  },
  swipeIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    borderRadius: 2,
  },
  journalTextArea: {
    flex: 1,
    fontSize: 18,
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 20,
    textAlignVertical: "top",
    lineHeight: 28,
  },
  journalPhotoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: "relative",
  },
  journalPhoto: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: "absolute",
    top: 24,
    right: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
  },
  journalControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 16,
  },
  journalControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  savingIndicatorModal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  savingTextModal: {
    fontSize: 14,
    color: "#4B0082",
    fontStyle: "italic",
  },
  doneButton: {
    backgroundColor: "#4B0082",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  doneButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
