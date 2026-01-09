
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { authenticatedApiCall, BACKEND_URL } from "@/utils/api";
import * as ImagePicker from "expo-image-picker";

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  color: string;
}

interface CustomAffirmation {
  id: string;
  text: string;
  isFavorite: boolean;
}

export default function HomeScreen() {
  const [affirmation, setAffirmation] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalText, setJournalText] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showAffirmationCard, setShowAffirmationCard] = useState(false);
  const [customAffirmationText, setCustomAffirmationText] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [favorites, setFavorites] = useState<CustomAffirmation[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      console.log("[HomeScreen] Loading data from backend...");

      // Load habits from backend
      // TODO: Backend Integration - Fetch habits from /api/habits endpoint
      const habitsResponse = await authenticatedApiCall(`/api/habits`, {
        method: "GET",
      });
      
      console.log("[HomeScreen] Habits response:", habitsResponse);
      
      if (habitsResponse && Array.isArray(habitsResponse)) {
        // Get today's completions
        const today = new Date().toISOString().split('T')[0];
        const completionsResponse = await authenticatedApiCall(`/api/habits/completions?date=${today}`, {
          method: "GET",
        });
        
        const completedIds = new Set(
          completionsResponse?.completions?.map((c: any) => c.habitId) || []
        );

        setHabits(habitsResponse.map((h: any) => ({
          id: h.id,
          name: h.title,
          completed: completedIds.has(h.id),
          color: h.color || "#4F46E5"
        })));
      }

      // Load daily affirmation from backend
      // TODO: Backend Integration - Fetch daily affirmation from /api/affirmations/daily endpoint
      try {
        const affResponse = await authenticatedApiCall(`/api/affirmations/daily`, {
          method: "GET",
        });
        console.log("[HomeScreen] Affirmation response:", affResponse);
        
        if (affResponse?.affirmation) {
          setAffirmation(affResponse.affirmation.text);
        } else {
          setAffirmation("Tap to set your daily affirmation");
        }
      } catch (error) {
        console.log("[HomeScreen] No daily affirmation yet, using default");
        setAffirmation("Tap to set your daily affirmation");
      }

      // Load favorites from backend
      // TODO: Backend Integration - Fetch favorite affirmations from /api/affirmations/favorites endpoint
      try {
        const favResponse = await authenticatedApiCall(`/api/affirmations/favorites`, {
          method: "GET",
        });
        console.log("[HomeScreen] Favorites response:", favResponse);
        
        if (favResponse?.affirmations) {
          setFavorites(favResponse.affirmations.map((a: any) => ({
            id: a.id,
            text: a.text,
            isFavorite: true
          })));
        }
      } catch (error) {
        console.log("[HomeScreen] Error loading favorites:", error);
      }
    } catch (error) {
      console.error("[HomeScreen] Error loading data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompleted = !habit.completed;
    
    // Optimistically update UI
    setHabits(habits.map(h => 
      h.id === habitId ? { ...h, completed: newCompleted } : h
    ));

    try {
      // TODO: Backend Integration - Mark habit as complete/incomplete via /api/habits/:id/complete endpoint
      const today = new Date().toISOString().split('T')[0];
      
      if (newCompleted) {
        await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
          method: "POST",
          body: JSON.stringify({ date: today })
        });
      } else {
        // Remove completion
        await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
          method: "DELETE",
          body: JSON.stringify({ date: today })
        });
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("[HomeScreen] Error toggling habit:", error);
      // Revert on error
      setHabits(habits.map(h => 
        h.id === habitId ? { ...h, completed: !newCompleted } : h
      ));
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const generateAffirmation = async () => {
    try {
      setIsGenerating(true);
      console.log("[HomeScreen] Generating affirmation...");
      
      // TODO: Backend Integration - Generate affirmation via /api/affirmations/generate endpoint
      const response = await authenticatedApiCall(`/api/affirmations/generate`, {
        method: "POST",
        body: JSON.stringify({})
      });

      console.log("[HomeScreen] Generated affirmation:", response);

      if (response?.affirmation) {
        setAffirmation(response.affirmation.text);
        setShowAffirmationCard(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error("No affirmation returned");
      }
    } catch (error) {
      console.error("[HomeScreen] Error generating affirmation:", error);
      Alert.alert("Error", "Failed to generate affirmation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCustomAffirmation = async () => {
    if (!customAffirmationText.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    try {
      console.log("[HomeScreen] Saving custom affirmation...");
      
      // TODO: Backend Integration - Save custom affirmation via /api/affirmations/custom endpoint
      const response = await authenticatedApiCall(`/api/affirmations/custom`, {
        method: "POST",
        body: JSON.stringify({ text: customAffirmationText.trim() })
      });

      console.log("[HomeScreen] Custom affirmation saved:", response);

      if (response?.affirmation) {
        setAffirmation(response.affirmation.text);
        setCustomAffirmationText("");
        setShowCustomInput(false);
        setShowAffirmationCard(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadData(); // Reload to get updated favorites
      }
    } catch (error) {
      console.error("[HomeScreen] Error saving custom affirmation:", error);
      Alert.alert("Error", "Failed to save affirmation. Please try again.");
    }
  };

  const selectFavorite = async (favorite: CustomAffirmation) => {
    setAffirmation(favorite.text);
    setShowFavorites(false);
    setShowAffirmationCard(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeFavorite = async (id: string) => {
    try {
      console.log("[HomeScreen] Removing favorite:", id);
      
      // TODO: Backend Integration - Toggle favorite status via /api/affirmations/:id/favorite endpoint
      await authenticatedApiCall(`/api/affirmations/${id}/favorite`, {
        method: "POST",
        body: JSON.stringify({})
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData(); // Reload favorites
    } catch (error) {
      console.error("[HomeScreen] Error removing favorite:", error);
      Alert.alert("Error", "Failed to remove favorite. Please try again.");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const saveJournalEntry = async (text: string) => {
    if (!text.trim()) return;

    try {
      console.log("[HomeScreen] Saving journal entry...");
      
      // TODO: Backend Integration - Save journal entry via /api/journal-entries endpoint
      await authenticatedApiCall(`/api/journal-entries`, {
        method: "POST",
        body: JSON.stringify({
          content: text,
          photoUrl: photoUri,
          affirmation: affirmation,
          habits: habits.map(h => ({
            id: h.id,
            name: h.name,
            completed: h.completed
          }))
        })
      });

      setJournalText("");
      setPhotoUri(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Journal entry saved!");
    } catch (error) {
      console.error("[HomeScreen] Error saving journal:", error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loadingData) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Affirmation Card */}
        <TouchableOpacity
          style={styles.affirmationCard}
          onPress={() => setShowAffirmationCard(true)}
        >
          <Text style={styles.affirmationLabel}>Your affirmation today</Text>
          <Text style={styles.affirmationText}>{affirmation || "Tap to set your affirmation"}</Text>
        </TouchableOpacity>

        {/* Habits Strip */}
        <View style={styles.habitsContainer}>
          {habits.length === 0 ? (
            <View style={styles.emptyHabits}>
              <Text style={styles.emptyHabitsText}>No habits yet. Add some in the Habits tab!</Text>
            </View>
          ) : (
            habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitItem, habit.completed && styles.habitCompleted]}
                onPress={() => toggleHabit(habit.id)}
              >
                <View style={styles.habitLeft}>
                  <View style={[styles.habitColorDot, { backgroundColor: habit.color }]} />
                  <Text style={styles.habitText}>{habit.name}</Text>
                </View>
                <IconSymbol
                  ios_icon_name={habit.completed ? "checkmark.circle.fill" : "circle"}
                  android_material_icon_name={habit.completed ? "check_circle" : "radio_button_unchecked"}
                  size={28}
                  color={habit.completed ? "#10B981" : "#9CA3AF"}
                />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Journal Entry Box */}
        <View style={styles.journalBox}>
          <View style={styles.journalHeader}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol ios_icon_name="camera.fill" android_material_icon_name="photo_camera" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {photoUri && (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.journalPhoto} />
              <TouchableOpacity 
                style={styles.removePhotoButton}
                onPress={() => setPhotoUri(null)}
              >
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={styles.journalInput}
            placeholder="Write your thoughts..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={journalText}
            onChangeText={setJournalText}
            onBlur={() => saveJournalEntry(journalText)}
          />
        </View>
      </ScrollView>

      {/* Affirmation Modal */}
      <Modal visible={showAffirmationCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Affirmation</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowAffirmationCard(false);
                setShowCustomInput(true);
              }}
            >
              <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={20} color="#FFFFFF" />
              <Text style={styles.modalButtonText}>Add Custom</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.generateButton]}
              onPress={generateAffirmation}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto_awesome" size={20} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>Generate One</Text>
                </>
              )}
            </TouchableOpacity>

            {favorites.length > 0 && (
              <TouchableOpacity
                style={[styles.modalButton, styles.favoritesButton]}
                onPress={() => {
                  setShowAffirmationCard(false);
                  setShowFavorites(true);
                }}
              >
                <IconSymbol ios_icon_name="heart.fill" android_material_icon_name="favorite" size={20} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>View Favorites ({favorites.length})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAffirmationCard(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Affirmation Input Modal */}
      <Modal visible={showCustomInput} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Custom Affirmation</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Enter your affirmation..."
              placeholderTextColor="#9CA3AF"
              value={customAffirmationText}
              onChangeText={setCustomAffirmationText}
              multiline
              autoFocus
            />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={saveCustomAffirmation}
              disabled={!customAffirmationText.trim()}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowCustomInput(false);
                setCustomAffirmationText("");
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
                <Text style={styles.emptyFavoritesText}>No favorites yet. Create custom affirmations to add them!</Text>
              ) : (
                favorites.map((fav) => (
                  <TouchableOpacity 
                    key={fav.id} 
                    style={styles.favoriteItem}
                    onPress={() => selectFavorite(fav)}
                  >
                    <Text style={styles.favoriteText}>{fav.text}</Text>
                    <TouchableOpacity onPress={() => removeFavorite(fav.id)}>
                      <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowFavorites(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  affirmationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  affirmationLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 26,
  },
  habitsContainer: {
    marginBottom: 20,
  },
  emptyHabits: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyHabitsText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  habitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  habitCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  habitText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  journalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    minHeight: 300,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  photoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  journalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
  },
  journalInput: {
    fontSize: 16,
    color: "#1F2937",
    minHeight: 150,
    textAlignVertical: "top",
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateButton: {
    backgroundColor: "#F59E0B",
  },
  favoritesButton: {
    backgroundColor: "#EF4444",
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
  customInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#1F2937",
  },
  favoritesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  emptyFavoritesText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    padding: 20,
  },
  favoriteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  favoriteText: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    marginRight: 12,
  },
});
