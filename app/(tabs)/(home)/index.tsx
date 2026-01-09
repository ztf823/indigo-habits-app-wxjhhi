
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import React, { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
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

interface Habit {
  id: string;
  title: string;
  completed: boolean;
  color: string;
}

interface CustomAffirmation {
  id: string;
  text: string;
  isFavorite: boolean;
}

export default function HomeScreen() {
  const [affirmation, setAffirmation] = useState("Your affirmation today.");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalText, setJournalText] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showAffirmationModal, setShowAffirmationModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [customAffirmationText, setCustomAffirmationText] = useState("");
  const [favorites, setFavorites] = useState<CustomAffirmation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    checkBackendAndLoadData();
  }, []);

  const checkBackendAndLoadData = async () => {
    setIsLoading(true);
    
    // Check if backend is configured
    if (!isBackendConfigured()) {
      console.log("[Home] Backend not configured yet");
      setBackendReady(false);
      setIsLoading(false);
      
      // Load demo data for UI testing
      loadDemoData();
      return;
    }

    setBackendReady(true);
    await loadData();
    setIsLoading(false);
  };

  const loadDemoData = () => {
    // Demo affirmation
    setAffirmation("I am capable of achieving my goals and creating positive change in my life.");
    
    // Demo habits
    setHabits([
      { id: "1", title: "Morning meditation", completed: false, color: "#4F46E5" },
      { id: "2", title: "Exercise", completed: false, color: "#10B981" },
      { id: "3", title: "Read 10 pages", completed: false, color: "#F59E0B" },
    ]);

    // Demo favorites
    setFavorites([
      { id: "1", text: "I am worthy of love and respect.", isFavorite: true },
      { id: "2", text: "Every day is a new opportunity to grow.", isFavorite: true },
    ]);
  };

  const loadData = async () => {
    try {
      console.log("[Home] Loading data from backend...");
      
      // TODO: Backend Integration - Load daily affirmation from /api/affirmations/daily
      const affirmationData = await authenticatedApiCall("/api/affirmations/daily");
      if (affirmationData?.text) {
        setAffirmation(affirmationData.text);
      }

      // TODO: Backend Integration - Load habits from /api/habits
      const habitsData = await authenticatedApiCall("/api/habits");
      if (Array.isArray(habitsData)) {
        const today = new Date().toISOString().split("T")[0];
        
        // TODO: Backend Integration - Load habit completions from /api/habits/completions
        const completionsData = await authenticatedApiCall(
          `/api/habits/completions?startDate=${today}&endDate=${today}`
        );
        
        const completionsMap = new Map(
          completionsData.completions?.map((c: any) => [c.habitId, c.completed]) || []
        );

        setHabits(
          habitsData
            .filter((h) => h.isActive)
            .map((h) => ({
              id: h.id,
              title: h.title,
              completed: completionsMap.get(h.id) || false,
              color: h.color,
            }))
        );
      }

      // TODO: Backend Integration - Load favorite affirmations from /api/affirmations/favorites
      const favoritesData = await authenticatedApiCall("/api/affirmations/favorites");
      if (favoritesData?.affirmations) {
        setFavorites(
          favoritesData.affirmations.map((a: any) => ({
            id: a.id,
            text: a.text,
            isFavorite: true,
          }))
        );
      }
    } catch (error: any) {
      console.error("[Home] Error loading data:", error);
      
      // Show user-friendly error message
      if (error.message?.includes("Backend URL not configured")) {
        console.log("[Home] Backend not ready, using demo data");
        loadDemoData();
      } else {
        Alert.alert(
          "Connection Error",
          "Unable to load your data. Please check your internet connection and try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newCompleted = !habit.completed;
      
      // Optimistic update
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, completed: newCompleted } : h))
      );

      if (!backendReady) {
        console.log("[Home] Demo mode: Habit toggled locally");
        return;
      }

      // TODO: Backend Integration - Update habit completion via /api/habits/{habitId}/complete
      await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
        method: "POST",
        body: JSON.stringify({ completed: newCompleted }),
      });
      
      console.log("[Home] Habit completion saved to backend");
    } catch (error) {
      console.error("[Home] Error toggling habit:", error);
      
      // Revert optimistic update on error
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, completed: !h.completed } : h))
      );
      
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const generateAffirmation = async () => {
    if (!backendReady) {
      Alert.alert(
        "Backend Not Ready",
        "The backend is still being set up. This feature will be available soon!"
      );
      return;
    }

    try {
      setIsGenerating(true);
      
      // TODO: Backend Integration - Generate affirmation via /api/affirmations/generate
      const data = await authenticatedApiCall("/api/affirmations/generate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      
      if (data?.text) {
        setAffirmation(data.text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAffirmationModal(false);
      }
    } catch (error: any) {
      console.error("[Home] Error generating affirmation:", error);
      
      if (error.message?.includes("limit")) {
        Alert.alert("Limit Reached", "Upgrade to Pro for unlimited affirmations!");
      } else {
        Alert.alert("Error", "Failed to generate affirmation. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCustomAffirmation = async () => {
    if (!customAffirmationText.trim()) {
      Alert.alert("Error", "Please enter an affirmation");
      return;
    }

    if (!backendReady) {
      // Demo mode: Just set the affirmation locally
      setAffirmation(customAffirmationText.trim());
      setCustomAffirmationText("");
      setShowAffirmationModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Affirmation set! (Backend not ready - changes won't be saved)");
      return;
    }

    try {
      // TODO: Backend Integration - Save custom affirmation via /api/affirmations/custom
      const data = await authenticatedApiCall("/api/affirmations/custom", {
        method: "POST",
        body: JSON.stringify({ text: customAffirmationText.trim() }),
      });
      
      if (data?.text) {
        setAffirmation(data.text);
        setCustomAffirmationText("");
        setShowAffirmationModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.error("[Home] Error saving custom affirmation:", error);
      
      if (error.message?.includes("limit")) {
        Alert.alert("Limit Reached", "Upgrade to Pro for unlimited custom affirmations!");
      } else {
        Alert.alert("Error", "Failed to save affirmation. Please try again.");
      }
    }
  };

  const selectFavorite = (favorite: CustomAffirmation) => {
    setAffirmation(favorite.text);
    setShowFavoritesModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalText.trim()) {
      Alert.alert("Error", "Please write something in your journal");
      return;
    }

    if (!backendReady) {
      Alert.alert(
        "Backend Not Ready",
        "The backend is still being set up. Your entry cannot be saved yet, but you can still use the app to test the interface!",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsSaving(true);
      
      let photoUrl = null;
      if (photoUri) {
        // TODO: Backend Integration - Upload photo via /api/upload/photo
        const formData = new FormData();
        formData.append("photo", {
          uri: photoUri,
          type: "image/jpeg",
          name: "journal-photo.jpg",
        } as any);

        const uploadResponse = await authenticatedApiCall("/api/upload/photo", {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        photoUrl = uploadResponse.url;
      }

      // TODO: Backend Integration - Save journal entry via /api/journal-entries
      await authenticatedApiCall("/api/journal-entries", {
        method: "POST",
        body: JSON.stringify({
          content: journalText.trim(),
          photoUrl,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Journal entry saved!");
      
      setJournalText("");
      setPhotoUri(null);
    } catch (error) {
      console.error("[Home] Error saving journal entry:", error);
      Alert.alert("Error", "Failed to save journal entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Backend Status Banner */}
        {!backendReady && (
          <View style={styles.demoBanner}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color="#F59E0B"
            />
            <Text style={styles.demoBannerText}>
              Demo Mode - Backend is being set up. Some features are limited.
            </Text>
          </View>
        )}

        {/* Date Header */}
        <Text style={styles.dateText}>{getCurrentDate()}</Text>

        {/* Affirmation Card */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationTitle}>Your affirmation today</Text>
          <Text style={styles.affirmationText}>{affirmation}</Text>
          <View style={styles.affirmationButtons}>
            <TouchableOpacity
              style={styles.affirmationButton}
              onPress={() => setShowAffirmationModal(true)}
            >
              <Text style={styles.affirmationButtonText}>Add custom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.affirmationButton}
              onPress={generateAffirmation}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Text style={styles.affirmationButtonText}>Generate one</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.affirmationButton}
              onPress={() => setShowFavoritesModal(true)}
            >
              <IconSymbol
                ios_icon_name="star.fill"
                android_material_icon_name="star"
                size={20}
                color="#FFD700"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Habits Strip */}
        <View style={styles.habitsStrip}>
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.emptyStateText}>No habits yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Go to the Habits tab to add your first habit!
              </Text>
            </View>
          ) : (
            habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitItem,
                  habit.completed && styles.habitItemCompleted,
                ]}
                onPress={() => toggleHabit(habit.id)}
              >
                <IconSymbol
                  ios_icon_name={habit.completed ? "checkmark.circle.fill" : "circle"}
                  android_material_icon_name={habit.completed ? "check-circle" : "radio-button-unchecked"}
                  size={24}
                  color={habit.completed ? "#10B981" : "#9CA3AF"}
                />
                <Text style={styles.habitText}>{habit.title}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Journal Entry */}
        <View style={styles.journalCard}>
          <View style={styles.journalHeader}>
            <Text style={styles.journalTitle}>Journal Entry</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera"
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          
          {photoUri && (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.journalPhoto} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => setPhotoUri(null)}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={24}
                  color="#EF4444"
                />
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
          />
          
          <TouchableOpacity
            style={[styles.saveButton, (!journalText.trim() || isSaving) && styles.saveButtonDisabled]}
            onPress={saveJournalEntry}
            disabled={!journalText.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Affirmation Modal */}
      <Modal
        visible={showAffirmationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAffirmationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Affirmation</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your affirmation..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={customAffirmationText}
              onChangeText={setCustomAffirmationText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAffirmationModal(false);
                  setCustomAffirmationText("");
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveCustomAffirmation}
              >
                <Text style={[styles.modalButtonText, { color: "#FFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal
        visible={showFavoritesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorite Affirmations</Text>
            <ScrollView style={styles.favoritesList}>
              {favorites.length === 0 ? (
                <View style={styles.emptyFavorites}>
                  <IconSymbol
                    ios_icon_name="star"
                    android_material_icon_name="star-border"
                    size={48}
                    color="#9CA3AF"
                  />
                  <Text style={styles.emptyFavoritesText}>No favorites yet</Text>
                  <Text style={styles.emptyFavoritesSubtext}>
                    Save your favorite affirmations to access them quickly!
                  </Text>
                </View>
              ) : (
                favorites.map((fav) => (
                  <TouchableOpacity
                    key={fav.id}
                    style={styles.favoriteItem}
                    onPress={() => selectFavorite(fav)}
                  >
                    <IconSymbol
                      ios_icon_name="star.fill"
                      android_material_icon_name="star"
                      size={20}
                      color="#FFD700"
                    />
                    <Text style={styles.favoriteText}>{fav.text}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  demoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
  dateText: {
    fontSize: 14,
    color: "#FFF",
    textAlign: "right",
    marginBottom: 20,
    fontWeight: "500",
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
    color: "#374151",
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
    lineHeight: 26,
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  affirmationButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  affirmationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4F46E5",
  },
  habitsStrip: {
    marginBottom: 20,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  habitItemCompleted: {
    backgroundColor: "#F0FDF4",
  },
  habitText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    fontWeight: "500",
    flex: 1,
  },
  emptyState: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  journalCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
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
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  journalInput: {
    fontSize: 16,
    color: "#374151",
    minHeight: 150,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    color: "#1F2937",
    marginBottom: 16,
  },
  modalInput: {
    fontSize: 16,
    color: "#374151",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
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
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonSave: {
    backgroundColor: "#4F46E5",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  favoritesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  favoriteText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  emptyFavorites: {
    alignItems: "center",
    padding: 32,
  },
  emptyFavoritesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
  },
  emptyFavoritesSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
});
