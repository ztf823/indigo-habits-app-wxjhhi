
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { BACKEND_URL } from "@/utils/api";

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
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    try {
      // TODO: Backend Integration - Fetch entry details from /api/journal-entries/:id
      const response = await fetch(`${BACKEND_URL}/api/journal-entries/${id}`);
      const data = await response.json();
      
      setEntry({
        id: data.id,
        content: data.content,
        affirmation: data.affirmation || "No affirmation",
        photoUrl: data.photoUrl,
        habits: data.habits || [],
        createdAt: data.createdAt,
      });
    } catch (error) {
      console.error("Failed to load entry:", error);
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
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Entry",
            headerBackTitle: "Back",
          }}
        />
        <LinearGradient colors={["#4F46E5", "#7DD3FC"]} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <ActivityIndicator size="large" color="#fff" />
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  if (!entry) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: "Entry",
            headerBackTitle: "Back",
          }}
        />
        <LinearGradient colors={["#4F46E5", "#7DD3FC"]} style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Entry not found</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: formatDate(entry.createdAt),
          headerBackTitle: "Back",
        }}
      />
      <LinearGradient colors={["#4F46E5", "#7DD3FC"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Affirmation Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color="#4F46E5"
                />
                <Text style={styles.sectionTitle}>Affirmation</Text>
              </View>
              <View style={styles.affirmationBox}>
                <Text style={styles.affirmationText}>{entry.affirmation}</Text>
              </View>
            </View>

            {/* Habits Section */}
            {entry.habits.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle"
                    android_material_icon_name="check-circle"
                    size={20}
                    color="#10B981"
                  />
                  <Text style={styles.sectionTitle}>Habits</Text>
                </View>
                <View style={styles.habitsContainer}>
                  {entry.habits.map((habit, index) => (
                    <View key={index} style={styles.habitItem}>
                      <IconSymbol
                        ios_icon_name={
                          habit.completed ? "checkmark.circle.fill" : "circle"
                        }
                        android_material_icon_name={
                          habit.completed ? "check-circle" : "radio-button-unchecked"
                        }
                        size={20}
                        color={habit.completed ? "#10B981" : "#D1D5DB"}
                      />
                      <Text
                        style={[
                          styles.habitName,
                          !habit.completed && styles.habitIncomplete,
                        ]}
                      >
                        {habit.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Photo Section */}
            {entry.photoUrl && (
              <View style={styles.section}>
                <Image source={{ uri: entry.photoUrl }} style={styles.photo} />
              </View>
            )}

            {/* Journal Entry Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconSymbol
                  ios_icon_name="book.closed"
                  android_material_icon_name="book"
                  size={20}
                  color="#6B7280"
                />
                <Text style={styles.sectionTitle}>Journal Entry</Text>
              </View>
              <View style={styles.contentBox}>
                <Text style={styles.contentText}>{entry.content}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  affirmationBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  affirmationText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#4F46E5",
    lineHeight: 24,
  },
  habitsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  habitName: {
    fontSize: 15,
    color: "#374151",
  },
  habitIncomplete: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  photo: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  contentBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  contentText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
  },
});
