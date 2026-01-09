
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/components/IconSymbol";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

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
          <View style={styles.avatarContainer}>
            <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account_circle" size={80} color="#4F46E5" />
          </View>
          <Text style={styles.name}>{user?.name || "Welcome!"}</Text>
          <Text style={styles.email}>{user?.email || "Keep building your habits"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Notifications</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Privacy</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <IconSymbol ios_icon_name="questionmark.circle.fill" android_material_icon_name="help" size={24} color="#6B7280" />
            <Text style={styles.settingText}>Help & Support</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.signOutItem]} onPress={handleSignOut}>
            <IconSymbol ios_icon_name="arrow.right.square.fill" android_material_icon_name="logout" size={24} color="#EF4444" />
            <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color="#9CA3AF" />
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
    marginBottom: 16,
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
