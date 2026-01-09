
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import React, { useState, useEffect } from "react";
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
import * as ImagePicker from "expo-image-picker";
import { authenticatedApiCall } from "@/utils/api";

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
  const [affirmation, setAffirmation] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalText, setJournalText] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showAffirmationModal, setShowAffirmationModal] = useState(false);
  const [customAffirmationText, setCustomAffirmationText] = useState("");
  const [favorites, setFavorites] = useState<CustomAffirmation[]>([]);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load daily affirmation
      const affirmationData = await authenticatedApiCall("/api/affirmations/daily");
      setAffirmation(affirmationData.text);

      // Load habits
      const habitsData = await authenticatedApiCall("/api/habits");
      const today = new Date().toISOString().split('T')[0];
      
      // Get completions for today
      const completionsData = await authenticatedApiCall(
        `/api/habits/completions?startDate=${today}&endDate=${today}`
      );
      
      const completionMap = new Map(
        completionsData.completions.map((c: any) => [c.habitId, c.completed])
      );

      const habitsWithCompletion = habitsData
        .filter((h: any) => h.isActive)
        .map((h: any) => ({
          id: h.id,
          title: h.title,
          color: h.color,
          completed: completionMap.get(h.id) || false,
        }));

      setHabits(habitsWithCompletion);

      // Load favorites
      const favoritesData = await authenticatedApiCall("/api/affirmations/favorites");
      setFavorites(favoritesData.affirmations);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newCompleted = !habit.completed;
      setHabits(habits.map(h => 
        h.id === habitId ? { ...h, completed: newCompleted } : h
      ));

      await authenticatedApiCall(`/api/habits/${habitId}/complete`, {
        method: "POST",
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit");
      loadData();
    }
  };

  const generateAffirmation = async () => {
    try {
      setIsGenerating(true);
      const data = await authenticatedApiCall("/api/affirmations/generate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setAffirmation(data.text);
      setShowAffirmationModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Error generating affirmation:", error);
      Alert.alert("Error", error.message || "Failed to generate affirmation");
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
      const data = await authenticatedApiCall("/api/affirmations/custom", {
        method: "POST",
        body: JSON.stringify({ text: customAffirmationText }),
      });
      
      setAffirmation(data.text);
      setCustomAffirmationText("");
      setShowAffirmationModal(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (error: any) {
      console.error("Error saving custom affirmation:", error);
      Alert.alert("Error", error.message || "Failed to save affirmation");
    }
  };

  const selectFavorite = async (favorite: CustomAffirmation) => {
    setAffirmation(favorite.text);
    setShowFavoritesModal(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (!journalText.trim()) {
      Alert.alert("Error", "Please write something in your journal");
      return;
    }

    try {
      setIsSaving(true);
      
      let photoUrl = null;
      if (photoUri) {
        const formData = new FormData();
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: 'journal-photo.jpg',
        } as any);

        const uploadResponse = await authenticatedApiCall("/api/upload/photo", {
          method: "POST",
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        photoUrl = uploadResponse.url;
      }

      await authenticatedApiCall("/api/journal-entries", {
        method: "POST",
        body: JSON.stringify({
          content: journalText,
          photoUrl,
        }),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Journal entry saved!");
      
      setJournalText("");
      setPhotoUri(null);
      loadData();
    } catch (error: any) {
      console.error("Error saving journal:", error);
      Alert.alert("Error", error.message || "Failed to save journal entry");
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#6366F1", "#87CEEB"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Text style={styles.affirmationButtonText}>Generate one</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.favoritesButton}
            onPress={() => setShowFavoritesModal(true)}
          >
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={16} 
              color="#FFD700" 
            />
            <Text style={styles.favoritesButtonText}>Favorites ({favorites.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Habits Strip */}
        <View style={styles.habitsStrip}>
          {habits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.habitItem,
                habit.completed && styles.habitItemCompleted,
              ]}
              onPress={() => toggleHabit(habit.id)}
            >
              <IconSymbol
                ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                android_material_icon_name={habit.completed ? "check-circle" : "cancel"}
                size={24}
                color={habit.completed ? "#10B981" : "#EF4444"}
              />
              <Text style={styles.habitText}>{habit.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Journal Entry */}
        <View style={styles.journalCard}>
          <View style={styles.journalHeader}>
            <Text style={styles.dateText}>{getCurrentDate()}</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol 
                ios_icon_name="camera.fill" 
                android_material_icon_name="camera" 
                size={24} 
                color="#6366F1" 
              />
            </TouchableOpacity>
          </View>

          {photoUri && (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photo} />
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
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={saveJournalEntry}
            disabled={isSaving}
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
        animationType="slide"
        transparent
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
                <Text style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favorites Modal */}
      <Modal
        visible={showFavoritesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Favorite Affirmations</Text>
            <ScrollView style={styles.favoritesList}>
              {favorites.map((fav) => (
                <TouchableOpacity
                  key={fav.id}
                  style={styles.favoriteItem}
                  onPress={() => selectFavorite(fav)}
                >
                  <Text style={styles.favoriteText}>{fav.text}</Text>
                </TouchableOpacity>
              ))}
              {favorites.length === 0 && (
                <Text style={styles.emptyText}>No favorites yet</Text>
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
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  affirmationButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  affirmationButtonText: {
    color: "#6366F1",
    fontWeight: "600",
  },
  favoritesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  favoritesButtonText: {
    color: "#6B7280",
    fontSize: 14,
  },
  habitsStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  habitItemCompleted: {
    backgroundColor: "#D1FAE5",
  },
  habitText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
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
  dateText: {
    fontSize: 14,
    color: "#6B7280",
  },
  photoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  journalInput: {
    minHeight: 150,
    fontSize: 16,
    color: "#1F2937",
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
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
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonSave: {
    backgroundColor: "#6366F1",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalButtonTextSave: {
    color: "#FFF",
  },
  favoritesList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  favoriteItem: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 12,
  },
  favoriteText: {
    fontSize: 16,
    color: "#1F2937",
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 16,
    marginTop: 20,
  },
});
