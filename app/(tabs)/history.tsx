
import { IconSymbol } from "@/components/IconSymbol";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect } from "react";

interface HistoryEntry {
  id: string;
  content: string;
  photoUrl?: string;
  createdAt: string;
  affirmation?: string;
}

interface Affirmation {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: string;
}

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<"journal" | "affirmations" | "favorites">("journal");
  const [journalEntries, setJournalEntries] = useState<HistoryEntry[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [favorites, setFavorites] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, [activeTab]);

  const loadHistory = async () => {
    if (!isBackendConfigured()) {
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "journal") {
        const response = await authenticatedApiCall("/api/journal-entries?limit=50");
        setJournalEntries(response.entries || []);
      } else if (activeTab === "affirmations") {
        const response = await authenticatedApiCall("/api/affirmations?limit=50");
        setAffirmations(response.affirmations || []);
      } else if (activeTab === "favorites") {
        const response = await authenticatedApiCall("/api/affirmations/favorites");
        setFavorites(response.affirmations || []);
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

  const toggleFavorite = async (affirmationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await authenticatedApiCall(`/api/affirmations/${affirmationId}/favorite`, {
        method: "POST",
      });
      loadHistory();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <LinearGradient colors={["#4B0082", "#87CEEB"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "journal" && styles.activeTab]}
          onPress={() => setActiveTab("journal")}
        >
          <Text style={[styles.tabText, activeTab === "journal" && styles.activeTabText]}>
            Journal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "affirmations" && styles.activeTab]}
          onPress={() => setActiveTab("affirmations")}
        >
          <Text style={[styles.tabText, activeTab === "affirmations" && styles.activeTabText]}>
            Affirmations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => setActiveTab("favorites")}
        >
          <Text style={[styles.tabText, activeTab === "favorites" && styles.activeTabText]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === "journal" && (
            <>
              {journalEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="book.closed" size={48} color="#FFF" />
                  <Text style={styles.emptyText}>No journal entries yet</Text>
                  <Text style={styles.emptySubtext}>Start writing to see your history</Text>
                </View>
              ) : (
                journalEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    onPress={() => router.push(`/entry/${entry.id}`)}
                  >
                    <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                    <Text style={styles.entryContent} numberOfLines={3}>
                      {entry.content}
                    </Text>
                    {entry.photoUrl && (
                      <View style={styles.photoIndicator}>
                        <IconSymbol name="photo" size={16} color="#999" />
                        <Text style={styles.photoText}>Has photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {activeTab === "affirmations" && (
            <>
              {affirmations.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="sparkles" size={48} color="#FFF" />
                  <Text style={styles.emptyText}>No affirmations yet</Text>
                  <Text style={styles.emptySubtext}>Generate or add custom affirmations</Text>
                </View>
              ) : (
                affirmations.map((affirmation) => (
                  <View key={affirmation.id} style={styles.affirmationCard}>
                    <View style={styles.affirmationHeader}>
                      <Text style={styles.affirmationDate}>{formatDate(affirmation.createdAt)}</Text>
                      <TouchableOpacity onPress={() => toggleFavorite(affirmation.id)}>
                        <IconSymbol
                          name={affirmation.isFavorite ? "star.fill" : "star"}
                          size={24}
                          color={affirmation.isFavorite ? "#FFD700" : "#999"}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.affirmationText}>{affirmation.text}</Text>
                    {affirmation.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === "favorites" && (
            <>
              {favorites.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="star" size={48} color="#FFF" />
                  <Text style={styles.emptyText}>No favorites yet</Text>
                  <Text style={styles.emptySubtext}>Star affirmations to save them here</Text>
                </View>
              ) : (
                favorites.map((affirmation) => (
                  <View key={affirmation.id} style={styles.affirmationCard}>
                    <View style={styles.affirmationHeader}>
                      <Text style={styles.affirmationDate}>{formatDate(affirmation.createdAt)}</Text>
                      <TouchableOpacity onPress={() => toggleFavorite(affirmation.id)}>
                        <IconSymbol name="star.fill" size={24} color="#FFD700" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.affirmationText}>{affirmation.text}</Text>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  activeTabText: {
    color: "#4B0082",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    color: "#FFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  entryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  photoIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  photoText: {
    fontSize: 12,
    color: "#999",
  },
  affirmationCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  affirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  affirmationDate: {
    fontSize: 12,
    color: "#999",
  },
  affirmationText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  customBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#4B0082",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  customBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
});
