
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { authenticatedApiCall } from "@/utils/api";

interface EntryDetail {
  id: string;
  content: string;
  affirmation: string;
  photoUrl?: string;
  habits: { name: string; completed: boolean }[];
  createdAt: string;
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entry, setEntry] = useState<EntryDetail | null>(null);

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      console.log("[EntryDetailScreen] Loading entry:", id);
      
      // TODO: Backend Integration - Fetch entry details from /api/journal-entries/:id endpoint
      const response = await authenticatedApiCall(`/api/journal-entries/${id}`, {
        method: "GET",
      });
      
      console.log("[EntryDetailScreen] Entry response:", response);
      
      if (response?.entry) {
        setEntry({
          id: response.entry.id,
          content: response.entry.content,
          affirmation: response.entry.affirmation || "No affirmation",
          photoUrl: response.entry.photoUrl,
          habits: response.entry.habits || [],
          createdAt: response.entry.createdAt,
        });
      }
    } catch (error) {
      console.error("[EntryDetailScreen] Error loading entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Entry Details",
            headerStyle: { backgroundColor: "#4F46E5" },
            headerTintColor: "#FFFFFF",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading entry...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!entry) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Entry Details",
            headerStyle: { backgroundColor: "#4F46E5" },
            headerTintColor: "#FFFFFF",
            headerBackTitle: "Back",
          }}
        />
        <View style={styles.errorContainer}>
          <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="error" size={64} color="#FFFFFF" />
          <Text style={styles.errorText}>Entry not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Entry Details",
          headerStyle: { backgroundColor: "#4F46E5" },
          headerTintColor: "#FFFFFF",
          headerBackTitle: "Back",
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>

          {/* Affirmation Section */}
          <View style={styles.affirmationSection}>
            <View style={styles.affirmationHeader}>
              <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto_awesome" size={20} color="#F59E0B" />
              <Text style={styles.affirmationLabel}>Daily Affirmation</Text>
            </View>
            <Text style={styles.affirmationText}>{entry.affirmation}</Text>
          </View>

          {/* Habits Section */}
          {entry.habits && entry.habits.length > 0 && (
            <View style={styles.habitsSection}>
              <Text style={styles.sectionTitle}>Habits Completed</Text>
              {entry.habits.map((habit, index) => (
                <View key={index} style={styles.habitItem}>
                  <IconSymbol
                    ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                    android_material_icon_name={habit.completed ? "check_circle" : "cancel"}
                    size={20}
                    color={habit.completed ? "#10B981" : "#EF4444"}
                  />
                  <Text style={[styles.habitName, !habit.completed && styles.habitIncomplete]}>
                    {habit.name}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Photo Section */}
          {entry.photoUrl && (
            <View style={styles.photoSection}>
              <Image source={{ uri: entry.photoUrl }} style={styles.photo} />
            </View>
          )}

          {/* Journal Content */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Journal Entry</Text>
            <Text style={styles.content}>{entry.content}</Text>
          </View>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 20,
  },
  affirmationSection: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  affirmationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  affirmationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginLeft: 8,
  },
  affirmationText: {
    fontSize: 16,
    color: "#78350F",
    lineHeight: 24,
  },
  habitsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  habitName: {
    fontSize: 15,
    color: "#1F2937",
    marginLeft: 12,
  },
  habitIncomplete: {
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
  photoSection: {
    marginBottom: 20,
  },
  photo: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  contentSection: {
    marginTop: 8,
  },
  content: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
});
