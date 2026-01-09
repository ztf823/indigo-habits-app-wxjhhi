
import { SafeAreaView } from "react-native-safe-area-context";
import { BACKEND_URL } from "@/utils/api";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

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
      // TODO: Backend Integration - Fetch journal entries from /api/journal/entries
      const response = await fetch(`${BACKEND_URL}/journal/entries`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error loading history:', error);
      // For now, show empty state
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const viewEntry = (entryId: string) => {
    router.push(`/entry/${entryId}`);
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#4F46E5', '#06B6D4']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#4F46E5', '#06B6D4']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <Text style={styles.title}>History</Text>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="book"
                  android_material_icon_name="menu-book"
                  size={64}
                  color="rgba(255, 255, 255, 0.5)"
                />
                <Text style={styles.emptyText}>No journal entries yet</Text>
                <Text style={styles.emptySubtext}>
                  Start writing in your journal to see your history here
                </Text>
              </View>
            ) : (
              entries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.entryCard}
                  onPress={() => viewEntry(entry.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.entryDate}>{entry.date}</Text>
                  <Text style={styles.entryAffirmation}>{entry.affirmation}</Text>
                  <Text style={styles.entrySnippet} numberOfLines={2}>
                    {entry.snippet}
                  </Text>
                  <View style={styles.habitsRow}>
                    {entry.habits.map((habit, index) => (
                      <IconSymbol
                        key={index}
                        ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                        android_material_icon_name={habit.completed ? "check-circle" : "cancel"}
                        size={20}
                        color={habit.completed ? "#10B981" : "#EF4444"}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              ))
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  entryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  entryAffirmation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  entrySnippet: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
  },
  habitsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
