
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BACKEND_URL } from "@/utils/api";
import React, { useState, useEffect } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    try {
      setError(null);
      // TODO: Backend Integration - Fetch entry details from /api/journal/entries/:id
      const response = await fetch(`${BACKEND_URL}/journal/entries/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEntry(data);
    } catch (error) {
      console.error('Error loading entry:', error);
      setError('Failed to load entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#4F46E5', '#06B6D4']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <IconSymbol 
                  ios_icon_name="chevron.left" 
                  android_material_icon_name="arrow-back" 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Entry Details</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </>
    );
  }

  if (error || !entry) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#4F46E5', '#06B6D4']} style={styles.container}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <IconSymbol 
                  ios_icon_name="chevron.left" 
                  android_material_icon_name="arrow-back" 
                  size={24} 
                  color="#fff" 
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Entry Details</Text>
              <View style={{ width: 24 }} />
            </View>
            <View style={styles.errorContainer}>
              <IconSymbol
                ios_icon_name="exclamationmark.triangle"
                android_material_icon_name="error"
                size={64}
                color="rgba(255, 255, 255, 0.5)"
              />
              <Text style={styles.errorText}>{error || 'Entry not found'}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={loadEntry}
                activeOpacity={0.7}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <IconSymbol 
                ios_icon_name="chevron.left" 
                android_material_icon_name="arrow-back" 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Entry Details</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.date}>{formatDate(entry.createdAt)}</Text>
            <Text style={styles.affirmation}>{entry.affirmation}</Text>
            {entry.photoUrl && (
              <Image source={{ uri: entry.photoUrl }} style={styles.photo} />
            )}
            <Text style={styles.content}>{entry.content}</Text>
            <View style={styles.habitsSection}>
              <Text style={styles.habitsTitle}>Habits</Text>
              {entry.habits.map((habit, index) => (
                <View key={index} style={styles.habitRow}>
                  <IconSymbol
                    ios_icon_name={habit.completed ? "checkmark.circle.fill" : "xmark.circle.fill"}
                    android_material_icon_name={habit.completed ? "check-circle" : "cancel"}
                    size={24}
                    color={habit.completed ? "#10B981" : "#EF4444"}
                  />
                  <Text style={styles.habitName}>{habit.name}</Text>
                </View>
              ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  date: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
  },
  affirmation: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 24,
  },
  habitsSection: {
    marginBottom: 24,
  },
  habitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    color: '#fff',
  },
});
