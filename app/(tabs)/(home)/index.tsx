
import { IconSymbol } from "@/components/IconSymbol";
import * as ImagePicker from "expo-image-picker";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation, getMultipleRandomAffirmations } from "@/utils/affirmations";
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
} from "react-native";
import React, { useState, useEffect, useRef } from "react";

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
}

const MAX_AFFIRMATIONS = 3;
const MAX_HABITS = 4;
const AUTO_SAVE_DELAY = 2000; // 2 seconds debounce

export default function HomeScreen() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalContent, setJournalContent] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef("");

  useEffect(() => {
    loadData();
  }, []);

  // Auto-save journal entries with debouncing
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't auto-save if content is empty or hasn't changed
    if (!journalContent.trim() || journalContent === lastSavedContentRef.current) {
      return;
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveJournalEntry();
    }, AUTO_SAVE_DELAY);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [journalContent, photoUri]);

  const autoSaveJournalEntry = async () => {
    if (!journalContent.trim() || journalContent === lastSavedContentRef.current) {
      return;
    }

    setIsSavingJournal(true);

    if (isBackendConfigured()) {
      try {
        // Backend Integration: Auto-save journal entry to history
        const response = await authenticatedApiCall("/api/journal-entries", {
          method: "POST",
          body: JSON.stringify({
            content: journalContent,
            photoUrl: photoUri || undefined,
          }),
        });

        lastSavedContentRef.current = journalContent;
        console.log("[Home] Journal entry auto-saved:", response.id);
      } catch (error: any) {
        console.error("Error auto-saving journal:", error);
        // Don't show error to user for auto-save failures
        // They can still see their content locally
      }
    }

    setIsSavingJournal(false);
  };

  const loadData = async () => {
    // Load repeating affirmations and generate/fetch today's affirmations
    await loadAffirmations();
    await loadHabits();
  };

  const loadAffirmations = async () => {
    if (!isBackendConfigured()) {
      // Demo mode: Show random affirmations
      const randomAffirmations = getMultipleRandomAffirmations(MAX_AFFIRMATIONS);
      setAffirmations(
        randomAffirmations.map((text, index) => ({
          id: `demo-${index}`,
          text,
          isCustom: false,
          isFavorite: false,
        }))
      );
      return;
    }

    try {
      // Backend Integration: Load daily affirmations from backend
      // This endpoint returns up to 3 daily affirmations (repeating + generated)
      const response = await authenticatedApiCall("/api/affirmations/daily");
      if (Array.isArray(response)) {
        setAffirmations(response.slice(0, MAX_AFFIRMATIONS));
      }
    } catch (error) {
      console.error("Error loading affirmations:", error);
      // Fallback to random affirmations
      const randomAffirmations = getMultipleRandomAffirmations(MAX_AFFIRMATIONS);
      setAffirmations(
        randomAffirmations.map((text, index) => ({
          id: `demo-${index}`,
          text,
          isCustom: false,
          isFavorite: false,
        }))
      );
    }
  };

  const loadHabits = async () => {
    if (!isBackendConfigured()) {
      // Demo mode
      setHabits([
        { id: "1", title: "Morning meditation", completed: false, color: "#4CAF50" },
        { id: "2", title: "Exercise", completed: false, color: "#2196F3" },
        { id: "3", title: "Read 10 pages", completed: false, color: "#FF9800" },
        { id: "4", title: "Drink water", completed: false, color: "#00BCD4" },
      ]);
      return;
    }

    try {
      // Backend Integration: Load active habits from backend
      const habitsResponse = await authenticatedApiCall("/api/habits");
      if (Array.isArray(habitsResponse)) {
        const today = new Date().toISOString().split("T")[0];
        const completionsResponse = await authenticatedApiCall(
          `/api/habits/completions?startDate=${today}&endDate=${today}`
        );
        
        const completedIds = new Set(
          completionsResponse.completions
            ?.filter((c: any) => c.completed)
            .map((c: any) => c.habitId) || []
        );

        // Limit to MAX_HABITS (4) and only show active habits
        const activeHabits = habitsResponse
          .filter((h: any) => h.isActive)
          .slice(0, MAX_HABITS);

        setHabits(
          activeHabits.map((h: any) => ({
            id: h.id,
            title: h.title,
            completed: completedIds.has(h.id),
            color: h.color,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const newCompleted = !habit.completed;
    setHabits(habits.map((h) => (h.id === habitId ? { ...h, completed: newCompleted } : h)));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isBackendConfigured()) {
      try {
        // Backend Integration: Toggle habit completion for today
        await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
          method: "POST",
          body: JSON.stringify({ 
            completed: newCompleted,
            date: new Date().toISOString().split("T")[0]
          }),
        });
      } catch (error) {
        console.error("Error toggling habit:", error);
        // Revert on error
        setHabits(habits.map((h) => (h.id === habitId ? { ...h, completed: !newCompleted } : h)));
      }
    }
  };

  const generateAffirmation = async () => {
    if (affirmations.length >= MAX_AFFIRMATIONS) {
      Alert.alert(
        "Limit Reached",
        `You can only have ${MAX_AFFIRMATIONS} affirmations per day. Remove one to generate a new one.`
      );
      return;
    }

    setGeneratingAffirmation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isBackendConfigured()) {
      try {
        // Backend Integration: Generate new affirmation using AI
        const response = await authenticatedApiCall("/api/affirmations/generate", {
          method: "POST",
          body: JSON.stringify({}),
        });
        
        const newAffirmation: Affirmation = {
          id: response.id || `generated-${Date.now()}`,
          text: response.text,
          isCustom: response.isCustom || false,
          isFavorite: false,
          isRepeating: false,
        };
        
        setAffirmations([...affirmations, newAffirmation].slice(0, MAX_AFFIRMATIONS));
      } catch (error) {
        console.error("Error generating affirmation:", error);
        Alert.alert("Error", "Failed to generate affirmation. Please try again.");
        // Fallback to random
        const randomText = getRandomAffirmation();
        setAffirmations([
          ...affirmations,
          {
            id: `random-${Date.now()}`,
            text: randomText,
            isCustom: false,
            isFavorite: false,
          },
        ].slice(0, MAX_AFFIRMATIONS));
      }
    } else {
      // Offline mode - use random default
      const randomText = getRandomAffirmation();
      setAffirmations([
        ...affirmations,
        {
          id: `random-${Date.now()}`,
          text: randomText,
          isCustom: false,
          isFavorite: false,
        },
      ].slice(0, MAX_AFFIRMATIONS));
    }

    setGeneratingAffirmation(false);
  };

  const toggleFavoriteAffirmation = async (affirmationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Update local state optimistically
    const affirmation = affirmations.find((a) => a.id === affirmationId);
    if (!affirmation) return;

    const newFavorite = !affirmation.isFavorite;
    setAffirmations(
      affirmations.map((a) =>
        a.id === affirmationId ? { ...a, isFavorite: newFavorite } : a
      )
    );

    if (isBackendConfigured()) {
      try {
        // Backend Integration: Toggle affirmation favorite status
        await authenticatedApiCall(`/api/affirmations/${affirmationId}/favorite`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Error favoriting affirmation:", error);
        // Revert on error
        setAffirmations(
          affirmations.map((a) =>
            a.id === affirmationId ? { ...a, isFavorite: !newFavorite } : a
          )
        );
      }
    }
  };

  const removeAffirmation = (affirmationId: string) => {
    setAffirmations(affirmations.filter((a) => a.id !== affirmationId));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      
      // If backend is configured, upload the image first
      if (isBackendConfigured()) {
        try {
          const formData = new FormData();
          formData.append("file", {
            uri: localUri,
            type: "image/jpeg",
            name: "journal-photo.jpg",
          } as any);

          const response = await authenticatedApiCall("/api/upload/photo", {
            method: "POST",
            body: formData,
          });

          if (response.url) {
            // Use the uploaded URL from backend
            setPhotoUri(response.url);
            console.log("[Home] Photo uploaded:", response.url);
          } else {
            // Fallback to local URI
            setPhotoUri(localUri);
          }
        } catch (error) {
          console.error("Error uploading photo:", error);
          // Fallback to local URI
          setPhotoUri(localUri);
        }
      } else {
        // Demo mode: use local URI
        setPhotoUri(localUri);
      }
    }
  };

  return (
    <LinearGradient colors={["#4B0082", "#87CEEB"]} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Affirmations Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Affirmations Today</Text>
          </View>

          {affirmations.length === 0 ? (
            <View style={styles.emptyAffirmations}>
              <Text style={styles.emptyText}>No affirmations yet</Text>
              <Text style={styles.emptySubtext}>Generate one to get started</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.affirmationsScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {affirmations.map((affirmation, index) => (
                <View key={affirmation.id} style={styles.affirmationItem}>
                  <View style={styles.affirmationContent}>
                    <Text style={styles.affirmationText}>{affirmation.text}</Text>
                    {affirmation.isRepeating && (
                      <View style={styles.repeatingBadge}>
                        <IconSymbol
                          ios_icon_name="repeat"
                          android_material_icon_name="repeat"
                          size={12}
                          color="#4B0082"
                        />
                        <Text style={styles.repeatingBadgeText}>Daily</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.affirmationActions}>
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
                    {!affirmation.isRepeating && (
                      <TouchableOpacity onPress={() => removeAffirmation(affirmation.id)}>
                        <IconSymbol
                          ios_icon_name="xmark.circle"
                          android_material_icon_name="close"
                          size={20}
                          color="#999"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.generateButton,
              affirmations.length >= MAX_AFFIRMATIONS && styles.generateButtonDisabled,
            ]}
            onPress={generateAffirmation}
            disabled={generatingAffirmation || affirmations.length >= MAX_AFFIRMATIONS}
          >
            {generatingAffirmation ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.generateButtonText}>
                  {affirmations.length >= MAX_AFFIRMATIONS
                    ? `Max ${MAX_AFFIRMATIONS} affirmations`
                    : "Generate Affirmation"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Habits Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Habits</Text>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySubtext}>Add habits in the Habits tab</Text>
            </View>
          ) : (
            habits.map((habit) => (
              <View key={habit.id} style={styles.habitItem}>
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
            ))
          )}

          {habits.length >= MAX_HABITS && (
            <Text style={styles.limitText}>
              Showing {MAX_HABITS} habits. Manage more in Habits tab.
            </Text>
          )}
        </View>

        {/* Journal Entry */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Journal Entry</Text>
            {isSavingJournal && (
              <View style={styles.savingIndicator}>
                <ActivityIndicator size="small" color="#4B0082" />
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
          </View>

          <View style={styles.journalHeader}>
            <Text style={styles.dateStamp}>{new Date().toLocaleDateString()}</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera-alt"
                size={24}
                color="#C0C0C0"
              />
            </TouchableOpacity>
          </View>

          {photoUri && <Image source={{ uri: photoUri }} style={styles.journalPhoto} />}

          <TextInput
            style={styles.journalInput}
            placeholder="Write your thoughts... (auto-saves)"
            placeholderTextColor="#999"
            multiline
            value={journalContent}
            onChangeText={setJournalContent}
          />

          <Text style={styles.autoSaveHint}>
            Your journal entries are automatically saved to the History tab
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savingText: {
    fontSize: 12,
    color: "#4B0082",
    fontStyle: "italic",
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
  repeatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  repeatingBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B0082",
  },
  affirmationActions: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  generateButton: {
    backgroundColor: "#4B0082",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: "#999",
  },
  generateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateStamp: {
    fontSize: 14,
    color: "#999",
  },
  journalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  journalInput: {
    minHeight: 120,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    marginBottom: 8,
  },
  autoSaveHint: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
});
