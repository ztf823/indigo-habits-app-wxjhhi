
import { SafeAreaView } from "react-native-safe-area-context";
import { authenticatedApiCall } from "@/utils/api";
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

interface EntryDetail {
  id: string;
  content: string;
  photoUrl?: string;
  createdAt: string;
}

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEntry = useCallback(async () => {
    try {
      const data = await authenticatedApiCall(`/api/journal-entries/${id}`);
      setEntry(data);
    } catch (error) {
      console.error("Error loading entry:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id, loadEntry]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#6366F1", "#87CEEB"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
          <View style={styles.card}>
            <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
            
            {entry.photoUrl && (
              <Image source={{ uri: entry.photoUrl }} style={styles.photo} />
            )}

            <Text style={styles.content}>{entry.content}</Text>
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
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
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
    backgroundColor: "#FFF",
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
    color: "#1F2937",
    lineHeight: 24,
  },
});
