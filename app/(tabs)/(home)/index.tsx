
import React, { useState, useEffect, useCallback, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { getRandomAffirmation } from "@/utils/affirmations";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { IconSymbol } from "@/components/IconSymbol";
import {
  getAllAffirmations,
  getAllHabits,
  createAffirmation,
  updateAffirmation,
  deleteAffirmation,
  createHabit,
  updateHabit,
  deleteHabit,
  getHabitCompletion,
  setHabitCompletion,
  getProfile,
  createJournalEntry,
  getAllJournalEntries,
  updateJournalEntry,
} from "@/utils/database";
import { playChime } from "@/utils/sounds";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useRouter, usePathname } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AFFIRMATION_CARD_WIDTH = 300;
const AFFIRMATION_CARD_MARGIN = 16;

interface Affirmation {
  id: string;
  text: string;
  isCustom: number;
  isFavorite?: number;
  isRepeating?: number;
}

interface Habit {
  id: string;
  title: string;
  completed?: boolean;
  color: string;
  isFavorite?: number;
  isRepeating?: number;
}

interface JournalEntry {
  id: string;
  content: string;
  photoUri?: string;
  audioUri?: string;
  date: string;
  isFavorite?: number;
}

// 🚀 PREVIEW MODE: Removed display limits - show all affirmations and habits
const FREE_HOME_DISPLAY_LIMIT = 999999; // Effectively unlimited for preview

