
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

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
  const router = useRouter();
  const [journalText, setJournalText] = useState("");
  const [affirmationVisible, setAffirmationVisible] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const proStatus = await AsyncStorage.getItem("isPro");
      setIsPro(proStatus === "true");
      
      const savedHabits = await AsyncStorage.getItem("habits");
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        const defaultHabits: Habit[] = [
          { id: "1", name: "Morning meditation", completed: false, color: "#6366f1" },
          { id: "2", name: "Exercise", completed: false, color: "#8b5cf6" },
          { id: "3", name: "Read 10 pages", completed: false, color: "#a855f7" },
        ];
        setHabits(defaultHabits);
        await AsyncStorage.setItem("habits", JSON.stringify(defaultHabits));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleHabit = async (habitId: string) => {
    const updatedHabits = habits.map(h =>
      h.id === habitId ? { ...h, completed: !h.completed } : h
    );
    setHabits(updatedHabits);
    await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const generateAffirmation = () => {
    const affirmations = [
      "I am capable of achieving my goals",
      "Today is full of possibilities",
      "I choose to be happy and grateful",
      "I am worthy of love and respect",
      "I embrace positive change",
      "I trust in my journey",
      "I am growing every day",
      "I deserve success and happiness",
    ];
    const random = affirmations[Math.floor(Math.random() * affirmations.length)];
    setCurrentAffirmation(random);
    setAffirmationVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <LinearGradient colors={["#6366f1", "#87ceeb"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Indigo Habits</Text>
          <Text style={styles.date}>{getCurrentDate()}</Text>
        </View>

        {/* Affirmation Card */}
        <TouchableOpacity
          style={styles.affirmationCard}
          onPress={() => setAffirmationVisible(!affirmationVisible)}
        >
          <Text style={styles.affirmationTitle}>Your affirmation today</Text>
          {affirmationVisible && currentAffirmation ? (
            <Text style={styles.affirmationText}>{currentAffirmation}</Text>
          ) : null}
          <View style={styles.affirmationButtons}>
            <TouchableOpacity
              style={styles.affirmationBtn}
              onPress={generateAffirmation}
            >
              <Text style={styles.affirmationBtnText}>Generate one</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Journal Entry */}
        <View style={styles.journalCard}>
          <View style={styles.journalHeader}>
            <Text style={styles.journalDate}>{getCurrentDate()}</Text>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol 
                ios_icon_name="camera.fill" 
                android_material_icon_name="camera" 
                size={24} 
                color="#6366f1" 
              />
            </TouchableOpacity>
          </View>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.journalImage} />
          )}
          <TextInput
            style={styles.journalInput}
            placeholder="How was your day?"
            placeholderTextColor="#999"
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />
        </View>

        {/* Habits Strip */}
        <View style={styles.habitsSection}>
          <Text style={styles.habitsTitle}>Today&apos;s Habits</Text>
          {habits.map((habit) => (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.habitItem,
                habit.completed && styles.habitCompleted,
              ]}
              onPress={() => toggleHabit(habit.id)}
            >
              <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
              <Text style={styles.habitName}>{habit.name}</Text>
              <IconSymbol
                ios_icon_name={habit.completed ? "checkmark.circle.fill" : "circle"}
                android_material_icon_name={habit.completed ? "check-circle" : "radio-button-unchecked"}
                size={24}
                color={habit.completed ? "#10b981" : "#d1d5db"}
              />
            </TouchableOpacity>
          ))}
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#e0e7ff",
  },
  affirmationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  affirmationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6366f1",
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    color: "#1f2937",
    marginBottom: 16,
    fontStyle: "italic",
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  affirmationBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  affirmationBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  journalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    minHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  journalDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  journalImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  journalInput: {
    fontSize: 16,
    color: "#1f2937",
    minHeight: 100,
    textAlignVertical: "top",
  },
  habitsSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  habitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  habitCompleted: {
    opacity: 0.6,
  },
  habitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitName: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
});
