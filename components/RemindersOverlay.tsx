
import React, { useState, useEffect, useCallback } from 'react';
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
import { useAudioPlayer } from 'expo-audio';
import {
  getDailyHabitsReminderSettings,
  saveDailyHabitsReminderSettings,
  getJournalReminderSettings,
  saveJournalReminderSettings,
  getReminderSound,
  saveReminderSound,
  REMINDER_SOUND_OPTIONS,
  ReminderSound,
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
  const [selectedSound, setSelectedSound] = useState<ReminderSound>('tibetan');
  const tibetanPlayer = useAudioPlayer(require('@/assets/sounds/indigo-chime.wav'));
  const bellPlayer = useAudioPlayer(require('@/assets/sounds/indigo-bell.wav'));
  const gentlePlayer = useAudioPlayer(require('@/assets/sounds/indigo-gentle.wav'));
  
  const [dailyHabitsEnabled, setDailyHabitsEnabled] = useState(false);
  const [dailyHabitsTime, setDailyHabitsTime] = useState(new Date());
  const [showDailyHabitsTimePicker, setShowDailyHabitsTimePicker] = useState(false);
  
  const [journalEnabled, setJournalEnabled] = useState(false);
  const [journalTime, setJournalTime] = useState(new Date());
  const [showJournalTimePicker, setShowJournalTimePicker] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const effectiveIsPremium = isPremium;

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[RemindersOverlay] Loading reminder settings...');
      
      // Load daily habits reminder
      const savedSound = await getReminderSound();
      setSelectedSound(savedSound);
      const dailyHabitsSettings = await getDailyHabitsReminderSettings();
      setDailyHabitsEnabled(dailyHabitsSettings.enabled);
      const [dhHours, dhMinutes] = dailyHabitsSettings.time.split(':').map(Number);
      const dhDate = new Date();
      dhDate.setHours(dhHours, dhMinutes, 0, 0);
      setDailyHabitsTime(dhDate);
      
      const journalSettings = await getJournalReminderSettings();
      const journalAllowed = effectiveIsPremium && journalSettings.enabled;
      if (journalSettings.enabled && !effectiveIsPremium) {
        await saveJournalReminderSettings({ ...journalSettings, enabled: false });
      }
      setJournalEnabled(journalAllowed);
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
  }, [effectiveIsPremium]);

  useEffect(() => {
    if (visible) void loadSettings();
  }, [visible, loadSettings]);

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
    if (value && !effectiveIsPremium) {
      Alert.alert("Premium reminder", "Journal reminders are included with Premium.", [
        { text: "Not now", style: "cancel" },
        { text: "OK", onPress: () => onClose() },
      ]);
      return;
    }
    try {
      console.log('[RemindersOverlay] Toggling journal reminder:', value);
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
    if (!effectiveIsPremium) return;
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

  const playPreview = (sound: ReminderSound) => {
    const players = [tibetanPlayer, bellPlayer, gentlePlayer];
    const player = sound === 'tibetan' ? tibetanPlayer : sound === 'bell' ? bellPlayer : gentlePlayer;
    players.filter(other => other !== player).forEach(other => other.pause());
    player.seekTo(0);
    player.play();
  };

  const selectSound = async (sound: ReminderSound) => {
    try {
      setSelectedSound(sound);
      await saveReminderSound(sound);
    } catch (error) {
      console.error('[RemindersOverlay] Could not save notification sound:', error);
      Alert.alert('Could not update reminder sound', 'The selected sound could not be saved and applied to your scheduled reminders. Please try again.');
      const savedSound = await getReminderSound();
      setSelectedSound(savedSound);
    }
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
            {/* Info Banner */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? `${colors.primary}20` : '#EEF2FF' }]}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.infoBannerText, { color: colors.text }]}>
                Choose a calm sound for your reminders.
              </Text>
            </View>

            <View style={[styles.reminderSection, { backgroundColor: isDark ? colors.border : '#F2F5FC' }]}>
              <Text style={[styles.reminderTitle, { color: colors.text, marginBottom: 10 }]}>Notification sound</Text>
              {REMINDER_SOUND_OPTIONS.map(option => (
                <View key={option.value} style={[styles.soundRow, { borderColor: isDark ? '#40517F' : '#D5DCF0' }]}>
                  <TouchableOpacity accessibilityRole="radio" accessibilityState={{ checked: selectedSound === option.value }} onPress={() => void selectSound(option.value)} style={styles.soundSelect}>
                    <View style={[styles.soundRadio, { borderColor: selectedSound === option.value ? colors.primary : colors.textSecondary }]}>{selectedSound === option.value && <View style={[styles.soundRadioInner, { backgroundColor: colors.primary }]} />}</View>
                    <Text style={[styles.reminderDescription, { color: colors.text, flex: 1 }]}>{option.label}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Preview ${option.label}`} onPress={() => playPreview(option.value)} style={[styles.previewButton, { backgroundColor: isDark ? '#172B64' : '#E5EBFF' }]}>
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>▶ Preview</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Daily habit reminder remains available on every plan. */}
            <View style={[styles.reminderSection, { backgroundColor: isDark ? colors.border : '#F2F5FC' }]}>
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
                      {effectiveIsPremium ? "Premium scheduling active" : "Daily reminder is available"}
                    </Text>
                  </React.Fragment>
                )}
                
                <Text style={[styles.reminderDescription, { color: colors.textSecondary }]}>
                  One reminder covers all your habits and uses your selected sound.
                </Text>
            </View>

            {/* Journal Reminder */}
            <View style={[styles.reminderSection, { backgroundColor: isDark ? colors.border : '#F2F5FC' }]}>
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

            {/* Individual Habit Reminders Info */}
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
              locale={Platform.OS === 'ios' ? 'en_US' : undefined}
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={handleDailyHabitsTimeChange}
            />
          )}
          
          {showJournalTimePicker && (
            <DateTimePicker
              value={journalTime}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              locale={Platform.OS === 'ios' ? 'en_US' : undefined}
              themeVariant={isDark ? 'dark' : 'light'}
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
  soundRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  soundSelect: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  soundRadio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  soundRadioInner: { width: 9, height: 9, borderRadius: 5 },
  previewButton: { minWidth: 90, alignItems: 'center', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, marginLeft: 10 },
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
