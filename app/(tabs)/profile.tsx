
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { authenticatedApiCall, isBackendConfigured } from "@/utils/api";
import * as Haptics from "expo-haptics";

export default function ProfileScreen() {
  const { user, signOut, fetchUser } = useAuth();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    // Load existing profile image from user data
    if (user?.image) {
      setProfileImage(user.image);
    }
    
    // Also fetch fresh profile data from backend
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!isBackendConfigured()) return;
    
    try {
      const profileData = await authenticatedApiCall("/api/profile");
      if (profileData.profilePictureUrl) {
        setProfileImage(profileData.profilePictureUrl);
      }
      console.log("[Profile] Profile data loaded");
    } catch (error) {
      console.error("Error loading profile data:", error);
      // Don't show error - user data from auth context is sufficient
    }
  };

  const handlePickImage = async () => {
    try {
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
        await uploadProfilePicture(imageUri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    setIsUploadingImage(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isBackendConfigured()) {
      // Demo mode: Just update locally
      setProfileImage(imageUri);
      setIsUploadingImage(false);
      Alert.alert("Demo Mode", "Profile picture updated locally (won't be saved until backend is ready)");
      return;
    }

    try {
      // Backend Integration: Upload profile picture to backend
      // The backend handles image upload to object storage and returns the URL
      
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      // Don't set Content-Type header - let the browser/fetch set it with proper boundary
      const response = await authenticatedApiCall("/api/profile/picture", {
        method: "POST",
        body: formData,
      });

      if (response.url) {
        setProfileImage(response.url);
        // Refresh user data to get updated profile
        await fetchUser();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", "Failed to upload profile picture. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/auth");
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

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
          
          <Text style={styles.name}>{user?.name || "Welcome!"}</Text>
          <Text style={styles.email}>{user?.email || "Keep building your habits"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Notifications</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Privacy</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol ios_icon_name="questionmark.circle.fill" android_material_icon_name="help" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Help & Support</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.signOutItem]} onPress={handleSignOut}>
            <IconSymbol ios_icon_name="arrow.right.square.fill" android_material_icon_name="logout" size={24} color="#EF4444" />
            <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
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
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
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
  signOutItem: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  signOutText: {
    color: "#EF4444",
    fontWeight: "600",
  },
});
