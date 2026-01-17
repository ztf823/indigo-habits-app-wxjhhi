
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { getProfile, updateProfile, clearAllData } from "@/utils/database";
import { exportJournalsToPdf, getExportPreview } from "@/utils/pdfExport";

export default function ProfileScreen() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Habit Builder");
  const [userEmail, setUserEmail] = useState<string>("Keep building your habits");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("[Profile] Loading profile data from SQLite...");
      
      // Load profile data from database
      const profile = await getProfile();
      
      if (profile) {
        if ((profile as any).photoUri) {
          setProfileImage((profile as any).photoUri);
          console.log("[Profile] Loaded profile image from database");
        }
        
        if ((profile as any).name) {
          setUserName((profile as any).name);
          console.log("[Profile] Loaded user name from database:", (profile as any).name);
        }
        
        if ((profile as any).email) {
          setUserEmail((profile as any).email);
          console.log("[Profile] Loaded user email from database:", (profile as any).email);
        }

        setHasPremium((profile as any).isPremium === 1);
        console.log("[Profile] Premium status:", (profile as any).isPremium === 1);
      }
    } catch (error) {
      console.error("[Profile] Error loading profile data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handlePickImage = async () => {
    try {
      console.log("[Profile] User tapped change photo button");
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to upload a profile picture."
        );
        return;
      }

      // Launch image picker with editing enabled for crop/resize
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1], // Square crop for profile picture
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log("[Profile] Image selected:", imageUri);
        await saveProfilePicture(imageUri);
      }
    } catch (error) {
      console.error("[Profile] Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const saveProfilePicture = async (imageUri: string) => {
    try {
      setIsUploadingImage(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Save to database
      await updateProfile({ photoUri: imageUri });
      setProfileImage(imageUri);
      
      console.log("[Profile] Profile picture saved to database");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("[Profile] Error saving profile picture:", error);
      Alert.alert("Error", "Failed to save profile picture. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditName = () => {
    console.log("[Profile] User tapped edit name");
    Alert.prompt(
      "Edit Name",
      "Enter your name:",
      async (text) => {
        if (text && text.trim()) {
          try {
            await updateProfile({ name: text.trim() });
            setUserName(text.trim());
            console.log("[Profile] User name updated:", text.trim());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            console.error("[Profile] Error saving name:", error);
            Alert.alert("Error", "Failed to save name. Please try again.");
          }
        }
      },
      "plain-text",
      userName
    );
  };

  const handleEditEmail = () => {
    console.log("[Profile] User tapped edit email");
    Alert.prompt(
      "Edit Email",
      "Enter your email:",
      async (text) => {
        if (text && text.trim()) {
          try {
            await updateProfile({ email: text.trim() });
            setUserEmail(text.trim());
            console.log("[Profile] User email updated:", text.trim());
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            console.error("[Profile] Error saving email:", error);
            Alert.alert("Error", "Failed to save email. Please try again.");
          }
        }
      },
      "plain-text",
      userEmail
    );
  };

  const handleUnlockPremium = async () => {
    console.log("[Profile] User tapped Unlock Premium button");
    
    Alert.alert(
      "Unlock Premium",
      "Get unlimited affirmations and habits for just $5.99/month!\n\n✓ Unlimited daily affirmations\n✓ Unlimited daily habits\n✓ All future features included",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe $5.99/month",
          onPress: async () => {
            try {
              console.log("[Profile] Processing subscription...");
              
              // Simulate successful purchase for now
              await updateProfile({ isPremium: true });
              setHasPremium(true);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                "Welcome to Premium!",
                "You now have unlimited access to all affirmations and habits. Thank you for your support!",
                [{ text: "Awesome!" }]
              );
              
              console.log("[Profile] Premium subscription activated");
            } catch (error) {
              console.error("[Profile] Error processing subscription:", error);
              Alert.alert("Error", "Failed to process subscription. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    console.log("[Profile] User tapped Restore Purchases");
    
    try {
      // Check database for existing premium status
      const profile = await getProfile();
      
      if (profile && (profile as any).isPremium === 1) {
        setHasPremium(true);
        Alert.alert("Success", "Premium subscription restored!");
      } else {
        Alert.alert("No Purchases Found", "You don't have any active subscriptions to restore.");
      }
    } catch (error) {
      console.error("[Profile] Error restoring purchases:", error);
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
  };

  const handleExportJournals = async () => {
    try {
      console.log("[Profile] User tapped Export All Journals button");
      
      // Get preview of what will be exported
      const preview = await getExportPreview();
      
      if (preview.totalEntries === 0) {
        Alert.alert(
          "No Journal Entries",
          "You don't have any journal entries to export yet. Start journaling to build your collection!",
          [{ text: "OK" }]
        );
        return;
      }

      // Show confirmation with preview
      Alert.alert(
        "Export All Journals",
        `Ready to export ${preview.totalEntries} journal ${preview.totalEntries === 1 ? 'entry' : 'entries'} to PDF.\n\n` +
        `📷 ${preview.totalPhotos} ${preview.totalPhotos === 1 ? 'photo' : 'photos'}\n` +
        `🎤 ${preview.totalAudioMemos} voice ${preview.totalAudioMemos === 1 ? 'memo' : 'memos'}\n\n` +
        `Your journal will be bundled into one clean PDF file that you can save, email, or share.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Export PDF",
            onPress: async () => {
              try {
                setIsExporting(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                
                console.log("[Profile] Starting PDF export...");
                await exportJournalsToPdf();
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                console.log("[Profile] Journal export completed successfully");
              } catch (error) {
                console.error("[Profile] Error exporting journals:", error);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                
                Alert.alert(
                  "Export Failed",
                  "Failed to export your journals. Please try again.",
                  [{ text: "OK" }]
                );
              } finally {
                setIsExporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("[Profile] Error preparing journal export:", error);
      Alert.alert("Error", "Failed to prepare journal export. Please try again.");
    }
  };

  const handleClearData = () => {
    console.log("[Profile] User tapped clear data");
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all your data? This will reset the app to its initial state. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("[Profile] Clearing all app data");
              
              // Clear all database data
              await clearAllData();
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Success", "All data has been cleared. The app will now restart.", [
                {
                  text: "OK",
                  onPress: () => {
                    // Reset state
                    setProfileImage(null);
                    setUserName("Habit Builder");
                    setUserEmail("Keep building your habits");
                    setHasPremium(false);
                    
                    // Navigate back to home
                    router.replace("/(tabs)/(home)/");
                  },
                },
              ]);
            } catch (error) {
              console.error("[Profile] Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleNotifications = () => {
    console.log("[Profile] User tapped notifications");
    Alert.alert(
      "Notifications",
      "Notification settings will be available in a future update. Stay tuned!",
      [{ text: "OK" }]
    );
  };

  const handlePrivacy = () => {
    console.log("[Profile] User tapped privacy");
    Alert.alert(
      "Privacy",
      "Your data is stored locally on your device and is never shared with third parties. We respect your privacy.",
      [{ text: "OK" }]
    );
  };

  const handleHelp = () => {
    console.log("[Profile] User tapped help");
    Alert.alert(
      "Help & Support",
      "Welcome to Indigo Habits!\n\n• Add daily affirmations to stay motivated\n• Track your habits and build streaks\n• Journal your thoughts and experiences\n• View your progress over time\n\nNeed more help? Contact us at support@indigohabits.com",
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#4F46E5", "#7C3AED", "#06B6D4"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={isUploadingImage}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol 
                  ios_icon_name="person.circle.fill" 
                  android_material_icon_name="account-circle" 
                  size={80} 
                  color="#4F46E5" 
                />
              </View>
            )}
            
            {/* Upload overlay */}
            <View style={styles.avatarOverlay}>
              {isUploadingImage ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera-alt"
                  size={24}
                  color="#FFF"
                />
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.uploadHint}>Tap to change photo</Text>
          
          <TouchableOpacity onPress={handleEditName} style={styles.editableField}>
            <Text style={styles.name}>{userName}</Text>
            <IconSymbol 
              ios_icon_name="pencil" 
              android_material_icon_name="edit" 
              size={16} 
              color="#6B7280" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleEditEmail} style={styles.editableField}>
            <Text style={styles.email}>{userEmail}</Text>
            <IconSymbol 
              ios_icon_name="pencil" 
              android_material_icon_name="edit" 
              size={16} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>

          {/* Premium Status Badge */}
          {hasPremium && (
            <View style={styles.premiumBadge}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace-premium"
                size={20}
                color="#FFD700"
              />
              <Text style={styles.premiumBadgeText}>Premium Member</Text>
            </View>
          )}
        </View>

        {/* Premium Unlock Section */}
        {!hasPremium && (
          <View style={styles.premiumCard}>
            <View style={styles.premiumHeader}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace-premium"
                size={32}
                color="#FFD700"
              />
              <Text style={styles.premiumTitle}>Unlock Premium</Text>
            </View>
            <Text style={styles.premiumDescription}>
              Get unlimited affirmations and habits for just $5.99/month
            </Text>
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#10B981"
                />
                <Text style={styles.premiumFeatureText}>Unlimited daily affirmations</Text>
              </View>
              <View style={styles.premiumFeature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#10B981"
                />
                <Text style={styles.premiumFeatureText}>Unlimited daily habits</Text>
              </View>
              <View style={styles.premiumFeature}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color="#10B981"
                />
                <Text style={styles.premiumFeatureText}>All future features included</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.premiumButton} onPress={handleUnlockPremium}>
              <Text style={styles.premiumButtonText}>Subscribe for $5.99/month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleNotifications}>
            <IconSymbol 
              ios_icon_name="bell.fill" 
              android_material_icon_name="notifications" 
              size={24} 
              color="#6B7280" 
            />
            <Text style={styles.settingText}>Notifications</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
            <IconSymbol 
              ios_icon_name="lock.fill" 
              android_material_icon_name="lock" 
              size={24} 
              color="#6B7280" 
            />
            <Text style={styles.settingText}>Privacy</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleHelp}>
            <IconSymbol 
              ios_icon_name="questionmark.circle.fill" 
              android_material_icon_name="help" 
              size={24} 
              color="#6B7280" 
            />
            <Text style={styles.settingText}>Help & Support</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]} 
            onPress={handleClearData}
          >
            <IconSymbol 
              ios_icon_name="trash.fill" 
              android_material_icon_name="delete" 
              size={24} 
              color="#EF4444" 
            />
            <Text style={[styles.settingText, styles.dangerText]}>Clear All Data</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>

          {/* Export All Journals Button */}
          <TouchableOpacity 
            style={[styles.settingItem, styles.exportItem]} 
            onPress={handleExportJournals}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description" 
                size={24} 
                color="#4F46E5" 
              />
            )}
            <Text style={[styles.settingText, styles.exportText]}>
              {isExporting ? "Exporting..." : "Export All Journals"}
            </Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Indigo Habits v1.0.0</Text>
          <Text style={styles.footerSubtext}>All data stored locally on your device</Text>
        </View>
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
    color: "#FFFFFF",
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === "android" ? 60 : 60,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  uploadHint: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    fontStyle: "italic",
  },
  editableField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  premiumCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  premiumDescription: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 24,
  },
  premiumFeatures: {
    gap: 12,
    marginBottom: 24,
  },
  premiumFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumFeatureText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  premiumButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  premiumButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 12,
  },
  dangerItem: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  dangerText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  exportItem: {
    borderWidth: 2,
    borderColor: "#4F46E5",
    backgroundColor: "rgba(79, 70, 229, 0.05)",
  },
  exportText: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
});
