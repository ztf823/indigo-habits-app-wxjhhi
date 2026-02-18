
import { IconSymbol } from "@/components/IconSymbol";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Platform, Switch } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getProfile, updateProfile, clearAllData } from "@/utils/database";
import { useRouter } from "expo-router";
import { getColors } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { getOfferings, purchasePackage, restorePurchases, getCustomerInfo } from "@/utils/revenueCat";
import { RemindersOverlay } from "@/components/RemindersOverlay";
import { initializeNotifications } from "@/utils/notifications";
import { exportJournalsToPdf, getExportPreview } from "@/utils/pdfExport";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    fontSize: 48,
  },
  changePhotoButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  premiumBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  premiumDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  dangerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    backgroundColor: '#FEE2E2',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showRemindersOverlay, setShowRemindersOverlay] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const profileData = await getProfile();
      setProfile(profileData);
      setIsPremium(profileData?.isPremium === 1);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handlePickImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
    }
  };

  const saveProfilePicture = async (imageUri: string) => {
    try {
      await updateProfile({ profilePicture: imageUri });
      await loadProfileData();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save profile picture:', error);
    }
  };

  const handleEditName = () => {
    console.log('Edit name tapped');
    Alert.alert('Coming Soon', 'Name editing will be available in a future update.');
  };

  const handleEditEmail = () => {
    console.log('Edit email tapped');
    Alert.alert('Coming Soon', 'Email editing will be available in a future update.');
  };

  const handleUnlockPremium = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Unlock premium tapped');
      
      const offerings = await getOfferings();
      if (offerings && offerings.current) {
        const packageToPurchase = offerings.current.availablePackages[0];
        if (packageToPurchase) {
          const purchaseResult = await purchasePackage(packageToPurchase);
          if (purchaseResult) {
            await updateProfile({ isPremium: 1 });
            await loadProfileData();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Premium unlocked! Enjoy unlimited habits and affirmations.');
          }
        }
      }
    } catch (error) {
      console.error('Failed to unlock premium:', error);
      Alert.alert('Error', 'Failed to unlock premium. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('Restore purchases tapped');
      
      const customerInfo = await restorePurchases();
      const hasPremium = customerInfo?.entitlements?.active?.premium !== undefined;
      
      if (hasPremium) {
        await updateProfile({ isPremium: 1 });
        await loadProfileData();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Premium restored successfully!');
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found to restore.');
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleExportJournals = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('Export journals tapped');
      
      const preview = await getExportPreview();
      const pdfUri = await exportJournalsToPdf();
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Exported ${preview.totalEntries} journal entries to PDF!`);
    } catch (error) {
      console.error('Failed to export journals:', error);
      Alert.alert('Error', 'Failed to export journals. Please try again.');
    }
  };



  const handleToggleDarkMode = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your habits, affirmations, and journal entries. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await loadProfileData();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleNotifications = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Notifications tapped');
    
    const hasPermission = await initializeNotifications();
    if (hasPermission) {
      setShowRemindersOverlay(true);
    } else {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to use reminders.'
      );
    }
  };



  const handlePrivacy = () => {
    console.log('Privacy tapped');
    Alert.alert('Privacy Policy', 'Your data is stored locally on your device and is never shared with third parties.');
  };

  const handleHelp = () => {
    console.log('Help tapped');
    Alert.alert('Help & Support', 'For support, please contact us at support@indigohabits.com');
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </LinearGradient>
    );
  }

  const userName = profile?.name || 'User';
  const userEmail = profile?.email || 'user@example.com';
  const profilePicture = profile?.profilePicture;

  return (
    <>
      <LinearGradient colors={[colors.primary, colors.secondary]} style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePickImage}>
              <View style={styles.profileImageContainer}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                ) : (
                  <Text style={styles.profileImagePlaceholder}>👤</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>

          {!isPremium && (
            <View style={styles.section}>
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.premiumCard}
              >
                <View style={styles.premiumBadge}>
                  <IconSymbol ios_icon_name="star.fill" android_material_icon_name="star" size={24} color="#FFFFFF" />
                  <Text style={styles.premiumBadgeText}>Unlock Premium</Text>
                </View>
                <Text style={styles.premiumDescription}>
                  Get unlimited habits, affirmations, and exclusive features to supercharge your journey.
                </Text>
                <TouchableOpacity style={styles.premiumButton} onPress={handleUnlockPremium}>
                  <Text style={styles.premiumButtonText}>Upgrade Now</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEditName}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="person" android_material_icon_name="person" size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Name</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleEditEmail}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="envelope" android_material_icon_name="email" size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Email</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Export & Backup</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleExportJournals}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="doc.text" android_material_icon_name="description" size={24} color={colors.text} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Export to PDF</Text>
                    <Text style={[styles.menuItemSubtext, { color: colors.textSecondary }]}>
                      Save your journals as PDF
                    </Text>
                  </View>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="moon" android_material_icon_name="brightness-2" size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
                </View>
                <Switch
                  value={theme === 'dark'}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{ false: '#D1D5DB', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="bell" android_material_icon_name="notifications" size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {isPremium && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Premium</Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                <TouchableOpacity style={styles.menuItem} onPress={handleRestorePurchases}>
                  <View style={styles.menuItemLeft}>
                    <IconSymbol ios_icon_name="arrow.clockwise" android_material_icon_name="refresh" size={24} color={colors.text} />
                    <Text style={[styles.menuItemText, { color: colors.text }]}>Restore Purchases</Text>
                  </View>
                  <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="lock" android_material_icon_name="lock" size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy Policy</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
                <View style={styles.menuItemLeft}>
                  <IconSymbol ios_icon_name="questionmark.circle" android_material_icon_name="help" size={24} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Help & Support</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="arrow-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.dangerCard}>
              <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
                <Text style={styles.dangerButtonText}>Clear All Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <RemindersOverlay
        visible={showRemindersOverlay}
        onClose={() => setShowRemindersOverlay(false)}
        isPremium={isPremium}
      />
    </>
  );
}
