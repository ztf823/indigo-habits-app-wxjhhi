
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from './IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import {
  getDailyHabitsReminderSettings,
  saveDailyHabitsReminderSettings,
  getJournalReminderSettings,
  saveJournalReminderSettings,
  ReminderSettings,
} from '@/utils/notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/styles/commonStyles';

interface RemindersOverlayProps {
  visible: boolean;
  onClose: () => void;
  isPremium: boolean;
}

export function RemindersOverlay({ visible, onClose, isPremium }: RemindersOverlayProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  
  const [dailyHabitsEnabled, setDailyHabitsEnabled] = useState(false);
  const [dailyHabitsTime, setDailyHabitsTime] = useState(new Date());
  const [showDailyHabitsTimePicker, setShowDailyHabitsTimePicker] = useState(false);
  
  const [journalEnabled, setJournalEnabled] = useState(false);
  const [journalTime, setJournalTime] = useState(new Date());
  const [showJournalTimePicker, setShowJournalTimePicker] = useState(false);
  
  const [loading, setLoading] = useState(true);

  // 🚀 PREVIEW MODE: Always treat as premium
  const effectiveIsPremium = true;

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('[RemindersOverlay] 🚀 PREVIEW MODE: Loading reminder settings (all features unlocked)...');
      
      // Load daily habits reminder
      const dailyHabitsSettings = await getDailyHabitsReminderSettings();
      setDailyHabitsEnabled(dailyHabitsSettings.enabled);
      const [dhHours, dhMinutes] = dailyHabitsSettings.time.split(':').map(Number);
      const dhDate = new Date();
      dhDate.setHours(dhHours, dhMinutes, 0, 0);
      setDailyHabitsTime(dhDate);
      
      // 🚀 PREVIEW MODE: Always load journal reminder (premium feature)
      const journalSettings = await getJournalReminderSettings();
      setJournalEnabled(journalSettings.enabled);
      const [jHours, jMinutes] = journalSettings.time.split(':').map(Number);
      const jDate = new Date();
      jDate.setHours(jHours, jMinutes, 0, 0);
      setJournalTime(jDate);
      
      console.log('[RemindersOverlay] Settings loaded successfully');
    } catch (error) {
      console.error('[RemindersOverlay] Error loading settings:', error);
      Alert.alert('Error', 'Failed to load reminder settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDailyHabitsToggle = async (value: boolean) => {
    try {
      console.log('[RemindersOverlay] Toggling daily habits reminder:', value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setDailyHabitsEnabled(value);
      
      const timeString = formatTimeToString(dailyHabitsTime);
      await saveDailyHabitsReminderSettings({ enabled: value, time: timeString });
      
      if (value) {
        Alert.alert(
          'Reminder Set! 🔔',
          `You'll receive a daily reminder at ${formatTimeDisplay(dailyHabitsTime)} to complete your habits.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[RemindersOverlay] Error toggling daily habits reminder:', error);
      Alert.alert('Error', 'Failed to update reminder settings');
      setDailyHabitsEnabled(!value); // Revert on error
    }
  };

  const handleDailyHabitsTimeChange = async (event: any, selectedDate?: Date) => {
    setShowDailyHabitsTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      console.log('[RemindersOverlay] Daily habits time changed:', selectedDate);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // 🚀 PREVIEW MODE: No time restrictions (premium feature)
      setDailyHabitsTime(selectedDate);
      
      if (dailyHabitsEnabled) {
        try {
          const timeString = formatTimeToString(selectedDate);
          await saveDailyHabitsReminderSettings({ enabled: true, time: timeString });
        } catch (error) {
          console.error('[RemindersOverlay] Error updating daily habits time:', error);
          Alert.alert('Error', 'Failed to update reminder time');
        }
      }
    }
  };

  const handleJournalToggle = async (value: boolean) => {
    try {
      console.log('[RemindersOverlay] 🚀 PREVIEW MODE: Toggling journal reminder (premium feature):', value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setJournalEnabled(value);
      
      const timeString = formatTimeToString(journalTime);
      await saveJournalReminderSettings({ enabled: value, time: timeString });
      
      if (value) {
        Alert.alert(
          'Reminder Set! 🔔',
          `You'll receive a daily reminder at ${formatTimeDisplay(journalTime)} to journal.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[RemindersOverlay] Error toggling journal reminder:', error);
      Alert.alert('Error', 'Failed to update reminder settings');
      setJournalEnabled(!value); // Revert on error
    }
  };

  const handleJournalTimeChange = async (event: any, selectedDate?: Date) => {
    setShowJournalTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      console.log('[RemindersOverlay] Journal time changed:', selectedDate);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      setJournalTime(selectedDate);
      
      if (journalEnabled) {
        try {
          const timeString = formatTimeToString(selectedDate);
          await saveJournalReminderSettings({ enabled: true, time: timeString });
        } catch (error) {
          console.error('[RemindersOverlay] Error updating journal time:', error);
          Alert.alert('Error', 'Failed to update reminder time');
        }
      }
    }
  };

  const formatTimeToString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleClose = () => {
    console.log('[RemindersOverlay] User closed reminders overlay');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={28}
                color={colors.primary}
              />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Reminders</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="close"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* 🚀 PREVIEW MODE Banner */}
            <View style={[styles.infoBanner, { backgroundColor: 'rgba(255, 215, 0, 0.2)', borderColor: '#FFD700', borderWidth: 1 }]}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="workspace-premium"
                size={20}
                color="#FFD700"
              />
              <Text style={[styles.infoBannerText, { color: colors.text, fontWeight: '600' }]}>
                🚀 PREVIEW MODE: All premium reminder features unlocked
              </Text>
            </View>

            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? `${colors.primary}20` : '#EEF2FF' }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.infoBannerText, { color: colors.text }]}>
                All reminders play a soft Tibetan bowl chime 🔔
              </Text>
            </View>

            {/* 🚀 PREVIEW MODE: Hide Daily Habits Reminder for Pro users */}
            {!effectiveIsPremium && (
              <View style={[styles.reminderSection, { backgroundColor: isDark ? colors.border : '#F9FAFB' }]}>
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderTitleRow}>
                    <IconSymbol
                      ios_icon_name="checkmark.circle.fill"
                      android_material_icon_name="check-circle"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.reminderTitle, { color: colors.text }]}>Daily habits reminder</Text>
                  </View>
                  <Switch
                    value={dailyHabitsEnabled}
                    onValueChange={handleDailyHabitsToggle}
                    trackColor={{ false: '#D1D5DB', true: colors.primary }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
                
                {dailyHabitsEnabled && (
                  <React.Fragment>
                    <TouchableOpacity
                      style={[styles.timeButton, { backgroundColor: colors.card }]}
                      onPress={() => setShowDailyHabitsTimePicker(true)}
                    >
                      <IconSymbol
                        ios_icon_name="clock.fill"
                        android_material_icon_name="access-time"
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={[styles.timeButtonText, { color: colors.text }]}>
                        {formatTimeDisplay(dailyHabitsTime)}
                      </Text>
                    </TouchableOpacity>
                    
                    <Text style={[styles.restrictionText, { color: colors.textSecondary }]}>
                      ✓ Unlimited scheduling (Premium)
                    </Text>
                  </React.Fragment>
                )}
                
                <Text style={[styles.reminderDescription, { color: colors.textSecondary }]}>
                  One reminder covers all your habits. One chime only.
                </Text>
              </View>
            )}

            {/* Journal Reminder - 🚀 PREVIEW MODE: Always show as available */}
            <View style={[styles.reminderSection, { backgroundColor: isDark ? colors.border : '#F9FAFB' }]}>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleRow}>
                  <IconSymbol
                    ios_icon_name="book.fill"
                    android_material_icon_name="menu-book"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.reminderTitle, { color: colors.text }]}>Journal reminder</Text>
                  <View style={styles.premiumBadge}>
                    <IconSymbol
                      ios_icon_name="crown.fill"
                      android_material_icon_name="workspace-premium"
                      size={14}
                      color="#FFD700"
                    />
                  </View>
                </View>
                <Switch
                  value={journalEnabled}
                  onValueChange={handleJournalToggle}
                  trackColor={{ false: '#D1D5DB', true: colors.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
              
              {journalEnabled && (
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowJournalTimePicker(true)}
                >
                  <IconSymbol
                    ios_icon_name="clock.fill"
                    android_material_icon_name="access-time"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.timeButtonText, { color: colors.text }]}>
                    {formatTimeDisplay(journalTime)}
                  </Text>
                </TouchableOpacity>
              )}
              
              <Text style={[styles.reminderDescription, { color: colors.textSecondary }]}>
                Daily reminder to reflect and journal
              </Text>
            </View>

            {/* Individual Habit Reminders Info - 🚀 PREVIEW MODE: Always show */}
            <View style={[styles.infoSection, { backgroundColor: isDark ? `${colors.primary}20` : '#EEF2FF' }]}>
              <IconSymbol
                ios_icon_name="lightbulb.fill"
                android_material_icon_name="lightbulb"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={{ fontWeight: '600' }}>Pro Tip:</Text> Set individual habit reminders by tapping the ⏰ icon next to each habit in the Habits tab.
              </Text>
            </View>
          </ScrollView>

          {/* Time Pickers */}
          {showDailyHabitsTimePicker && (
            <DateTimePicker
              value={dailyHabitsTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDailyHabitsTimeChange}
            />
          )}
          
          {showJournalTimePicker && (
            <DateTimePicker
              value={journalTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleJournalTimeChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  reminderSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  restrictionText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});
