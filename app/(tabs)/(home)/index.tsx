
import { IconSymbol } from "@/components/IconSymbol";
import * as ImagePicker from "expo-image-picker";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef } from "react";

interface Affirmation {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite?: boolean;
}

interface Habit {
  id: string;
  title: string;
  completed: boolean;
  color: string;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 80;

export default function HomeScreen() {
  const [selectedAffirmation, setSelectedAffirmation] = useState<Affirmation | null>(null);
  const [dailyAffirmations, setDailyAffirmations] = useState<Affirmation[]>([]);
  const [favorites, setFavorites] = useState<Affirmation[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalText, setJournalText] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customText, setCustomText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // TODO: Backend Integration - Load favorites from API
      const favResponse = await authenticatedApiCall("/api/affirmations/favorites");
      const favData = await favResponse.json();
      setFavorites(favData.affirmations || []);

      // TODO: Backend Integration - Load daily affirmations (backend prioritizes favorites)
      const dailyResponse = await authenticatedApiCall("/api/affirmations?limit=5");
      const dailyData = await dailyResponse.json();
      setDailyAffirmations(dailyData.affirmations || []);

      // TODO: Backend Integration - Load habits from API
      const habitsResponse = await authenticatedApiCall("/api/habits");
      const habitsData = await habitsResponse.json();
      setHabits(habitsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (affirmation: Affirmation) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (affirmation.isFavorite) {
        // TODO: Backend Integration - Remove from favorites via API
        await authenticatedApiCall(`/api/affirmations/${affirmation.id}/favorite`, {
          method: "DELETE",
        });
        setFavorites(favorites.filter(f => f.id !== affirmation.id));
        
        // Update the affirmation in daily list
        setDailyAffirmations(dailyAffirmations.map(a => 
          a.id === affirmation.id ? { ...a, isFavorite: false } : a
        ));
      } else {
        // Add to favorites (check limit)
        if (favorites.length >= 5) {
          Alert.alert("Limit Reached", "Free users can save up to 5 favorites. Upgrade to Pro for unlimited!");
          return;
        }
        
        // TODO: Backend Integration - Add to favorites via API
        await authenticatedApiCall(`/api/affirmations/${affirmation.id}/favorite`, {
          method: "POST",
        });
        
        const updatedAffirmation = { ...affirmation, isFavorite: true };
        setFavorites([...favorites, updatedAffirmation]);
        
        // Update the affirmation in daily list
        setDailyAffirmations(dailyAffirmations.map(a => 
          a.id === affirmation.id ? updatedAffirmation : a
        ));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorites");
    }
  };

  const selectAffirmation = (affirmation: Affirmation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAffirmation(affirmation);
  };

  const generateAffirmation = async () => {
    try {
      setGenerating(true);
      
      // TODO: Backend Integration - Generate affirmation via AI API
      const response = await authenticatedApiCall("/api/affirmations/generate", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await response.json();
      
      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDailyAffirmations([data, ...dailyAffirmations.slice(0, 4)]);
        setSelectedAffirmation(data);
      } else {
        Alert.alert("Limit Reached", data.message || "Free users get 5 generations. Upgrade to Pro!");
      }
    } catch (error) {
      console.error("Error generating affirmation:", error);
      Alert.alert("Error", "Failed to generate affirmation");
    } finally {
      setGenerating(false);
    }
  };

  const saveCustomAffirmation = async () => {
    if (!customText.trim()) return;

    try {
      // TODO: Backend Integration - Save custom affirmation to API
      const response = await authenticatedApiCall("/api/affirmations/custom", {
        method: "POST",
        body: JSON.stringify({ text: customText.trim() }),
      });
      const data = await response.json();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDailyAffirmations([data, ...dailyAffirmations.slice(0, 4)]);
      setSelectedAffirmation(data);
      setCustomText("");
      setShowCustomModal(false);
    } catch (error) {
      console.error("Error saving custom affirmation:", error);
      Alert.alert("Error", "Failed to save custom affirmation");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const saveJournalEntry = async () => {
    if (!journalText.trim() && !photoUri) {
      Alert.alert("Empty Entry", "Please add some text or a photo");
      return;
    }

    try {
      let uploadedPhotoUrl = null;
      
      if (photoUri) {
        const formData = new FormData();
        formData.append("photo", {
          uri: photoUri,
          type: "image/jpeg",
          name: "journal-photo.jpg",
        } as any);

        // TODO: Backend Integration - Upload photo to storage
        const uploadResponse = await authenticatedApiCall("/api/upload/photo", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        uploadedPhotoUrl = uploadData.url;
      }

      // TODO: Backend Integration - Save journal entry to API
      await authenticatedApiCall("/api/journal-entries", {
        method: "POST",
        body: JSON.stringify({
          content: journalText,
          photoUrl: uploadedPhotoUrl,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Journal entry saved!");
      setJournalText("");
      setPhotoUri(null);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      Alert.alert("Error", "Failed to save journal entry");
    }
  };

  const renderAffirmationCard = ({ item, index }: { item: Affirmation; index: number }) => {
    const isSelected = selectedAffirmation?.id === item.id;
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => selectAffirmation(item)}
        style={[styles.affirmationCard, isSelected && styles.selectedCard]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Daily Affirmation {index + 1}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <IconSymbol
              ios_icon_name={item.isFavorite ? "star.fill" : "star"}
              android_material_icon_name={item.isFavorite ? "star" : "star-border"}
              size={20}
              color={item.isFavorite ? "#FFD700" : "#999"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.affirmationText}>{item.text}</Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check-circle"
              size={16} 
              color="#4CAF50" 
            />
            <Text style={styles.selectedText}>Selected for today</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#4A148C", "#1E88E5"]} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4A148C", "#1E88E5"]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("en-US", { 
              weekday: "long", 
              month: "long", 
              day: "numeric" 
            })}
          </Text>
          <TouchableOpacity onPress={() => setShowFavoritesModal(true)}>
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={24} 
              color="#FFD700" 
            />
          </TouchableOpacity>
        </View>

        {/* Daily Affirmations Carousel */}
        <View style={styles.affirmationsSection}>
          <Text style={styles.sectionTitle}>Your Affirmations Today</Text>
          
          {dailyAffirmations.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={dailyAffirmations}
                renderItem={renderAffirmationCard}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContainer}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
                  setCurrentIndex(index);
                }}
              />
              
              {/* Pagination Dots */}
              <View style={styles.pagination}>
                {dailyAffirmations.map((_, index) => (
                  <View
                    key={index}
                    style={[styles.dot, currentIndex === index && styles.activeDot]}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No affirmations yet. Generate or add a custom one to get started!
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowCustomModal(true)}
            >
              <IconSymbol 
                ios_icon_name="plus.circle" 
                android_material_icon_name="add-circle" 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>Add Custom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, generating && styles.disabledButton]}
              onPress={generateAffirmation}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <IconSymbol 
                    ios_icon_name="sparkles" 
                    android_material_icon_name="auto-awesome" 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.actionButtonText}>Generate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Journal Entry */}
        <View style={styles.journalSection}>
          <TextInput
            style={styles.journalInput}
            placeholder="How are you feeling today?"
            placeholderTextColor="#999"
            multiline
            value={journalText}
            onChangeText={setJournalText}
          />
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.journalPhoto} />
          )}
          <View style={styles.journalActions}>
            <TouchableOpacity onPress={pickImage}>
              <IconSymbol 
                ios_icon_name="camera" 
                android_material_icon_name="camera-alt" 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveJournalEntry}>
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Favorites Modal */}
      <Modal
        visible={showFavoritesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Favorite Affirmations ({favorites.length}/5)
              </Text>
              <TouchableOpacity onPress={() => setShowFavoritesModal(false)}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.favoritesList}>
              {favorites.length === 0 ? (
                <Text style={styles.emptyText}>
                  No favorites yet. Tap the star on any affirmation to save it!
                </Text>
              ) : (
                favorites.map((fav) => (
                  <TouchableOpacity
                    key={fav.id}
                    style={styles.favoriteItem}
                    onPress={() => {
                      selectAffirmation(fav);
                      setShowFavoritesModal(false);
                    }}
                  >
                    <Text style={styles.favoriteText}>{fav.text}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite(fav)}>
                      <IconSymbol 
                        ios_icon_name="star.fill" 
                        android_material_icon_name="star" 
                        size={20} 
                        color="#FFD700" 
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Affirmation Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Affirmation</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.customInput}
              placeholder="Enter your affirmation..."
              placeholderTextColor="#999"
              multiline
              value={customText}
              onChangeText={setCustomText}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.saveCustomButton, !customText.trim() && styles.disabledButton]}
              onPress={saveCustomAffirmation}
              disabled={!customText.trim()}
            >
              <Text style={styles.saveButtonText}>Save Affirmation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  date: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  affirmationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },
  affirmationCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  affirmationText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontWeight: "500",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  selectedText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 6,
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 24,
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  journalSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 100,
  },
  journalInput: {
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    textAlignVertical: "top",
  },
  journalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  journalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: "#4A148C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  favoritesList: {
    maxHeight: 400,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  favoriteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 12,
  },
  favoriteText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 12,
  },
  customInput: {
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveCustomButton: {
    backgroundColor: "#4A148C",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
});
