
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePremium } from "@/hooks/usePremium";
import { Habit, JournalEntry } from "@/types";
import { getRandomAffirmation, loadAffirmationsOffline } from "@/utils/affirmations";
import { playCompletionChime, playSuccessHaptic } from "@/utils/sounds";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [journalText, setJournalText] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [affirmation, setAffirmation] = useState("");
  const [showAffirmationCard, setShowAffirmationCard] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [affirmationsUsed, setAffirmationsUsed] = useState(0);
  const slideAnim = useState(new Animated.Value(-300))[0];
  const { isPro, showPaywall } = usePremium();
  const router = useRouter();

  // Load data on mount
  useEffect(() => {
    checkFirstTime();
    loadData();
    loadAffirmationsOffline();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome) {
        router.replace("/welcome");
      }
    } catch (error) {
      console.error("Error checking first time:", error);
    }
  };

  const loadData = async () => {
    try {
      // Load habits
      const savedHabits = await AsyncStorage.getItem("habits");
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        // Default habits for free users
        const defaultHabits: Habit[] = [
          { id: "1", name: "Morning meditation", completed: false },
          { id: "2", name: "Exercise", completed: false },
          { id: "3", name: "Read 10 pages", completed: false },
        ];
        setHabits(defaultHabits);
        await AsyncStorage.setItem("habits", JSON.stringify(defaultHabits));
      }

      // Load affirmations count
      const count = await AsyncStorage.getItem("affirmationsUsed");
      if (count) {
        setAffirmationsUsed(parseInt(count));
      }

      // Pro status is managed by usePremium hook

      // Load today's affirmation
      const todayAffirmation = await AsyncStorage.getItem("todayAffirmation");
      if (todayAffirmation) {
        setAffirmation(todayAffirmation);
      }

      // TODO: Backend Integration - Load affirmations from backend on first launch
      // TODO: Backend Integration - Fetch user's habits from backend
      // TODO: Backend Integration - Sync journal entries with backend
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const toggleAffirmationCard = () => {
    if (!showAffirmationCard) {
      setShowAffirmationCard(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -300,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start(() => {
        setShowAffirmationCard(false);
      });
    }
  };

  const generateAffirmation = async () => {
    if (!isPro && affirmationsUsed >= 5) {
      Alert.alert(
        "Upgrade to Pro",
        "You've used all 5 free affirmations. Upgrade to Pro for unlimited affirmations!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => handleUpgrade() },
        ]
      );
      return;
    }

    // TODO: Backend Integration - Call AI affirmation generation API endpoint
    const randomAffirmation = getRandomAffirmation();

    setAffirmation(randomAffirmation);
    await AsyncStorage.setItem("todayAffirmation", randomAffirmation);

    const newCount = affirmationsUsed + 1;
    setAffirmationsUsed(newCount);
    await AsyncStorage.setItem("affirmationsUsed", newCount.toString());

    await playSuccessHaptic();
  };

  const addCustomAffirmation = () => {
    Alert.prompt(
      "Custom Affirmation",
      "Enter your affirmation:",
      async (text) => {
        if (text && text.trim()) {
          setAffirmation(text.trim());
          await AsyncStorage.setItem("todayAffirmation", text.trim());
          await playSuccessHaptic();
        }
      }
    );
  };

  const handleUpgrade = () => {
    showPaywall();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      // TODO: Backend Integration - Upload photo to backend storage
    }
  };

  const toggleHabit = async (habitId: string) => {
    const updatedHabits = habits.map((habit) =>
      habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
    );
    setHabits(updatedHabits);
    await AsyncStorage.setItem("habits", JSON.stringify(updatedHabits));

    // Play completion chime if habit was completed
    const habit = updatedHabits.find((h) => h.id === habitId);
    if (habit?.completed) {
      await playCompletionChime();
    }

    // TODO: Backend Integration - Update habit completion status on backend
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
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Affirmation Card */}
        <TouchableOpacity
          style={styles.affirmationTrigger}
          onPress={toggleAffirmationCard}
          activeOpacity={0.8}
        >
          <Text style={styles.affirmationTriggerText}>
            ✨ Your affirmation today
          </Text>
          <IconSymbol
            ios_icon_name="chevron.down"
            android_material_icon_name={
              showAffirmationCard ? "expand-less" : "expand-more"
            }
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        {showAffirmationCard && (
          <Animated.View
            style={[
              styles.affirmationCard,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {affirmation ? (
              <Text style={styles.affirmationText}>{affirmation}</Text>
            ) : (
              <Text style={styles.affirmationPlaceholder}>
                Generate or add your daily affirmation
              </Text>
            )}

            <View style={styles.affirmationButtons}>
              <TouchableOpacity
                style={styles.affirmationButton}
                onPress={addCustomAffirmation}
              >
                <Text style={styles.affirmationButtonText}>Add custom</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.affirmationButton, styles.affirmationButtonPrimary]}
                onPress={generateAffirmation}
              >
                <Text style={styles.affirmationButtonTextPrimary}>
                  Generate one
                </Text>
              </TouchableOpacity>
            </View>

            {!isPro && (
              <Text style={styles.affirmationLimit}>
                {affirmationsUsed}/5 free affirmations used
              </Text>
            )}
          </Animated.View>
        )}

        {/* Journal Entry Box */}
        <View style={styles.journalCard}>
          <View style={styles.journalHeader}>
            <Text style={styles.dateStamp}>{getCurrentDate()}</Text>
            <TouchableOpacity onPress={pickImage} style={styles.cameraButton}>
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="camera-alt"
                size={24}
                color={colors.iconSilver}
              />
            </TouchableOpacity>
          </View>

          {photoUri && (
            <View style={styles.photoPreview}>
              <Text style={styles.photoText}>📷 Photo attached</Text>
            </View>
          )}

          <TextInput
            style={styles.journalInput}
            placeholder="How are you feeling today?"
            placeholderTextColor={colors.textSecondary}
            multiline
            value={journalText}
            onChangeText={setJournalText}
            textAlignVertical="top"
          />
        </View>

        {/* Habits Strip */}
        <View style={styles.habitsSection}>
          <Text style={styles.habitsSectionTitle}>Today&apos;s Habits</Text>
          <View style={styles.habitsStrip}>
            {habits.map((habit, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitItem,
                    habit.completed && styles.habitItemCompleted,
                  ]}
                  onPress={() => toggleHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitContent}>
                    {habit.completed ? (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color={colors.accent}
                      />
                    ) : (
                      <IconSymbol
                        ios_icon_name="xmark"
                        android_material_icon_name="close"
                        size={20}
                        color={colors.error}
                      />
                    )}
                    <Text
                      style={[
                        styles.habitName,
                        habit.completed && styles.habitNameCompleted,
                      ]}
                    >
                      {habit.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
          {!isPro && (
            <Text style={styles.habitsLimit}>
              Free: 3 habits • Pro: 10 habits
            </Text>
          )}
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
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  affirmationTrigger: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
    elevation: 2,
  },
  affirmationTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  affirmationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 26,
  },
  affirmationPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  affirmationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  affirmationButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  affirmationButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  affirmationButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  affirmationButtonTextPrimary: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background,
  },
  affirmationLimit: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
  },
  journalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateStamp: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  cameraButton: {
    padding: 4,
  },
  photoPreview: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  journalInput: {
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    lineHeight: 24,
  },
  habitsSection: {
    marginBottom: 20,
  },
  habitsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.card,
    marginBottom: 12,
  },
  habitsStrip: {
    gap: 12,
  },
  habitItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.error,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
    elevation: 2,
  },
  habitItemCompleted: {
    borderColor: colors.accent,
    backgroundColor: colors.accentGlow,
  },
  habitContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  habitNameCompleted: {
    color: colors.accent,
  },
  habitsLimit: {
    fontSize: 12,
    color: colors.card,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "500",
  },
});
