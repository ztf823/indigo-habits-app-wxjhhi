
import React, { useState, useEffect, useCallback } from "react";
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
import { Stack } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { BACKEND_URL } from "@/utils/api";
import { loadAffirmationsOffline, getRandomAffirmation } from "@/utils/affirmations";

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
  const [affirmation, setAffirmation] = useState<string>("Your affirmation today.");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalEntry, setJournalEntry] = useState<string>("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [affirmationCount, setAffirmationCount] = useState<number>(0);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customText, setCustomText] = useState("");
  const [favorites, setFavorites] = useState<CustomAffirmation[]>([]);
  const [offlineAffirmations, setOfflineAffirmations] = useState<string[]>([]);
  const [isPro, setIsPro] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const savedHabits = await AsyncStorage.getItem("habits");
      const savedEntry = await AsyncStorage.getItem("journalEntry");
      const savedPhoto = await AsyncStorage.getItem("photoUri");
      const savedCount = await AsyncStorage.getItem("affirmationCount");
      const savedFavorites = await AsyncStorage.getItem("favoriteAffirmations");
      const savedPro = await AsyncStorage.getItem("isPro");

      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        const defaultHabits: Habit[] = [
          { id: "1", name: "Morning meditation", completed: false, color: "#4F46E5" },
          { id: "2", name: "Exercise", completed: false, color: "#06B6D4" },
          { id: "3", name: "Read 10 pages", completed: false, color: "#10B981" },
        ];
        setHabits(defaultHabits);
        await AsyncStorage.setItem("habits", JSON.stringify(defaultHabits));
      }

      if (savedEntry) setJournalEntry(savedEntry);
      if (savedPhoto) setPhotoUri(savedPhoto);
      if (savedCount) setAffirmationCount(parseInt(savedCount));
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
      if (savedPro) setIsPro(savedPro === "true");

      const offline = await loadAffirmationsOffline();
      setOfflineAffirmations(offline);

      // TODO: Backend Integration - Fetch user's favorite affirmations from /api/affirmations/favorites
      // TODO: Backend Integration - Check pro status from /api/user/subscription
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleHabit = async (habitId: string) => {
    try {
      const updatedHabits = habits.map((habit) =>
        habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
      );
      setHabits(updatedHabits);
      await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // TODO: Backend Integration - Update habit completion status via /api/habits/complete
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const generateAffirmation = async () => {
    try {
      if (favorites.length > 0) {
        const randomFavorite = favorites[Math.floor(Math.random() * favorites.length)];
        setAffirmation(randomFavorite.text);
      } else {
        const randomAffirmation = getRandomAffirmation(offlineAffirmations);
        setAffirmation(randomAffirmation);
      }
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // TODO: Backend Integration - Generate affirmation via /api/affirmations/generate
    } catch (error) {
      console.error("Error generating affirmation:", error);
    }
  };

  const saveCustomAffirmation = async () => {
    try {
      if (!customText.trim()) {
        Alert.alert("Error", "Please enter an affirmation");
        return;
      }

      if (!isPro && favorites.length >= 5) {
        Alert.alert(
          "Limit Reached",
          "Free users can save up to 5 favorite affirmations. Upgrade to Pro for unlimited favorites!",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => console.log("Navigate to upgrade") },
          ]
        );
        return;
      }

      const newAffirmation: CustomAffirmation = {
        id: Date.now().toString(),
        text: customText,
        isFavorite: true,
      };

      const updatedFavorites = [...favorites, newAffirmation];
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem("favoriteAffirmations", JSON.stringify(updatedFavorites));
      
      setAffirmation(customText);
      setCustomText("");
      setShowCustomModal(false);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // TODO: Backend Integration - Save custom affirmation via /api/affirmations/custom
    } catch (error) {
      console.error("Error saving custom affirmation:", error);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const updatedFavorites = favorites.filter((fav) => fav.id !== id);
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem("favoriteAffirmations", JSON.stringify(updatedFavorites));

      // TODO: Backend Integration - Remove favorite via /api/affirmations/favorites/:id
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        await AsyncStorage.setItem("photoUri", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const saveJournalEntry = async (text: string) => {
    try {
      setJournalEntry(text);
      await AsyncStorage.setItem("journalEntry", text);

      // TODO: Backend Integration - Auto-save journal entry via /api/journal-entries
    } catch (error) {
      console.error("Error saving journal entry:", error);
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
    <>
      <Stack.Screen options={{ title: "Journal", headerLargeTitle: true }} />
      <LinearGradient colors={["#4F46E5", "#06B6D4"]} style={styles.gradient}>
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Affirmation Card */}
          <View style={styles.affirmationCard}>
            <Text style={styles.affirmationTitle}>Your affirmation today</Text>
            <Text style={styles.affirmationText}>{affirmation}</Text>
            
            <View style={styles.affirmationButtons}>
              <TouchableOpacity 
                style={styles.affirmationButton} 
                onPress={() => setShowCustomModal(true)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="plus.circle"
                  android_material_icon_name="add-circle"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.affirmationButtonText}>Add custom</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.affirmationButton, styles.generateButton]} 
                onPress={generateAffirmation}
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.affirmationButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            {/* Favorites List */}
            {favorites.length > 0 && (
              <View style={styles.favoritesSection}>
                <Text style={styles.favoritesTitle}>
                  Favorites ({favorites.length}/{isPro ? "∞" : "5"})
                </Text>
                {favorites.map((fav) => (
                  <View key={fav.id} style={styles.favoriteItem}>
                    <TouchableOpacity
                      style={styles.favoriteTextContainer}
                      onPress={() => setAffirmation(fav.text)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.favoriteText} numberOfLines={1}>
                        {fav.text}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeFavorite(fav.id)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
                activeOpacity={0.7}
              >
                <IconSymbol
                  ios_icon_name={habit.completed ? "checkmark.circle.fill" : "circle"}
                  android_material_icon_name={habit.completed ? "check-circle" : "radio-button-unchecked"}
                  size={24}
                  color={habit.completed ? "#10B981" : "#9CA3AF"}
                />
                <Text style={[styles.habitText, habit.completed && styles.habitTextCompleted]}>
                  {habit.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Journal Entry Box */}
          <View style={styles.journalBox}>
            <View style={styles.journalHeader}>
              <Text style={styles.dateStamp}>{getCurrentDate()}</Text>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="photo-camera"
                  size={24}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.journalPhoto} />}
            <TextInput
              style={styles.journalInput}
              placeholder="How was your day?"
              placeholderTextColor="#9CA3AF"
              multiline
              value={journalEntry}
              onChangeText={saveJournalEntry}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Custom Affirmation Modal */}
        <Modal
          visible={showCustomModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCustomModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Custom Affirmation</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomModal(false)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="cancel"
                    size={28}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your affirmation..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={customText}
                onChangeText={setCustomText}
                autoFocus
              />
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={saveCustomAffirmation}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Save to Favorites</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  affirmationCard: {
    backgroundColor: "white",
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
    minHeight: 50,
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  affirmationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButton: {
    backgroundColor: "#06B6D4",
  },
  affirmationButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  favoritesSection: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  favoritesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  favoriteTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  favoriteText: {
    fontSize: 14,
    color: "#374151",
  },
  habitsStrip: {
    marginBottom: 20,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  habitItemCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  habitText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  habitTextCompleted: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  journalBox: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    minHeight: 300,
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
  dateStamp: {
    fontSize: 12,
    color: "#9CA3AF",
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
