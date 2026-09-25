
import React, { useState, useEffect, useRef } from 'react';
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
import { IconSymbol } from './IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import {
  getDailyHabitsReminderSettings,
  saveDailyHabitsReminderSettings,
  getJournalReminderSettings,
  saveJournalReminderSettings,
} from '@/utils/notifications';
import { useTheme } from '@/contexts/ThemeContext';
import { brandColors, getColors } from '@/styles/commonStyles';

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

  const effectiveIsPremium = isPremium;
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Failed to update reminder settings.';

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible, isPremium]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('[RemindersOverlay] Loading reminder settings...');
      
      // Load daily habits reminder
      const dailyHabitsSettings = await getDailyHabitsReminderSettings();
      setDailyHabitsEnabled(dailyHabitsSettings.enabled);
      const [dhHours, dhMinutes] = dailyHabitsSettings.time.split(':').map(Number);
      const dhDate = new Date();
      dhDate.setHours(dhHours, dhMinutes, 0, 0);
      setDailyHabitsTime(dhDate);
      
      {
        const journalSettings = await getJournalReminderSettings();
        setJournalEnabled(journalSettings.enabled);
        const [jHours, jMinutes] = journalSettings.time.split(':').map(Number);
        const jDate = new Date();
        jDate.setHours(jHours, jMinutes, 0, 0);
        setJournalTime(jDate);
      }
      
      console.log('[RemindersOverlay] Settings loaded successfully');
    } catch (error) {
      console.error('[RemindersOverlay] Error loading settings:', error);
      Alert.alert('Error', 'Failed to load reminder settings');
    } finally {
      setLoading(false);
    }
  };

  const saveChange = async (operation: () => Promise<void>) => {
    if (saving.current || loading) return;
    saving.current = true;
    setBusy(true);
    try {
      await operation();
    } catch (error) {
      Alert.alert('Reminder not updated', errorMessage(error));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const handleDailyHabitsToggle = (value: boolean) => saveChange(async () => {
    await saveDailyHabitsReminderSettings({ enabled: value, time: formatTimeToString(dailyHabitsTime) });
    setDailyHabitsEnabled(value);
  });

  const handleDailyHabitsTimeChange = (event: any, selectedDate?: Date) => {
    setShowDailyHabitsTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !selectedDate) return;
    void saveChange(async () => {
      await saveDailyHabitsReminderSettings({ enabled: dailyHabitsEnabled, time: formatTimeToString(selectedDate) });
      setDailyHabitsTime(selectedDate);
    });
  };

  const handleJournalToggle = (value: boolean) => {
    // Expired subscribers must still be able to turn an existing reminder off.
    if (value && !effectiveIsPremium) {
      Alert.alert('Premium Required', 'Journal reminders are a Premium feature.');
      return;
    }
    void saveChange(async () => {
      await saveJournalReminderSettings({ enabled: value, time: formatTimeToString(journalTime) });
      setJournalEnabled(value);
    });
  };

  const handleJournalTimeChange = (event: any, selectedDate?: Date) => {
    setShowJournalTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !selectedDate || !effectiveIsPremium) return;
    void saveChange(async () => {
      await saveJournalReminderSettings({ enabled: journalEnabled, time: formatTimeToString(selectedDate) });
      setJournalTime(selectedDate);
    });
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
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? `${colors.primary}20` : brandColors.softIndigo }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.infoBannerText, { color: colors.text }]}>
                Reminders use your device’s notification sound and respect your notification settings.
              </Text>
            </View>

            {/* Daily Habits Reminder */}
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
                    disabled={loading || busy}
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
                      disabled={loading || busy}
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
                    
                  </React.Fragment>
                )}
                
                <Text style={[styles.reminderDescription, { color: colors.textSecondary }]}>
                  One daily reminder covers all your habits.
                </Text>
              </View>

            {/* Journal Reminder */}
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
                  disabled={loading || busy}
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
                  disabled={loading || busy || !effectiveIsPremium}
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

            {effectiveIsPremium && <View style={[styles.infoSection, { backgroundColor: isDark ? `${colors.primary}20` : brandColors.softIndigo }]}>
              <IconSymbol
                ios_icon_name="lightbulb.fill"
                android_material_icon_name="lightbulb"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                <Text style={{ fontWeight: '600' }}>Pro Tip:</Text> Set individual habit reminders by tapping the ⏰ icon next to each habit in the Habits tab.
              </Text>
            </View>}
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
    backgroundColor: brandColors.softIndigo,
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
    backgroundColor: brandColors.softIndigo,
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
