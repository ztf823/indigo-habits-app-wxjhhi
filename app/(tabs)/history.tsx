
import { IconSymbol } from "@/components/IconSymbol";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useCallback } from "react";
import {
  getAllJournalEntries,
  getAllAffirmations,
  getAllHabits,
  updateAffirmation,
  getHabitCompletionsForDate,
} from "@/utils/database";

interface JournalEntry {
  id: string;
  content: string;
  photoUri?: string;
  audioUri?: string;
  createdAt: string;
  affirmationText?: string;
  date: string;
  isFavorite?: number;
}

interface Affirmation {
  id: string;
  text: string;
  isCustom: number;
  isFavorite: number;
  createdAt: string;
}

interface Habit {
  id: string;
  title: string;
  color: string;
}

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<"journal" | "affirmations" | "favorites">("journal");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [favorites, setFavorites] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadHistory = useCallback(async () => {
    try {
      console.log("[History] Loading history for tab:", activeTab);
      
      if (activeTab === "journal") {
        const entries = await getAllJournalEntries() as JournalEntry[];
        setJournalEntries(entries);
        console.log("[History] Loaded", entries.length, "journal entries");
      } else if (activeTab === "affirmations") {
        const allAffirmations = await getAllAffirmations() as Affirmation[];
        setAffirmations(allAffirmations);
        console.log("[History] Loaded", allAffirmations.length, "affirmations");
      } else if (activeTab === "favorites") {
        const allAffirmations = await getAllAffirmations() as Affirmation[];
        const favoriteAffirmations = allAffirmations.filter(a => a.isFavorite === 1);
        setFavorites(favoriteAffirmations);
        console.log("[History] Loaded", favoriteAffirmations.length, "favorites");
      }
    } catch (error) {
      console.error("[History] Error loading history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    console.log("[History] User pulled to refresh");
    setRefreshing(true);
    loadHistory();
  };

  const toggleFavorite = async (affirmationId: string) => {
    console.log("[History] User toggled favorite for affirmation:", affirmationId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const affirmation = [...affirmations, ...favorites].find(a => a.id === affirmationId);
      if (!affirmation) return;
      
      const newFavorite = affirmation.isFavorite === 1 ? 0 : 1;
      await updateAffirmation(affirmationId, { isFavorite: newFavorite === 1 });
      loadHistory();
    } catch (error) {
      console.error("[History] Error toggling favorite:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <LinearGradient
      colors={["#4F46E5", "#87CEEB"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "journal" && styles.activeTab]}
          onPress={() => {
            console.log("[History] User switched to Journal tab");
            setActiveTab("journal");
          }}
        >
          <Text style={[styles.tabText, activeTab === "journal" && styles.activeTabText]}>
            Journal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "affirmations" && styles.activeTab]}
          onPress={() => {
            console.log("[History] User switched to Affirmations tab");
            setActiveTab("affirmations");
          }}
        >
          <Text style={[styles.tabText, activeTab === "affirmations" && styles.activeTabText]}>
            Affirmations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => {
            console.log("[History] User switched to Favorites tab");
            setActiveTab("favorites");
          }}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
        >
          {activeTab === "journal" && (
            <>
              {journalEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="book.closed"
                    android_material_icon_name="menu-book"
                    size={48}
                    color="#FFF"
                  />
                  <Text style={styles.emptyText}>No journal entries yet</Text>
                  <Text style={styles.emptySubtext}>Start writing to see your history</Text>
                </View>
              ) : (
                journalEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.entryCard}
                    onPress={() => {
                      console.log("[History] User tapped journal entry:", entry.id);
                      router.push(`/entry/${entry.id}` as any);
                    }}
                  >
                    <View style={styles.entryHeader}>
                      <View>
                        <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                        <Text style={styles.entryTime}>{formatTime(entry.createdAt)}</Text>
                      </View>
                      {entry.isFavorite === 1 && (
                        <IconSymbol
                          ios_icon_name="star.fill"
                          android_material_icon_name="star"
                          size={20}
                          color="#FFD700"
                        />
                      )}
                    </View>
                    <Text style={styles.entryContent} numberOfLines={3}>
                      {entry.content}
                    </Text>
                    <View style={styles.entryFooter}>
                      {entry.photoUri && (
                        <View style={styles.indicator}>
                          <IconSymbol
                            ios_icon_name="photo"
                            android_material_icon_name="image"
                            size={16}
                            color="#6B7280"
                          />
                          <Text style={styles.indicatorText}>Photo</Text>
                        </View>
                      )}
                      {entry.audioUri && (
                        <View style={styles.indicator}>
                          <IconSymbol
                            ios_icon_name="waveform"
                            android_material_icon_name="graphic-eq"
                            size={16}
                            color="#6B7280"
                          />
                          <Text style={styles.indicatorText}>Audio</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {activeTab === "affirmations" && (
            <>
              {affirmations.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto-awesome"
                    size={48}
                    color="#FFF"
                  />
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
                          ios_icon_name={affirmation.isFavorite === 1 ? "star.fill" : "star"}
                          android_material_icon_name={affirmation.isFavorite === 1 ? "star" : "star-border"}
                          size={24}
                          color={affirmation.isFavorite === 1 ? "#FFD700" : "#C0C0C0"}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.affirmationText}>{affirmation.text}</Text>
                    {affirmation.isCustom === 1 && (
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
                  <IconSymbol
                    ios_icon_name="star"
                    android_material_icon_name="star-border"
                    size={48}
                    color="#FFF"
                  />
                  <Text style={styles.emptyText}>No favorites yet</Text>
                  <Text style={styles.emptySubtext}>Star affirmations to save them here</Text>
                </View>
              ) : (
                favorites.map((affirmation) => (
                  <View key={affirmation.id} style={styles.affirmationCard}>
                    <View style={styles.affirmationHeader}>
                      <Text style={styles.affirmationDate}>{formatDate(affirmation.createdAt)}</Text>
                      <TouchableOpacity onPress={() => toggleFavorite(affirmation.id)}>
                        <IconSymbol
                          ios_icon_name="star.fill"
                          android_material_icon_name="star"
                          size={24}
                          color="#FFD700"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.affirmationText}>{affirmation.text}</Text>
                    {affirmation.isCustom === 1 && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    )}
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
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
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
    color: "#4F46E5",
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
    alignItems: "flex-start",
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  entryTime: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  entryContent: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
    marginBottom: 12,
  },
  entryFooter: {
    flexDirection: "row",
    gap: 12,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  indicatorText: {
    fontSize: 12,
    color: "#6B7280",
  },
  affirmationCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  affirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  affirmationDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  affirmationText: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  customBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  customBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
});
