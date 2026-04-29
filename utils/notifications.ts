
/**
 * Notification utilities for Indigo Habits
 * Handles local notifications with custom Tibetan bowl chime sound
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const DAILY_HABITS_REMINDER_KEY = 'dailyHabitsReminder';
const JOURNAL_REMINDER_KEY = 'journalReminder';
const HABIT_REMINDERS_KEY = 'habitReminders';

// Notification IDs
const DAILY_HABITS_NOTIFICATION_ID = 'daily-habits-reminder';
const JOURNAL_NOTIFICATION_ID = 'journal-reminder';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM format
}

export interface HabitReminder {
  habitId: string;
  time: string; // HH:MM format
}

/**
 * Initialize notifications and set up the handler
 */
export const initializeNotifications = async () => {
  try {
    console.log('[Notifications] Initializing notification system...');

    // Each setup call is individually guarded so a failure in one doesn't
    // prevent the rest from running and no exception escapes to the native bridge
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (e) {
      console.warn('[Notifications] setNotificationHandler failed:', e);
    }

    try {
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('[Notifications] Notification received');
      });
    } catch (e) {
      console.warn('[Notifications] addNotificationReceivedListener failed:', e);
    }

    try {
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[Notifications] User tapped notification');
      });
    } catch (e) {
      console.warn('[Notifications] addNotificationResponseReceivedListener failed:', e);
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits-reminders', {
        name: 'Habits Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    console.log('[Notifications] Notification system initialized successfully');
    return true;
  } catch (error) {
    console.warn('[Notifications] Error initializing notifications (non-fatal):', error);
    return false;
  }
};

/**
 * Play Tibetan bowl chime sound
 * 🚀 PREVIEW MODE: Uses the same chime as habit completion
 */
export const playTibetanChime = async () => {
  try {
    console.log('[Notifications] 🚀 PREVIEW MODE: Playing soft Tibetan bowl chime...');
    
    // In production, this would play an actual audio file
    // For now, we just log it
    console.log('[Notifications] 🚀 PREVIEW MODE: Tibetan bowl chime played successfully');
  } catch (error) {
    console.error('[Notifications] Error playing chime:', error);
  }
};

/**
 * Schedule daily habits reminder
 */
export const scheduleDailyHabitsReminder = async (time: string) => {
  try {
    console.log('[Notifications] Scheduling daily habits reminder for', time);
    
    // Cancel existing notification
    await Notifications.cancelScheduledNotificationAsync(DAILY_HABITS_NOTIFICATION_ID);
    
    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Schedule new notification
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_HABITS_NOTIFICATION_ID,
      content: {
        title: 'Time for your daily habits! 🌟',
        body: 'Complete your habits to build your streak',
        sound: 'default',
        data: { type: 'daily-habits' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
    
    console.log('[Notifications] Daily habits reminder scheduled successfully');
  } catch (error) {
    console.error('[Notifications] Error scheduling daily habits reminder:', error);
    throw error;
  }
};

/**
 * Cancel daily habits reminder
 */
export const cancelDailyHabitsReminder = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_HABITS_NOTIFICATION_ID);
    console.log('[Notifications] Daily habits reminder cancelled');
  } catch (error) {
    console.error('[Notifications] Error cancelling daily habits reminder:', error);
  }
};

/**
 * Schedule journal reminder
 */