// Default habits to create on first launch
const DEFAULT_HABITS = [
  { title: "Morning meditation", color: "#10B981" },
  { title: "Exercise", color: "#3B82F6" },
  { title: "Read 10 pages", color: "#F59E0B" },
  { title: "Drink 8 glasses of water", color: "#06B6D4" },
  { title: "Practice gratitude", color: "#8B5CF6" },
];

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  // 🚀 PREVIEW MODE: Always set premium to true
  const [isPremium, setIsPremium] = useState(true);

  // Journal state
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [journalContent, setJournalContent] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalPhoto, setJournalPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const [journalIsFavorite, setJournalIsFavorite] = useState(false);

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Ref to track affirmations section layout
  const affirmationsSectionRef = useRef<View>(null);
  const [affirmationsLayout, setAffirmationsLayout] = useState<{
    y: number;
    height: number;
  } | null>(null);

  const tabs = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/' as any,
      label: 'Home',
    },
    {
      name: 'habits',
      route: '/(tabs)/habits' as any,
      label: 'Habits',
    },
    {
      name: 'history',
      route: '/(tabs)/history' as any,
      label: 'History',
    },
    {
      name: 'progress',
      route: '/(tabs)/progress' as any,
      label: 'Progress',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile' as any,
      label: 'Profile',
    },
  ];

  const getCurrentIndex = useCallback(() => {
    const currentPath = pathname.split('/').filter(Boolean).pop() || '(home)';
    const index = tabs.findIndex(tab => 
      tab.name === currentPath || 
      (tab.name === '(home)' && (currentPath === '' || currentPath === '(home)'))
    );
    return index >= 0 ? index : 0;
  }, [pathname]);

  const navigateToTab = useCallback((direction: 'left' | 'right') => {
    const currentIndex = getCurrentIndex();
    let nextIndex: number;

    if (direction === 'right') {
      // Swipe right = go to previous tab (or wrap to last)
      nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    } else {
      // Swipe left = go to next tab (or wrap to first)
      nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
    }

    console.log(`User swiped ${direction}, navigating from ${tabs[currentIndex].label} to ${tabs[nextIndex].label}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(tabs[nextIndex].route);
  }, [getCurrentIndex, router, tabs]);

  // Create pan gesture that blocks tab switching inside affirmations card area
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Require 20px horizontal movement to activate
    .failOffsetY([-15, 15]) // Fail if vertical movement exceeds 15px (preserves vertical scroll)
    .onStart((event) => {
      // Check if gesture started inside affirmations section
      if (affirmationsLayout) {
        const gestureY = event.absoluteY;
        const affirmationsTop = affirmationsLayout.y;
        const affirmationsBottom = affirmationsLayout.y + affirmationsLayout.height;
        
        if (gestureY >= affirmationsTop && gestureY <= affirmationsBottom) {
          console.log('Gesture started inside affirmations card - allowing carousel only, blocking tab switch');
          // We'll check this in onEnd to prevent tab switching
        } else {
          console.log('Gesture started outside affirmations card - tab switching enabled');
        }
      }
    })
    .onEnd((event) => {
      // Check if gesture started inside affirmations section
      if (affirmationsLayout) {
        const gestureY = event.absoluteY;
        const affirmationsTop = affirmationsLayout.y;
        const affirmationsBottom = affirmationsLayout.y + affirmationsLayout.height;
        
        // If gesture started inside affirmations area, block tab switching
        if (gestureY >= affirmationsTop && gestureY <= affirmationsBottom) {
          console.log('Gesture ended inside affirmations card - ignoring for tab switch');
          return;
        }
      }
      
      const { velocityX, translationX } = event;
      
      // Determine swipe direction based on velocity and translation
      if (Math.abs(velocityX) > 300 || Math.abs(translationX) > 100) {
        if (velocityX > 0 || translationX > 0) {
          // Swiped right
          navigateToTab('right');
        } else {
          // Swiped left
          navigateToTab('left');
        }
      }
    });

  const loadPremiumStatus = useCallback(async () => {
    try {
      // 🚀 PREVIEW MODE: Always set premium to true, ignore database
      setIsPremium(true);
      console.log('🚀 PREVIEW MODE: Premium status forced to true for testing');
    } catch (error) {
      console.error("Error loading premium status:", error);
    }
  }, []);

  const loadAffirmations = useCallback(async () => {
    try {
      const dbAffirmations = (await getAllAffirmations()) as Affirmation[];
      
      // Filter for repeating affirmations only
      let repeatingAffirmations = dbAffirmations.filter(a => a.isRepeating === 1);
      
      // If we have less than the limit, fill with random ones
      if (repeatingAffirmations.length < FREE_HOME_DISPLAY_LIMIT) {
        const needed = Math.min(5, FREE_HOME_DISPLAY_LIMIT - repeatingAffirmations.length);
        console.log(`Creating ${needed} default affirmations...`);
        
        for (let i = 0; i < needed; i++) {
          const affirmation = getRandomAffirmation();
          const newAffirmation = {
            id: `affirmation_${Date.now()}_${i}`,
            text: affirmation,
            isCustom: false,
            isRepeating: true, // Make them repeating by default
            isFavorite: false,
            orderIndex: repeatingAffirmations.length + i,
          };
          await createAffirmation(newAffirmation);
          repeatingAffirmations.push({ ...newAffirmation, isCustom: 0, isRepeating: 1, isFavorite: 0 });
        }
      }
      
      // 🚀 PREVIEW MODE: Show ALL repeating affirmations (no limit)
      const displayAffirmations = repeatingAffirmations;
      
      setAffirmations(displayAffirmations);
      console.log(`🚀 PREVIEW MODE: Loaded ${displayAffirmations.length} affirmations (unlimited)`);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
  }, [isPremium]);

  const loadHabits = useCallback(async () => {
    try {
      const dbHabits = (await getAllHabits()) as Habit[];
      const today = new Date().toISOString().split("T")[0];

      // Filter for repeating habits only
      let repeatingHabits = dbHabits.filter(h => h.isRepeating === 1);

      // If no repeating habits exist, create default ones
      if (repeatingHabits.length === 0) {
        console.log(`Creating ${DEFAULT_HABITS.length} default habits...`);
        
        for (let i = 0; i < DEFAULT_HABITS.length; i++) {
          const defaultHabit = DEFAULT_HABITS[i];
          const newHabit = {
            id: `habit_${Date.now()}_${i}`,
            title: defaultHabit.title,
            color: defaultHabit.color,
            isRepeating: true,
            isFavorite: false,
            orderIndex: i,
          };
          await createHabit(newHabit);
          repeatingHabits.push({ ...newHabit, isRepeating: 1, isFavorite: 0 } as any);
        }
      }

      // Load completion status for today
      const habitsWithCompletion = await Promise.all(
        repeatingHabits.map(async (habit) => {
          const completion = await getHabitCompletion(habit.id, today);
          return {
            ...habit,
            completed: completion ? (completion as any).completed === 1 : false,
          };
        })
      );

      // 🚀 PREVIEW MODE: Show ALL repeating habits (no limit)
      const displayHabits = habitsWithCompletion;

      setHabits(displayHabits);
      console.log(`🚀 PREVIEW MODE: Loaded ${displayHabits.length} habits (unlimited)`);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  }, [isPremium]);

  const loadTodayJournal = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const allEntries = await getAllJournalEntries() as JournalEntry[];
      const todayEntry = allEntries.find(e => e.date === today);
      
      if (todayEntry) {
        setJournalContent(todayEntry.content || "");
        setJournalPhoto(todayEntry.photoUri || null);
        setAudioUri(todayEntry.audioUri || null);
        setCurrentJournalId(todayEntry.id);
        setJournalIsFavorite((todayEntry as any).isFavorite === 1);
      } else {
        setJournalContent("");
        setJournalPhoto(null);
        setAudioUri(null);
        setCurrentJournalId(null);
        setJournalIsFavorite(false);
      }
    } catch (error) {
      console.error("Error loading today's journal:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      console.log("Loading home screen data from SQLite...");
      setLoading(true);

      // Load premium status first, then load data based on that
      await loadPremiumStatus();
    } catch (error) {
      console.error("Error loading home screen data:", error);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [loadPremiumStatus]);

  // Load affirmations and habits after premium status is loaded
  useEffect(() => {
    if (!loading) {
      loadAffirmations();
      loadHabits();
      loadTodayJournal();
    }
  }, [isPremium, loading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save journal every 30 seconds
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  const toggleHabit = async (habitId: string) => {
    try {
      console.log(`User toggled habit: ${habitId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const today = new Date().toISOString().split("T")[0];
      const habit = habits.find((h) => h.id === habitId);

      if (!habit) return;

      const newCompleted = !habit.completed;

      // Update local state immediately
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, completed: newCompleted } : h
        )
      );

      // Save to database
      await setHabitCompletion(habitId, today, newCompleted);

      // Play chime sound
      if (newCompleted) {
        playChime();
      }

      console.log(`Habit ${habitId} marked as ${newCompleted ? "completed" : "incomplete"}`);
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const toggleFavoriteHabit = async (habitId: string) => {
    try {
      console.log(`User toggled favorite for habit: ${habitId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newFavorite = habit.isFavorite === 1 ? 0 : 1;

      // Update local state
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, isFavorite: newFavorite } : h
        )
      );

      // Save to database
      await updateHabit(habitId, { isFavorite: newFavorite === 1 });

      // Play chime sound
      playChime();

      console.log(`Habit ${habitId} favorite status: ${newFavorite === 1}`);
    } catch (error) {
      console.error("Error toggling favorite habit:", error);
    }
  };

  const toggleFavoriteAffirmation = async (affirmationId: string) => {
    try {
      console.log(`User toggled favorite for affirmation: ${affirmationId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const affirmation = affirmations.find((a) => a.id === affirmationId);
      if (!affirmation) return;

      const newFavorite = affirmation.isFavorite === 1 ? 0 : 1;

      // Update local state
      setAffirmations((prev) =>
        prev.map((a) =>
          a.id === affirmationId ? { ...a, isFavorite: newFavorite } : a
        )
      );

      // Save to database
      await updateAffirmation(affirmationId, {
        isFavorite: newFavorite === 1,
      });

      // Play chime sound
      playChime();

      console.log(`Affirmation ${affirmationId} favorite status: ${newFavorite === 1}`);
    } catch (error) {
      console.error("Error toggling favorite affirmation:", error);
    }
  };

  const generateNewAffirmation = async (affirmationId: string) => {
    try {
      console.log(`User requested new affirmation for: ${affirmationId}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newText = getRandomAffirmation();

      // Update local state
      setAffirmations((prev) =>
        prev.map((a) => (a.id === affirmationId ? { ...a, text: newText } : a))
      );

      // Save to database
      await updateAffirmation(affirmationId, { text: newText });

      // Play chime sound
      playChime();

      console.log("New affirmation generated");
    } catch (error) {
      console.error("Error generating new affirmation:", error);
      Alert.alert("Error", "Failed to generate new affirmation. Please try again.");
    }
  };

  const openJournalModal = () => {
    console.log("User tapped journal entry section to open full-screen journal");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJournalModalVisible(true);
  };

  const closeJournalModal = () => {
    console.log("User closed journal modal");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Save before closing
    saveJournalEntry();
    
    setJournalModalVisible(false);
  };

  const handleJournalTextChange = (text: string) => {
    setJournalContent(text);
    
    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    // Set new auto-save timer for 30 seconds
    autoSaveTimer.current = setTimeout(() => {
      console.log("Auto-saving journal entry...");
      saveJournalEntry();
    }, 30000);
  };

  const saveJournalEntry = async () => {
    if (!journalContent.trim() && !journalPhoto && !audioUri) return;
    
    try {
      setIsSaving(true);
      console.log("Saving journal entry...");
      
      const today = new Date().toISOString().split("T")[0];
      
      if (currentJournalId) {
        // Update existing entry
        await updateJournalEntry(currentJournalId, {
          content: journalContent,
          photoUri: journalPhoto || undefined,
          audioUri: audioUri || undefined,
        });
      } else {
        // Create new entry
        const entryId = `journal_${Date.now()}`;
        await createJournalEntry({
          id: entryId,
          content: journalContent,
          photoUri: journalPhoto || undefined,
          audioUri: audioUri || undefined,
          date: today,
        });
        setCurrentJournalId(entryId);
      }
      
      console.log("Journal entry saved");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Play chime sound
      playChime();
    } catch (error) {
      console.error("Error saving journal entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log("User tapped camera button");
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setJournalPhoto(result.assets[0].uri);
        console.log("Photo added to journal entry");
        
        // Auto-save after adding photo
        setTimeout(() => saveJournalEntry(), 500);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const startRecording = async () => {
    try {
      console.log("User started recording audio");
      
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant microphone access.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    try {
      console.log("User stopped recording audio");
      
      if (!recording) return;
      
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      
      console.log("Recording saved:", uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-save after recording
      setTimeout(() => saveJournalEntry(), 500);
    } catch (error) {
      console.error("Error stopping recording:", error);
      Alert.alert("Error", "Failed to stop recording. Please try again.");
    }
  };

  const toggleJournalFavorite = async () => {
    if (!currentJournalId) return;
    
    try {
      console.log("User toggled journal favorite");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newFavorite = !journalIsFavorite;
      setJournalIsFavorite(newFavorite);
      
      // Save to database
      await updateJournalEntry(currentJournalId, {
        isFavorite: newFavorite,
      } as any);
      
      // Play chime sound
      playChime();
    } catch (error) {
      console.error("Error toggling journal favorite:", error);
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#4F46E5", "#87CEEB"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const completedHabits = habits.filter((h) => h.completed).length;
  const totalHabits = habits.length;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <GestureDetector gesture={panGesture}>
      <LinearGradient
        colors={["#4F46E5", "#87CEEB"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Date */}
          <View style={styles.header}>
            <Text style={styles.dateText}>{today}</Text>
            {/* 🚀 PREVIEW MODE: Show preview badge instead of limit badge */}
            <View style={styles.limitBadge}>
              <Text style={styles.limitBadgeText}>
                🚀 PREVIEW MODE: Pro features unlocked
              </Text>
            </View>
          </View>

          {/* Affirmations Section with Snap Scrolling */}
          <View 
            style={styles.section}
            ref={affirmationsSectionRef}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setAffirmationsLayout({ y, height });
              console.log(`Affirmations section layout: y=${y}, height=${height}`);
            }}
          >
            <Text style={styles.sectionTitle}>Your Affirmations Today</Text>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={AFFIRMATION_CARD_WIDTH + AFFIRMATION_CARD_MARGIN}
              decelerationRate="fast"
              contentContainerStyle={styles.affirmationsScroll}
            >
              {affirmations.map((affirmation, index) => (
                <View 
                  key={affirmation.id} 
                  style={[
                    styles.affirmationCard,
                    index === 0 && styles.affirmationCardFirst,
                  ]}
                >
                  <View style={styles.affirmationHeader}>
                    <TouchableOpacity
                      onPress={() => toggleFavoriteAffirmation(affirmation.id)}
                      style={styles.iconButton}
                    >
                      <IconSymbol
                        ios_icon_name={affirmation.isFavorite === 1 ? "star.fill" : "star"}
                        android_material_icon_name={affirmation.isFavorite === 1 ? "star" : "star-border"}
                        size={24}
                        color={affirmation.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.affirmationText}>{affirmation.text}</Text>

                  <View style={styles.affirmationActions}>
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={() => generateNewAffirmation(affirmation.id)}
                    >
                      <Text style={styles.generateButtonText}>Generate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Daily Habits Section */}
          <View style={styles.section}>
            <View style={styles.habitsHeader}>
              <Text style={styles.sectionTitle}>Daily Habits</Text>
              <View style={styles.habitCounter}>
                <Text style={styles.habitCounterText}>
                  {completedHabits}/{totalHabits}
                </Text>
              </View>
            </View>

            <View style={styles.habitsCard}>
              {habits.map((habit) => (
                <View key={habit.id} style={styles.habitItem}>
                  <TouchableOpacity
                    style={[
                      styles.habitCheckbox,
                      { backgroundColor: habit.completed ? habit.color : "white", borderColor: habit.color },
                    ]}
                    onPress={() => toggleHabit(habit.id)}
                  >
                    {habit.completed && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={20}
                        color="white"
                      />
                    )}
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.habitTitle,
                      habit.completed && styles.habitTitleCompleted,
                    ]}
                  >
                    {habit.title}
                  </Text>

                  <TouchableOpacity
                    onPress={() => toggleFavoriteHabit(habit.id)}
                    style={styles.iconButton}
                  >
                    <IconSymbol
                      ios_icon_name={habit.isFavorite === 1 ? "star.fill" : "star"}
                      android_material_icon_name={habit.isFavorite === 1 ? "star" : "star-border"}
                      size={20}
                      color={habit.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Journal Entry Section - Now Tappable */}
          <View style={styles.section}>
            <View style={styles.journalHeader}>
              <Text style={styles.sectionTitle}>Today&apos;s Journal</Text>
              <Text style={styles.journalDate}>{new Date().toLocaleDateString()}</Text>
            </View>

            <TouchableOpacity 
              style={styles.journalCard}
              onPress={openJournalModal}
              activeOpacity={0.7}
            >
              <Text style={styles.journalPreview} numberOfLines={3}>
                {journalContent || "Tap here to start writing..."}
              </Text>
              
              {journalPhoto && (
                <View style={styles.journalPhotoPreview}>
                  <Image source={{ uri: journalPhoto }} style={styles.journalPhotoThumbnail} />
                </View>
              )}
              
              {audioUri && (
                <View style={styles.journalAudioPreview}>
                  <IconSymbol
                    ios_icon_name="waveform"
                    android_material_icon_name="graphic-eq"
                    size={16}
                    color="#4F46E5"
                  />
                  <Text style={styles.journalAudioText}>Audio memo attached</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Full-Screen Journal Modal */}
        <Modal
          visible={journalModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={closeJournalModal}
        >
          <KeyboardAvoidingView
            style={styles.journalModalContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.journalModalWhiteBackground}>
              {/* Journal Modal Header */}
              <View style={styles.journalModalHeader}>
                <TouchableOpacity onPress={closeJournalModal} style={styles.journalModalClose}>
                  <IconSymbol
                    ios_icon_name="chevron.down"
                    android_material_icon_name="keyboard-arrow-down"
                    size={28}
                    color="#1F2937"
                  />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.journalModalTitleInput}
                  placeholder="Title (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={journalTitle}
                  onChangeText={setJournalTitle}
                />
                
                <TouchableOpacity
                  onPress={toggleJournalFavorite}
                  style={styles.iconButton}
                >
                  <IconSymbol
                    ios_icon_name={journalIsFavorite ? "star.fill" : "star"}
                    android_material_icon_name={journalIsFavorite ? "star" : "star-border"}
                    size={24}
                    color={journalIsFavorite ? "#FFD700" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>

              {/* Date Stamp */}
              <View style={styles.journalModalDateStamp}>
                <Text style={styles.journalModalDateText}>
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>

              {/* Journal Text Area */}
              <View style={styles.journalModalContent}>
                <TextInput
                  style={styles.journalModalInput}
                  placeholder="Write your thoughts..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={journalContent}
                  onChangeText={handleJournalTextChange}
                  autoFocus
                />

                {journalPhoto && (
                  <View style={styles.journalModalPhotoPreview}>
                    <Image source={{ uri: journalPhoto }} style={styles.journalModalPhoto} />
                    <TouchableOpacity
                      onPress={() => setJournalPhoto(null)}
                      style={styles.journalModalRemoveButton}
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

                {audioUri && (
                  <View style={styles.journalModalAudioPreview}>
                    <IconSymbol
                      ios_icon_name="waveform"
                      android_material_icon_name="graphic-eq"
                      size={20}
                      color="#4F46E5"
                    />
                    <Text style={styles.journalModalAudioText}>Audio memo attached</Text>
                    <TouchableOpacity
                      onPress={() => setAudioUri(null)}
                      style={styles.journalModalRemoveButton}
                    >
                      <IconSymbol
                        ios_icon_name="xmark.circle.fill"
                        android_material_icon_name="cancel"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Journal Modal Actions */}
              <View style={styles.journalModalActions}>
                <TouchableOpacity onPress={pickImage} style={styles.journalModalActionButton}>
                  <IconSymbol
                    ios_icon_name="camera"
                    android_material_icon_name="camera-alt"
                    size={24}
                    color="#4F46E5"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  style={[
                    styles.journalModalActionButton,
                    isRecording && styles.journalModalRecordingButton,
                  ]}
                >
                  <IconSymbol
                    ios_icon_name={isRecording ? "stop.circle" : "mic"}
                    android_material_icon_name={isRecording ? "stop" : "mic"}
                    size={24}
                    color={isRecording ? "#EF4444" : "#4F46E5"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={closeJournalModal}
                  style={styles.journalModalDoneButton}
                >
                  <Text style={styles.journalModalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              {isSaving && (
                <View style={styles.journalModalSaving}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={styles.journalModalSavingText}>Auto-saving...</Text>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </LinearGradient>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  limitBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  limitBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
  },
  affirmationsScroll: {
    paddingRight: 20,
  },
  affirmationCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginRight: AFFIRMATION_CARD_MARGIN,
    width: AFFIRMATION_CARD_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  affirmationCardFirst: {
    marginLeft: 0,
  },
  affirmationHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  iconButton: {
    padding: 4,
  },
  affirmationText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 28,
    marginBottom: 20,
    textAlign: "left",
    minHeight: 84,
  },
  affirmationActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  generateButton: {
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
  habitsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  habitCounter: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  habitCounterText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  habitsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  habitCheckbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  habitTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  habitTitleCompleted: {
    color: "#6B7280",
  },
  journalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  journalDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  journalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  journalPreview: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  journalPhotoPreview: {
    marginTop: 12,
  },
  journalPhotoThumbnail: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },
  journalAudioPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  journalAudioText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  journalModalContainer: {
    flex: 1,
  },
  journalModalWhiteBackground: {
    flex: 1,
    backgroundColor: "white",
  },
  journalModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  journalModalClose: {
    padding: 4,
  },
  journalModalTitleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginHorizontal: 12,
  },
  journalModalDateStamp: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  journalModalDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  journalModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  journalModalInput: {
    flex: 1,
    fontSize: 18,
    color: "#1F2937",
    lineHeight: 28,
    textAlignVertical: "top",
  },
  journalModalPhotoPreview: {
    marginTop: 16,
    position: "relative",
  },
  journalModalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  journalModalRemoveButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  journalModalAudioPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  journalModalAudioText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  journalModalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "android" ? 20 : 40,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  journalModalActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  journalModalRecordingButton: {
    backgroundColor: "#FEE2E2",
  },
  journalModalDoneButton: {
    flex: 1,
    marginLeft: 16,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  journalModalDoneText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  journalModalSaving: {
    position: "absolute",
    top: Platform.OS === "android" ? 100 : 120,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  journalModalSavingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
});
