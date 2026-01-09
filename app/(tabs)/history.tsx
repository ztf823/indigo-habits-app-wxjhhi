
import { authenticatedApiCall } from "@/utils/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";

interface HistoryEntry {
  id: string;
  content: string;
  photoUrl?: string;
  createdAt: string;
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
      const data = await authenticatedApiCall("/api/journal-entries?limit=50");
      setEntries(data.entries);
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#6366F1", "#87CEEB"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Journal History</Text>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol 
              ios_icon_name="book.closed" 
              android_material_icon_name="menu-book" 
              size={64} 
              color="#E0E7FF" 
            />
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start writing to see your history
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => viewEntry(entry.id)}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  {entry.photoUrl && (
                    <IconSymbol 
                      ios_icon_name="photo" 
                      android_material_icon_name="photo" 
                      size={16} 
                      color="#6366F1" 
                    />
                  )}
                </View>
                <Text style={styles.entrySnippet} numberOfLines={3}>
                  {entry.content}
                </Text>
                <View style={styles.entryFooter}>
                  <Text style={styles.readMore}>Read more →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#E0E7FF",
    marginTop: 8,
  },
  entriesList: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    color: "#6366F1",
  },
  entrySnippet: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  entryFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  readMore: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
});
