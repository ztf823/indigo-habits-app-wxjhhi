
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";

interface HistoryEntry {
  id: string;
  content: string;
  photoUrl?: string;
  createdAt: string;
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkBackendAndLoadHistory();
  }, []);

  const checkBackendAndLoadHistory = async () => {
    setIsLoading(true);
    
    if (!isBackendConfigured()) {
      console.log("[History] Backend not configured, using demo data");
      setBackendReady(false);
      loadDemoData();
      setIsLoading(false);
      return;
    }

    setBackendReady(true);
    await loadHistory();
    setIsLoading(false);
  };

  const loadDemoData = () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    setEntries([
      {
        id: "demo-1",
        content: "Today was a great day! I completed all my habits and felt really productive. Looking forward to tomorrow.",
        createdAt: now.toISOString(),
      },
      {
        id: "demo-2",
        content: "Had a challenging day but managed to stay on track with my morning meditation. Small wins matter!",
        createdAt: yesterday.toISOString(),
      },
      {
        id: "demo-3",
        content: "Feeling grateful for the progress I've made this week. Consistency is key!",
        createdAt: twoDaysAgo.toISOString(),
      },
    ]);
  };

  const loadHistory = async () => {
    try {
      console.log("[History] Loading history from backend...");
      
      // TODO: Backend Integration - Load journal entries from /api/journal-entries
      const data = await authenticatedApiCall("/api/journal-entries");
      
      if (Array.isArray(data)) {
        setEntries(data);
        console.log("[History] Loaded", data.length, "entries");
      }
    } catch (error: any) {
      console.error("[History] Error loading history:", error);
      
      if (error.message?.includes("Backend URL not configured")) {
        loadDemoData();
      }
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const viewEntry = (entryId: string) => {
    if (!backendReady) {
      console.log("[History] Demo mode: Entry viewing not available");
      return;
    }
    router.push(`/entry/${entryId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#87CEEB"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
        {/* Backend Status Banner */}
        {!backendReady && (
          <View style={styles.demoBanner}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color="#F59E0B"
            />
            <Text style={styles.demoBannerText}>
              Demo Mode - Showing sample journal entries
            </Text>
          </View>
        )}

        <Text style={styles.title}>Journal History</Text>
        <Text style={styles.subtitle}>
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </Text>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="book"
              android_material_icon_name="menu-book"
              size={64}
              color="#FFF"
            />
            <Text style={styles.emptyStateText}>No entries yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start journaling to see your history here
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => viewEntry(entry.id)}
                disabled={!backendReady}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  {entry.photoUrl && (
                    <IconSymbol
                      ios_icon_name="photo"
                      android_material_icon_name="image"
                      size={20}
                      color="#9CA3AF"
                    />
                  )}
                </View>
                <Text style={styles.entryContent} numberOfLines={3}>
                  {entry.content}
                </Text>
                {backendReady && (
                  <View style={styles.entryFooter}>
                    <Text style={styles.viewMore}>View full entry</Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron-right"
                      size={16}
                      color="#4F46E5"
                    />
                  </View>
                )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  demoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#E0E7FF",
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFF",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#E0E7FF",
    marginTop: 8,
    textAlign: "center",
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: "#4F46E5",
  },
  entryContent: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  entryFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  viewMore: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4F46E5",
  },
});
