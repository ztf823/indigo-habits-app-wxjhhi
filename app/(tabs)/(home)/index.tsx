
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
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

interface Habit {
  id: string;
  name: string;
  completed: boolean;
  color: string;
}

export default function HomeScreen() {
  const [affirmation, setAffirmation] = useState<string>("Your affirmation today.");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalEntry, setJournalEntry] = useState<string>("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [affirmationCount, setAffirmationCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const savedHabits = await AsyncStorage.getItem("habits");
      const savedEntry = await AsyncStorage.getItem("journalEntry");
      const savedPhoto = await AsyncStorage.getItem("photoUri");
      const savedCount = await AsyncStorage.getItem("affirmationCount");

      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        // Default habits
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
      
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
    }
  };

  const generateAffirmation = async () => {
    try {
      if (affirmationCount >= 5) {
        Alert.alert("Limit Reached", "Upgrade to Pro for unlimited affirmations!");
        return;
      }

      const affirmations = [
        "I am capable of achieving my goals.",
        "Today is full of possibilities.",
        "I choose to be happy and grateful.",
        "I am worthy of love and respect.",
        "I embrace challenges as opportunities to grow.",
        "I trust in my journey and my timing.",
        "I am becoming the best version of myself.",
        "Every day I grow stronger and wiser.",
      ];

      const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
      setAffirmation(randomAffirmation);
      const newCount = affirmationCount + 1;
      setAffirmationCount(newCount);
      await AsyncStorage.setItem("affirmationCount", newCount.toString());
      
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Error generating affirmation:", error);
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
              onPress={generateAffirmation}
              activeOpacity={0.7}
            >
              <Text style={styles.affirmationButtonText}>Generate one</Text>
            </TouchableOpacity>
            <Text style={styles.affirmationCount}>{affirmationCount}/5 free</Text>
          </View>
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
    </LinearGradient>
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
    paddingTop: Platform.OS === "android" ? 60 : 80,
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  affirmationButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  affirmationButtonText: {
    color: "white",
    fontWeight: "600",
  },
  affirmationCount: {
    fontSize: 12,
    color: "#9CA3AF",
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
});
