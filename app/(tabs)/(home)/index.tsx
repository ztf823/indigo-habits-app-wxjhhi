
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
} from "react-native";
import { BACKEND_URL } from "@/utils/api";
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load habits from backend
      const response = await fetch(`${BACKEND_URL}/api/habits`);
      if (response.ok) {
        const habitsData = await response.json();
        setHabits(habitsData.map((h: any) => ({
          id: h.id,
          name: h.title,
          completed: false,
          color: h.color
        })));
      }

      // Load daily affirmation from backend
      const affResponse = await fetch(`${BACKEND_URL}/api/affirmations/daily`);
      if (affResponse.ok) {
        const affData = await affResponse.json();
        setAffirmation(affData.text);
      }

      // Load favorites from backend
      const favResponse = await fetch(`${BACKEND_URL}/api/affirmations/favorites`);
      if (favResponse.ok) {
        const favData = await favResponse.json();
        setFavorites(favData.affirmations || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newCompleted = !habit.completed;
    
    try {
      await fetch(`${BACKEND_URL}/api/habits/${habitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted })
      });

      setHabits(habits.map(h => 
        h.id === habitId ? { ...h, completed: newCompleted } : h
      ));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const generateAffirmation = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/affirmations/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        setAffirmation(data.text);
        setShowAffirmationCard(false);
      }
    } catch (error) {
      console.error("Error generating affirmation:", error);
    }
  };

  const saveCustomAffirmation = async () => {
    if (!customAffirmationText.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/affirmations/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: customAffirmationText })
      });

      if (response.ok) {
        const data = await response.json();
        setAffirmation(data.text);
        setCustomAffirmationText("");
        setShowCustomInput(false);
        setShowAffirmationCard(false);
        loadData();
      }
    } catch (error) {
      console.error("Error saving custom affirmation:", error);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/affirmations/${id}/favorite`, {
        method: "POST"
      });
      loadData();
    } catch (error) {
      console.error("Error removing favorite:", error);
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
    }
  };

  const saveJournalEntry = async (text: string) => {
    if (!text.trim()) return;

    try {
      await fetch(`${BACKEND_URL}/api/journal-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          photoUrl: photoUri,
          affirmation: affirmation,
          habits: habits
        })
      });

      setJournalText("");
      setPhotoUri(null);
      Alert.alert("Success", "Journal entry saved!");
    } catch (error) {
      console.error("Error saving journal:", error);
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
          {habits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={[styles.habitItem, habit.completed && styles.habitCompleted]}
              onPress={() => toggleHabit(habit.id)}
            >
              <Text style={styles.habitText}>{habit.name}</Text>
              <IconSymbol
                ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                android_material_icon_name={habit.completed ? "check_circle" : "cancel"}
                size={24}
                color={habit.completed ? "#10B981" : "#EF4444"}
              />
            </TouchableOpacity>
          ))}
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
            <Image source={{ uri: photoUri }} style={styles.journalPhoto} />
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
              onPress={() => setShowCustomInput(true)}
            >
              <Text style={styles.modalButtonText}>Add Custom</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={generateAffirmation}
            >
              <Text style={styles.modalButtonText}>Generate One</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowFavorites(true)}
            >
              <Text style={styles.modalButtonText}>View Favorites ({favorites.length})</Text>
            </TouchableOpacity>

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
              value={customAffirmationText}
              onChangeText={setCustomAffirmationText}
              multiline
            />
            <TouchableOpacity style={styles.modalButton} onPress={saveCustomAffirmation}>
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
              {favorites.map((fav) => (
                <View key={fav.id} style={styles.favoriteItem}>
                  <Text style={styles.favoriteText}>{fav.text}</Text>
                  <TouchableOpacity onPress={() => removeFavorite(fav.id)}>
                    <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
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
  },
  habitsContainer: {
    marginBottom: 20,
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
    backgroundColor: "rgba(16, 185, 129, 0.1)",
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
  },
  journalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
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
  },
  favoritesList: {
    maxHeight: 300,
    marginBottom: 16,
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
  },
});
