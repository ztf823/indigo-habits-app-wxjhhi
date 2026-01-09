
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { BACKEND_URL } from "@/utils/api";
import { useRouter } from "expo-router";

interface HistoryEntry {
  id: string;
  date: string;
  affirmation: string;
  habits: { name: string; completed: boolean }[];
  snippet: string;
}

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/journal-entries`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries.map((entry: any) => ({
          id: entry.id,
          date: entry.createdAt,
          affirmation: entry.affirmation || "No affirmation",
          habits: entry.habits || [],
          snippet: entry.content.substring(0, 100) + "...",
        })));
      }
    } catch (error) {
      console.error("Error loading history:", error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        <Text style={styles.title}>History</Text>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="book" android_material_icon_name="menu_book" size={64} color="#FFFFFF" />
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Start journaling to see your history</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => viewEntry(entry.id)}
            >
              <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
              
              <View style={styles.affirmationSection}>
                <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto_awesome" size={16} color="#F59E0B" />
                <Text style={styles.affirmationText}>{entry.affirmation}</Text>
              </View>

              <View style={styles.habitsSection}>
                {entry.habits.map((habit, index) => (
                  <View key={index} style={styles.habitItem}>
                    <IconSymbol
                      ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                      android_material_icon_name={habit.completed ? "check_circle" : "cancel"}
                      size={16}
                      color={habit.completed ? "#10B981" : "#EF4444"}
                    />
                    <Text style={styles.habitName}>{habit.name}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.entrySnippet}>{entry.snippet}</Text>

              <View style={styles.viewMore}>
                <Text style={styles.viewMoreText}>View Full Entry</Text>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={16} color="#4F46E5" />
              </View>
            </TouchableOpacity>
          ))
        )}
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 8,
  },
  entryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    marginBottom: 12,
  },
  affirmationSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
  },
  affirmationText: {
    fontSize: 14,
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
  },
  habitsSection: {
    marginBottom: 12,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  habitName: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  entrySnippet: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
    marginBottom: 12,
  },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    marginRight: 4,
  },
});
