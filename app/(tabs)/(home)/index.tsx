
import { IconSymbol } from "@/components/IconSymbol";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useEffect } from "react";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";

interface Affirmation {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite?: boolean;
}

interface Habit {
  id: string;
  title: string;
  completed: boolean;
  color: string;
}

export default function HomeScreen() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalContent, setJournalContent] = useState("");
  const [journalPhoto, setJournalPhoto] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load affirmations
      if (await isBackendConfigured()) {
        try {
          // TODO: Backend Integration - Fetch affirmations from the backend API
          const affirmationsData = await authenticatedApiCall("/api/affirmations");
          setAffirmations(affirmationsData.affirmations || []);
          if (affirmationsData.affirmations?.length > 0) {
            setCurrentAffirmation(affirmationsData.affirmations[0]);
          }
        } catch (error) {
          console.error("Error loading affirmations:", error);
        }
      }

      // Load habits
      if (await isBackendConfigured()) {
        try {
          // TODO: Backend Integration - Fetch habits from the backend API
          const habitsData = await authenticatedApiCall("/api/habits");
          setHabits(habitsData.habits || []);
        } catch (error) {
          console.error("Error loading habits:", error);
          // Load demo habits on error
          setHabits([
            { id: "1", title: "Morning meditation", completed: false, color: "#6366f1" },
            { id: "2", title: "Exercise", completed: false, color: "#8b5cf6" },
            { id: "3", title: "Read 10 pages", completed: false, color: "#a855f7" },
          ]);
        }
      } else {
        // Demo habits
        setHabits([
          { id: "1", title: "Morning meditation", completed: false, color: "#6366f1" },
          { id: "2", title: "Exercise", completed: false, color: "#8b5cf6" },
          { id: "3", title: "Read 10 pages", completed: false, color: "#a855f7" },
        ]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, completed: !h.completed } : h
    );
    setHabits(updatedHabits);

    if (await isBackendConfigured()) {
      try {
        const habit = updatedHabits.find((h) => h.id === habitId);
        if (habit?.completed) {
          // TODO: Backend Integration - Mark habit as complete via API
          await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
            method: "POST",
          });
        }
      } catch (error) {
        console.error("Error toggling habit:", error);
      }
    }
  };

  const generateAffirmation = async () => {
    setGenerating(true);
    try {
      if (await isBackendConfigured()) {
        // TODO: Backend Integration - Generate affirmation via AI API
        const response = await authenticatedApiCall("/api/affirmations/generate", {
          method: "POST",
        });
        const newAffirmation = response.affirmation;
        setAffirmations([newAffirmation, ...affirmations]);
        setCurrentAffirmation(newAffirmation);
      } else {
        const demoAffirmations = [
          "I am capable of achieving my goals.",
          "Today is full of possibilities.",
          "I choose peace and positivity.",
          "I am worthy of love and respect.",
          "Every day I grow stronger and wiser.",
        ];
        const randomText = demoAffirmations[Math.floor(Math.random() * demoAffirmations.length)];
        const newAffirmation = {
          id: Date.now().toString(),
          text: randomText,
          isCustom: false,
          isFavorite: false,
        };
        setAffirmations([newAffirmation, ...affirmations]);
        setCurrentAffirmation(newAffirmation);
      }
    } catch (error) {
      console.error("Error generating affirmation:", error);
      Alert.alert("Error", "Failed to generate affirmation");
    } finally {
      setGenerating(false);
    }
  };

  const saveCustomAffirmation = async () => {
    if (!customText.trim()) return;

    try {
      if (await isBackendConfigured()) {
        // TODO: Backend Integration - Save custom affirmation to backend
        const response = await authenticatedApiCall("/api/affirmations/custom", {
          method: "POST",
          body: JSON.stringify({ text: customText }),
        });
        const newAffirmation = response.affirmation;
        setAffirmations([newAffirmation, ...affirmations]);
        setCurrentAffirmation(newAffirmation);
      } else {
        const newAffirmation = {
          id: Date.now().toString(),
          text: customText,
          isCustom: true,
          isFavorite: false,
        };
        setAffirmations([newAffirmation, ...affirmations]);
        setCurrentAffirmation(newAffirmation);
      }
      setCustomText("");
      setShowCustomModal(false);
    } catch (error) {
      console.error("Error saving custom affirmation:", error);
      Alert.alert("Error", "Failed to save custom affirmation");
    }
  };

  const toggleFavorite = async (affirmation: Affirmation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const favorites = affirmations.filter((a) => a.isFavorite);
    if (!affirmation.isFavorite && favorites.length >= 5) {
      Alert.alert("Limit Reached", "You can only have 5 favorite affirmations.");
      return;
    }

    try {
      if (await isBackendConfigured()) {
        // TODO: Backend Integration - Toggle favorite status via API
        await authenticatedApiCall(`/api/affirmations/${affirmation.id}/favorite`, {
          method: "POST",
        });
      }
      setAffirmations(
        affirmations.map((a) =>
          a.id === affirmation.id ? { ...a, isFavorite: !a.isFavorite } : a
        )
      );
      if (currentAffirmation?.id === affirmation.id) {
        setCurrentAffirmation({ ...affirmation, isFavorite: !affirmation.isFavorite });
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
      Alert.alert("Error", "Failed to update favorite");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setJournalPhoto(result.assets[0].uri);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim()) {
      Alert.alert("Error", "Please write something in your journal");
      return;
    }

    try {
      if (await isBackendConfigured()) {
        // TODO: Backend Integration - Save journal entry to backend
        await authenticatedApiCall("/api/journal-entries", {
          method: "POST",
          body: JSON.stringify({
            content: journalContent,
            photoUrl: journalPhoto,
          }),
        });
      }
      Alert.alert("Success", "Journal entry saved!");
      setJournalContent("");
      setJournalPhoto(null);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", "Failed to save journal entry");
    }
  };

  const favorites = affirmations.filter((a) => a.isFavorite);

  return (
    <LinearGradient colors={["#6366f1", "#87ceeb"]} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Affirmations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Affirmation Today</Text>
          <View style={styles.affirmationCard}>
            {currentAffirmation ? (
              <Text style={styles.affirmationText}>{currentAffirmation.text}</Text>
            ) : (
              <Text style={styles.placeholderText}>No affirmation selected</Text>
            )}
            <View style={styles.affirmationButtons}>
              <TouchableOpacity
                style={styles.affirmationButton}
                onPress={() => setShowCustomModal(true)}
              >
                <Text style={styles.buttonText}>Add Custom</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.affirmationButton}
                onPress={generateAffirmation}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Generate</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.starButton}
                onPress={() => setShowFavoritesModal(true)}
              >
                <IconSymbol 
                  ios_icon_name="star.fill" 
                  android_material_icon_name="star" 
                  size={24} 
                  color="#fbbf24" 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          <View style={styles.habitsCard}>
            {habits.map((habit, index) => (
              <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.habitItem}
                onPress={() => toggleHabit(habit.id)}
              >
                <View
                  style={[
                    styles.habitCircle,
                    habit.completed && { backgroundColor: "#10b981", borderColor: "#10b981" },
                  ]}
                >
                  {habit.completed && (
                    <IconSymbol 
                      ios_icon_name="checkmark" 
                      android_material_icon_name="check" 
                      size={16} 
                      color="#fff" 
                    />
                  )}
                </View>
                <Text style={[styles.habitText, habit.completed && styles.habitTextCompleted]}>
                  {habit.title}
                </Text>
              </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Journal Section */}
        <View style={styles.section}>
          <View style={styles.journalHeader}>
            <Text style={styles.sectionTitle}>Journal Entry</Text>
            <Text style={styles.dateStamp}>{new Date().toLocaleDateString()}</Text>
          </View>
          <View style={styles.journalCard}>
            <TextInput
              style={styles.journalInput}
              placeholder="Write your thoughts..."
              placeholderTextColor="#9ca3af"
              multiline
              value={journalContent}
              onChangeText={setJournalContent}
            />
            {journalPhoto && (
              <Image source={{ uri: journalPhoto }} style={styles.journalPhoto} />
            )}
            <View style={styles.journalButtons}>
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <IconSymbol 
                  ios_icon_name="camera.fill" 
                  android_material_icon_name="camera" 
                  size={24} 
                  color="#6366f1" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveJournalEntry}>
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Custom Affirmation Modal */}
      <Modal visible={showCustomModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Affirmation</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your affirmation..."
              placeholderTextColor="#9ca3af"
              multiline
              value={customText}
              onChangeText={setCustomText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={saveCustomAffirmation}>
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal visible={showFavoritesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorite Affirmations ({favorites.length}/5)</Text>
            <ScrollView style={styles.favoritesList}>
              {favorites.map((affirmation, index) => (
                <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.favoriteItem}
                  onPress={() => {
                    setCurrentAffirmation(affirmation);
                    setShowFavoritesModal(false);
                  }}
                >
                  <Text style={styles.favoriteText}>{affirmation.text}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(affirmation)}>
                    <IconSymbol 
                      ios_icon_name="star.fill" 
                      android_material_icon_name="star" 
                      size={20} 
                      color="#fbbf24" 
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
                </React.Fragment>
              ))}
              {favorites.length === 0 && (
                <Text style={styles.emptyText}>No favorites yet</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowFavoritesModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  affirmationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  affirmationText: {
    fontSize: 18,
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 26,
  },
  placeholderText: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 16,
  },
  affirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  affirmationButton: {
    flex: 1,
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  starButton: {
    padding: 8,
  },
  habitsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  habitCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  habitText: {
    fontSize: 16,
    color: "#1f2937",
  },
  habitTextCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateStamp: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  journalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  journalInput: {
    fontSize: 16,
    color: "#1f2937",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  journalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  journalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginHorizontal: 4,
    alignItems: "center",
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    marginHorizontal: 4,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  favoritesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  favoriteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  favoriteText: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
    marginRight: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
});
