import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/styles/commonStyles";
import { getJournalEntryById, isDatabaseReady } from "@/utils/database";

interface EntryDetail {
  id: string;
  content: string;
  photoUri?: string | null;
  audioUri?: string | null;
  affirmationText?: string | null;
  createdAt?: string | null;
  date: string;
  isFavorite?: number;
}

export default function EntryDetailScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const entryId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadEntry = useCallback(async () => {
    if (!entryId) {
      setEntry(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadFailed(false);
    try {
      const localEntry = await getJournalEntryById(entryId);
      if (!localEntry && !isDatabaseReady()) {
        throw new Error("Local journal database is unavailable");
      }
      setEntry((localEntry as EntryDetail | null) ?? null);
    } catch (error) {
      console.error("[JournalEntry] Error loading local entry:", error);
      setEntry(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  const goBackToHistory = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/history" as any);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    const normalized = dateString.includes("T")
      ? dateString
      : dateString.includes(" ")
        ? `${dateString.replace(" ", "T")}Z`
        : `${dateString}T12:00:00`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!entry) {
    return (
      <LinearGradient
        colors={isDark ? [themeColors.gradientStart, themeColors.gradientEnd] : ["#5B70D5", "#1455D9", "#23B9EB"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <Stack.Screen options={{ title: "Journal Entry", headerShown: false }} />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: themeColors.text }]}>
              {loadFailed ? "Couldn’t load this entry" : "Entry not found"}
            </Text>
            <Text style={[styles.errorMessage, { color: themeColors.textSecondary }]}>
              {loadFailed
                ? "Your journal entry is saved on this device. Please try again."
                : "This journal entry isn’t available on this device."}
            </Text>
            {loadFailed && (
              <TouchableOpacity onPress={loadEntry} style={styles.retryButton} accessibilityRole="button">
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={goBackToHistory} style={styles.returnButton} accessibilityRole="button">
              <Text style={styles.returnText}>Back to History</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? [themeColors.gradientStart, themeColors.gradientEnd] : ["#5B70D5", "#1455D9", "#23B9EB"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Journal Entry", headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBackToHistory}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to History"
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Journal Entry</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: themeColors.card }]}>
            <Text style={styles.date}>{formatDate(entry.date || entry.createdAt)}</Text>
            {entry.photoUri && (
              <Image source={{ uri: entry.photoUri }} style={styles.photo} />
            )}
            <Text style={[styles.content, { color: themeColors.text }]}>{entry.content}</Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: "#5145E5",
    marginBottom: 10,
  },
  retryText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  returnButton: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  returnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  date: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
    marginBottom: 16,
  },
  photo: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
});
