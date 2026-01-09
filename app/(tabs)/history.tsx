
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import { API_URL } from "@/utils/api";

interface HistoryEntry {
  id: string;
  date: string;
  affirmation: string;
  habits: { name: string; completed: boolean }[];
  snippet: string;
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/journal-entries?limit=50`);
      const data = await response.json();
      
      // Transform entries to include affirmation and habits
      const transformedEntries = data.entries.map((entry: any) => ({
        id: entry.id,
        date: new Date(entry.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        affirmation: entry.affirmation || "No affirmation",
        habits: entry.habits || [],
        snippet: entry.content.substring(0, 100) + (entry.content.length > 100 ? "..." : ""),
      }));
      
      setEntries(transformedEntries);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const viewEntry = (entryId: string) => {
    router.push(`/entry/${entryId}` as any);
  };

  if (loading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7DD3FC"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" color="#fff" />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7DD3FC"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol ios_icon_name="book.closed" android_material_icon_name="book" size={48} color="#fff" />
              <Text style={styles.emptyText}>No entries yet</Text>
              <Text style={styles.emptySubtext}>Start journaling to see your history</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => viewEntry(entry.id)}
                activeOpacity={0.8}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{entry.date}</Text>
                  <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color="#666" />
                </View>

                <View style={styles.affirmationContainer}>
                  <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto-awesome" size={16} color="#4F46E5" />
                  <Text style={styles.affirmationText} numberOfLines={2}>
                    {entry.affirmation}
                  </Text>
                </View>

                {entry.habits.length > 0 && (
                  <View style={styles.habitsContainer}>
                    {entry.habits.map((habit, index) => (
                      <View key={index} style={styles.habitBadge}>
                        <IconSymbol
                          ios_icon_name={habit.completed ? "checkmark.circle.fill" : "circle"}
                          android_material_icon_name={habit.completed ? "check-circle" : "radio-button-unchecked"}
                          size={14}
                          color={habit.completed ? "#10B981" : "#D1D5DB"}
                        />
                        <Text style={[styles.habitName, !habit.completed && styles.habitIncomplete]}>
                          {habit.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.snippetText} numberOfLines={3}>
                  {entry.snippet}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  affirmationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  affirmationText: {
    flex: 1,
    fontSize: 14,
    fontStyle: "italic",
    color: "#4F46E5",
    lineHeight: 20,
  },
  habitsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  habitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  habitName: {
    fontSize: 12,
    color: "#374151",
  },
  habitIncomplete: {
    color: "#9CA3AF",
  },
  snippetText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});