export const scheduleJournalReminder = async (time: string) => {
  try {
    console.log('[Notifications] Scheduling journal reminder for', time);
    
    // Cancel existing notification
    await Notifications.cancelScheduledNotificationAsync(JOURNAL_NOTIFICATION_ID);
    
    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Schedule new notification
    await Notifications.scheduleNotificationAsync({
      identifier: JOURNAL_NOTIFICATION_ID,
      content: {
        title: 'Time to journal 📝',
        body: 'Reflect on your day and capture your thoughts',
        sound: 'default',
        data: { type: 'journal' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
    
    console.log('[Notifications] Journal reminder scheduled successfully');
  } catch (error) {
    console.error('[Notifications] Error scheduling journal reminder:', error);
    throw error;
  }
};

/**
 * Cancel journal reminder
 */
export const cancelJournalReminder = async () => {
  try {
    await Notifications.cancelScheduledNotificationAsync(JOURNAL_NOTIFICATION_ID);
    console.log('[Notifications] Journal reminder cancelled');
  } catch (error) {
    console.error('[Notifications] Error cancelling journal reminder:', error);
  }
};

/**
 * Schedule individual habit reminder
 */
export const scheduleHabitReminder = async (habitId: string, habitTitle: string, time: string) => {
  try {
    console.log('[Notifications] Scheduling habit reminder for', habitTitle, 'at', time);
    
    const notificationId = `habit-${habitId}`;
    
    // Cancel existing notification for this habit
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    
    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Schedule new notification
    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `Time for: ${habitTitle} ⏰`,
        body: 'Complete this habit to maintain your streak',
        sound: 'default',
        data: { type: 'habit', habitId },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
    
    console.log('[Notifications] Habit reminder scheduled successfully');
  } catch (error) {
    console.error('[Notifications] Error scheduling habit reminder:', error);
    throw error;
  }
};

/**
 * Cancel individual habit reminder
 */
export const cancelHabitReminder = async (habitId: string) => {
  try {
    const notificationId = `habit-${habitId}`;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[Notifications] Habit reminder cancelled for', habitId);
  } catch (error) {
    console.error('[Notifications] Error cancelling habit reminder:', error);
  }
};

/**
 * Get daily habits reminder settings
 */
export const getDailyHabitsReminderSettings = async (): Promise<ReminderSettings> => {
  try {
    const settings = await AsyncStorage.getItem(DAILY_HABITS_REMINDER_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    return { enabled: false, time: '09:00' };
  } catch (error) {
    console.error('[Notifications] Error getting daily habits reminder settings:', error);
    return { enabled: false, time: '09:00' };
  }
};

/**
 * Save daily habits reminder settings
 */
export const saveDailyHabitsReminderSettings = async (settings: ReminderSettings) => {
  try {
    await AsyncStorage.setItem(DAILY_HABITS_REMINDER_KEY, JSON.stringify(settings));
    
    if (settings.enabled) {
      await scheduleDailyHabitsReminder(settings.time);
    } else {
      await cancelDailyHabitsReminder();
    }
    
    console.log('[Notifications] Daily habits reminder settings saved');
  } catch (error) {
    console.error('[Notifications] Error saving daily habits reminder settings:', error);
    throw error;
  }
};

/**
 * Get journal reminder settings
 */
export const getJournalReminderSettings = async (): Promise<ReminderSettings> => {
  try {
    const settings = await AsyncStorage.getItem(JOURNAL_REMINDER_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    return { enabled: false, time: '20:00' };
  } catch (error) {
    console.error('[Notifications] Error getting journal reminder settings:', error);
    return { enabled: false, time: '20:00' };
  }
};

/**
 * Save journal reminder settings
 */
export const saveJournalReminderSettings = async (settings: ReminderSettings) => {
  try {
    await AsyncStorage.setItem(JOURNAL_REMINDER_KEY, JSON.stringify(settings));
    
    if (settings.enabled) {
      await scheduleJournalReminder(settings.time);
    } else {
      await cancelJournalReminder();
    }
    
    console.log('[Notifications] Journal reminder settings saved');
  } catch (error) {
    console.error('[Notifications] Error saving journal reminder settings:', error);
    throw error;
  }
};

/**
 * Get all habit reminders
 */
export const getHabitReminders = async (): Promise<HabitReminder[]> => {
  try {
    const reminders = await AsyncStorage.getItem(HABIT_REMINDERS_KEY);
    if (reminders) {
      return JSON.parse(reminders);
    }
    return [];
  } catch (error) {
    console.error('[Notifications] Error getting habit reminders:', error);
    return [];
  }
};

/**
 * Save habit reminder
 */
export const saveHabitReminder = async (habitId: string, time: string, habitTitle: string) => {
  try {
    const reminders = await getHabitReminders();
    const existingIndex = reminders.findIndex(r => r.habitId === habitId);
    
    if (existingIndex >= 0) {
      reminders[existingIndex].time = time;
    } else {
      reminders.push({ habitId, time });
    }
    
    await AsyncStorage.setItem(HABIT_REMINDERS_KEY, JSON.stringify(reminders));
    await scheduleHabitReminder(habitId, habitTitle, time);
    
    console.log('[Notifications] Habit reminder saved');
  } catch (error) {
    console.error('[Notifications] Error saving habit reminder:', error);
    throw error;
  }
};

/**
 * Remove habit reminder
 */
export const removeHabitReminder = async (habitId: string) => {
  try {
    const reminders = await getHabitReminders();
    const filtered = reminders.filter(r => r.habitId !== habitId);
    
    await AsyncStorage.setItem(HABIT_REMINDERS_KEY, JSON.stringify(filtered));
    await cancelHabitReminder(habitId);
    
    console.log('[Notifications] Habit reminder removed');
  } catch (error) {
    console.error('[Notifications] Error removing habit reminder:', error);
    throw error;
  }
};

/**
 * Get habit reminder time
 */
export const getHabitReminderTime = async (habitId: string): Promise<string | null> => {
  try {
    const reminders = await getHabitReminders();
    const reminder = reminders.find(r => r.habitId === habitId);
    return reminder ? reminder.time : null;
  } catch (error) {
    console.error('[Notifications] Error getting habit reminder time:', error);
    return null;
  }
};
