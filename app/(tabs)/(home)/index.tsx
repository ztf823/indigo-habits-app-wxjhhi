
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  color: string;
}

interface Affirmation {
  id: string;
  text: string;
}

export default function HomeScreen() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", name: "Morning Meditation", completed: false, color: "#4B0082" },
    { id: "2", name: "Exercise", completed: false, color: "#87CEEB" },
    { id: "3", name: "Read", completed: false, color: "#9370DB" },
  ]);
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const savedHabits = await AsyncStorage.getItem("habits");
      const savedAffirmation = await AsyncStorage.getItem("todayAffirmation");
      const savedEntry = await AsyncStorage.getItem("todayJournal");
      const savedPhoto = await AsyncStorage.getItem("todayPhoto");
      
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
      if (savedAffirmation) {
        setAffirmation(JSON.parse(savedAffirmation));
      }
      if (savedEntry) {
        setJournalEntry(savedEntry);
      }
      if (savedPhoto) {
        setPhotoUri(savedPhoto);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleHabit = async (habitId: string) => {
    // TODO: Backend Integration - Update habit completion status via API
    const updatedHabits = habits.map((habit) =>
      habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
    );
    setHabits(updatedHabits);
    await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const generateAffirmation = async () => {
    // TODO: Backend Integration - Fetch affirmation from backend API
    const sampleAffirmations = [
      "I am capable of achieving my goals.",
      "Today is full of possibilities.",
      "I choose to be happy and grateful.",
      "I am worthy of love and respect.",
      "Every day I grow stronger and wiser.",
    ];
    const randomAffirmation = {
      id: Date.now().toString(),
      text: sampleAffirmations[Math.floor(Math.random() * sampleAffirmations.length)],
    };
    setAffirmation(randomAffirmation);
    await AsyncStorage.setItem("todayAffirmation", JSON.stringify(randomAffirmation));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      await AsyncStorage.setItem("todayPhoto", result.assets[0].uri);
    }
  };

  const saveJournalEntry = async (text: string) => {
    setJournalEntry(text);
    await AsyncStorage.setItem("todayJournal", text);
    // TODO: Backend Integration - Save journal entry to backend API
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

  return (
    <LinearGradient colors={["#4B0082", "#87CEEB"]} style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Indigo Habits</Text>
          <Text style={styles.headerSubtitle}>Your daily journal</Text>
        </View>

        {/* Affirmation Card */}
        <View style={styles.affirmationCard}>
          <Text style={styles.affirmationTitle}>Your affirmation today</Text>
          {affirmation ? (
            <Text style={styles.affirmationText}>{affirmation.text}</Text>
          ) : (
            <Text style={styles.affirmationPlaceholder}>
              Generate or add your daily affirmation
            </Text>
          )}
          <View style={styles.affirmationButtons}>
            <TouchableOpacity style={styles.affirmationButton}>
              <Text style={styles.buttonText}>Add custom</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.affirmationButton} 
              onPress={generateAffirmation}
            >
              <Text style={styles.buttonText}>Generate one</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Habits Strip */}
        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>
          <View style={styles.habitsStrip}>
            {habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitItem,
                  habit.completed && styles.habitCompleted,
                ]}
                onPress={() => toggleHabit(habit.id)}
              >
                <IconSymbol
                  ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                  android_material_icon_name={habit.completed ? "check-circle" : "cancel"}
                  size={24}
                  color={habit.completed ? "#00C853" : "#FF5252"}
                />
                <Text style={styles.habitText}>{habit.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Journal Entry Box */}
        <View style={styles.journalBox}>
          <View style={styles.journalHeader}>
            <Text style={styles.dateStamp}>{getCurrentDate()}</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol 
                ios_icon_name="camera.fill" 
                android_material_icon_name="camera-alt"
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.journalPhoto} />
          )}
          <TextInput
            style={styles.journalInput}
            placeholder="Write your thoughts..."
            placeholderTextColor="#999"
            multiline
            value={journalEntry}
            onChangeText={saveJournalEntry}
            textAlignVertical="top"
          />
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
    paddingTop: Platform.OS === "android" ? 48 : 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  affirmationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  affirmationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 16,
    lineHeight: 26,
  },
  affirmationPlaceholder: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 16,
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  affirmationButton: {
    flex: 1,
    backgroundColor: "#4B0082",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  habitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 12,
  },
  habitsStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  habitCompleted: {
    backgroundColor: "#E8F5E9",
  },
  habitText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
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
    marginBottom: 15,
  },
  dateStamp: {
    fontSize: 14,
    color: "#999",
  },
  journalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  journalInput: {
    fontSize: 16,
    color: "#333",
    minHeight: 200,
    lineHeight: 24,
  },
});
