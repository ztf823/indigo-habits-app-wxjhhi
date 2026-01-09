
import { IconSymbol } from "@/components/IconSymbol";
import * as ImagePicker from "expo-image-picker";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation } from "@/utils/affirmations";
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
import React, { useState, useEffect } from "react";

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
  const [currentAffirmation, setCurrentAffirmation] = useState<string>(getRandomAffirmation());
  const [customAffirmation, setCustomAffirmation] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", title: "Morning meditation", completed: false, color: "#4CAF50" },
    { id: "2", title: "Exercise", completed: false, color: "#2196F3" },
    { id: "3", title: "Read 10 pages", completed: false, color: "#FF9800" },
  ]);
  const [journalContent, setJournalContent] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingAffirmation, setGeneratingAffirmation] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!isBackendConfigured()) return;
    
    try {
      // Load favorites
      const favResponse = await authenticatedApiCall("/api/affirmations/favorites");
      if (favResponse.affirmations) {
        setFavorites(favResponse.affirmations);
      }

      // Load habits
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

        setHabits(
          habitsResponse.map((h: any) => ({
            id: h.id,
            title: h.title,
            completed: completedIds.has(h.id),
            color: h.color,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading data:", error);
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
        await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
          method: "POST",
          body: JSON.stringify({ completed: newCompleted }),
        });
      } catch (error) {
        console.error("Error toggling habit:", error);
      }
    }
  };

  const generateAffirmation = async () => {
    setGeneratingAffirmation(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isBackendConfigured()) {
      try {
        const response = await authenticatedApiCall("/api/affirmations/generate", {
          method: "POST",
          body: JSON.stringify({}),
        });
        setCurrentAffirmation(response.text);
      } catch (error) {
        console.error("Error generating affirmation:", error);
        setCurrentAffirmation(getRandomAffirmation());
      }
    } else {
      // Offline mode - use random default
      setCurrentAffirmation(getRandomAffirmation());
    }

    setGeneratingAffirmation(false);
  };

  const saveCustomAffirmation = async () => {
    if (!customAffirmation.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    setCurrentAffirmation(customAffirmation);
    setShowCustomModal(false);
    setCustomAffirmation("");

    if (isBackendConfigured()) {
      try {
        await authenticatedApiCall("/api/affirmations/custom", {
          method: "POST",
          body: JSON.stringify({ text: customAffirmation }),
        });
      } catch (error) {
        console.error("Error saving custom affirmation:", error);
      }
    }
  };

  const toggleFavorite = async (affirmation: Affirmation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isBackendConfigured()) {
      try {
        await authenticatedApiCall(`/api/affirmations/${affirmation.id}/favorite`, {
          method: "POST",
        });
        loadData();
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim()) {
      Alert.alert("Error", "Please write something in your journal");
      return;
    }

    setLoading(true);

    if (isBackendConfigured()) {
      try {
        await authenticatedApiCall("/api/journal-entries", {
          method: "POST",
          body: JSON.stringify({
            content: journalContent,
            photoUrl: photoUri,
          }),
        });

        Alert.alert("Success", "Journal entry saved!");
        setJournalContent("");
        setPhotoUri(null);
      } catch (error) {
        console.error("Error saving journal:", error);
        Alert.alert("Error", "Failed to save journal entry");
      }
    }

    setLoading(false);
  };

  return (
    <LinearGradient colors={["#4B0082", "#87CEEB"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Affirmation Card */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationTitle}>Your Affirmation Today</Text>
          <Text style={styles.affirmationText}>{currentAffirmation}</Text>
          
          <View style={styles.affirmationButtons}>
            <TouchableOpacity
              style={styles.affirmationButton}
              onPress={() => setShowCustomModal(true)}
            >
              <Text style={styles.affirmationButtonText}>Add Custom</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.affirmationButton}
              onPress={generateAffirmation}
              disabled={generatingAffirmation}
            >
              {generatingAffirmation ? (
                <ActivityIndicator color="#4B0082" size="small" />
              ) : (
                <Text style={styles.affirmationButtonText}>Generate</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => setShowFavorites(true)}
            >
              <IconSymbol name="star.fill" size={24} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Habits Section */}
        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          {habits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitItem}
              onPress={() => toggleHabit(habit.id)}
            >
              <View
                style={[
                  styles.habitCircle,
                  habit.completed && { backgroundColor: habit.color },
                ]}
              >
                {habit.completed && <IconSymbol name="checkmark" size={20} color="#FFF" />}
              </View>
              <Text style={styles.habitTitle}>{habit.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Journal Entry */}
        <View style={styles.journalSection}>
          <View style={styles.journalHeader}>
            <Text style={styles.dateStamp}>{new Date().toLocaleDateString()}</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol name="camera.fill" size={24} color="#C0C0C0" />
            </TouchableOpacity>
          </View>

          {photoUri && <Image source={{ uri: photoUri }} style={styles.journalPhoto} />}

          <TextInput
            style={styles.journalInput}
            placeholder="Write your thoughts..."
            placeholderTextColor="#999"
            multiline
            value={journalContent}
            onChangeText={setJournalContent}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveJournalEntry}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
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
              multiline
              value={customAffirmation}
              onChangeText={setCustomAffirmation}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={saveCustomAffirmation}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal visible={showFavorites} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorite Affirmations</Text>
            <ScrollView style={styles.favoritesList}>
              {favorites.length === 0 ? (
                <Text style={styles.emptyText}>No favorites yet</Text>
              ) : (
                favorites.map((fav) => (
                  <TouchableOpacity
                    key={fav.id}
                    style={styles.favoriteItem}
                    onPress={() => {
                      setCurrentAffirmation(fav.text);
                      setShowFavorites(false);
                    }}
                  >
                    <Text style={styles.favoriteText}>{fav.text}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowFavorites(false)}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  affirmationCard: {
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
  affirmationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#333",
    marginBottom: 16,
    lineHeight: 28,
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  affirmationButton: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  affirmationButtonText: {
    color: "#4B0082",
    fontWeight: "600",
  },
  favoriteButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  habitsSection: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
  },
  journalSection: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
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
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F0F0F0",
  },
  saveModalButton: {
    backgroundColor: "#4B0082",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B0082",
  },
  favoritesList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  favoriteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  favoriteText: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    paddingVertical: 40,
  },
});
