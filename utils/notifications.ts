
/**
 * Notification utilities for Indigo Habits
 * Handles local notifications with selectable calm sounds
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const DAILY_HABITS_REMINDER_KEY = 'dailyHabitsReminder';
const JOURNAL_REMINDER_KEY = 'journalReminder';
const HABIT_REMINDERS_KEY = 'habitReminders';
const REMINDER_SOUND_KEY = '@indigo_habits/reminder_sound_v1';
export type ReminderSound = 'tibetan' | 'bell' | 'gentle';
export const REMINDER_SOUND_OPTIONS: { value: ReminderSound; label: string }[] = [
  { value: 'tibetan', label: 'Tibetan Chime' },
  { value: 'bell', label: 'Soft Bell' },
  { value: 'gentle', label: 'Gentle Tone' },
];
export const getReminderSound = async (): Promise<ReminderSound> => {
  const saved = await AsyncStorage.getItem(REMINDER_SOUND_KEY);
  if (REMINDER_SOUND_OPTIONS.some(option => option.value === saved)) return saved as ReminderSound;
  return saved === 'gentle' ? 'gentle' : 'tibetan';
};
export const saveReminderSound = async (sound: ReminderSound) => {
  await AsyncStorage.setItem(REMINDER_SOUND_KEY, sound);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await configureSoundChannel(sound);
  for (const notification of scheduled) {
    const trigger = notification.trigger;
    if (!trigger) continue;
    const content = notification.content;
    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    await Notifications.scheduleNotificationAsync({
      identifier: notification.identifier,
      content: { ...content, sound: soundResource(sound) } as unknown as Notifications.NotificationContentInput,
      trigger: { ...(trigger as object), ...(Platform.OS === 'android' ? { channelId: soundChannel(sound) } : {}) } as Notifications.NotificationTriggerInput,
    });
  }
};
const soundResource = (sound: ReminderSound) => sound === 'tibetan' ? 'indigo-chime.wav'
  : sound === 'bell' ? 'indigo-bell.wav' : 'indigo-gentle.wav';
const soundChannel = (sound: ReminderSound) => 'habits-reminders-' + sound;
const configureSoundChannel = async (sound: ReminderSound) => {
  if (Platform.OS !== 'android') return;
  const resource = soundResource(sound);
  await Notifications.setNotificationChannelAsync(soundChannel(sound), {
    name: 'Habit reminders · ' + (REMINDER_SOUND_OPTIONS.find(option => option.value === sound)?.label ?? 'Default'),
    importance: Notifications.AndroidImportance.HIGH,
    sound: resource.replace(/\.wav$/, ''),
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4F46E5',
  });
};
const currentSoundContent = async () => {
  const sound = await getReminderSound();
  await configureSoundChannel(sound);
  return { sound: soundResource(sound) };
};
const currentSoundTrigger = async () => {
  const sound = await getReminderSound();
  await configureSoundChannel(sound);
  return Platform.OS === 'android' ? { channelId: soundChannel(sound) } : {};
};

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
          shouldShowBanner: true,
          shouldShowList: true,
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
 * Schedule daily habits reminder
 */
export const scheduleDailyHabitsReminder = async (time: string) => {
  try {
    console.log('[Notifications] Scheduling daily habits reminder for', time);
    
    // Cancel existing notification
    try {
      await Notifications.cancelScheduledNotificationAsync(DAILY_HABITS_NOTIFICATION_ID);
    } catch (cancelError) {
      console.warn('[Notifications] Could not cancel daily habits notification (may not exist):', cancelError);
    }
    
    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Schedule new notification
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_HABITS_NOTIFICATION_ID,
        content: {
          title: 'Time for your daily habits! 🌟',
          body: 'Complete your habits to build your streak',
          ...(await currentSoundContent()),
          data: { type: 'daily-habits' },
        },
        trigger: {
          ...(await currentSoundTrigger()),
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      console.log('[Notifications] Daily habits reminder scheduled successfully');
    } catch (scheduleError) {
      console.warn('[Notifications] Could not schedule daily habits notification:', scheduleError);
    }
  } catch (error) {
    console.warn('[Notifications] Error in scheduleDailyHabitsReminder:', error);
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
    try {
      await Notifications.cancelScheduledNotificationAsync(JOURNAL_NOTIFICATION_ID);
    } catch (cancelError) {
      console.warn('[Notifications] Could not cancel journal notification (may not exist):', cancelError);
    }
    
    // Parse time (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Schedule new notification
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: JOURNAL_NOTIFICATION_ID,
        content: {
          title: 'Time to journal 📝',
          body: 'Reflect on your day and capture your thoughts',
          ...(await currentSoundContent()),
          data: { type: 'journal', route: '/reflection' },
        },
        trigger: {
          ...(await currentSoundTrigger()),
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });
      console.log('[Notifications] Journal reminder scheduled successfully');
    } catch (scheduleError) {
      console.warn('[Notifications] Could not schedule journal notification:', scheduleError);
    }
  } catch (error) {
    console.warn('[Notifications] Error in scheduleJournalReminder:', error);
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
export const scheduleHabitReminder = async (habitId: string, habitTitle: string, time: string | string[], days: number[] = [0,1,2,3,4,5,6]) => {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted' && (await Notifications.requestPermissionsAsync()).status !== 'granted') return false;
    await Notifications.setNotificationCategoryAsync('habit-reminder-actions', [
      { identifier: 'complete', buttonTitle: 'Mark complete', options: { opensAppToForeground: true } },
      { identifier: 'snooze', buttonTitle: 'Snooze 10 min', options: { opensAppToForeground: false } },
    ]);
    const times = [...new Set(Array.isArray(time) ? time : [time])];
    console.log('[Notifications] Scheduling habit reminder for', habitTitle, 'at', times);
    
    const notificationId = `habit-${habitId}`;
    
    // Cancel existing notification for this habit
    try {
      const existing = await Notifications.getAllScheduledNotificationsAsync();
      await Promise.all(existing.filter(n => String(n.identifier) === notificationId || String(n.identifier).startsWith(`${notificationId}-`)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    } catch (cancelError) {
      console.warn('[Notifications] Could not cancel habit notification (may not exist):', cancelError);
    }
    
    for (const weekday of days) for (const [timeIndex, scheduledTime] of times.entries()) try {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        identifier: `${notificationId}-${weekday}${timeIndex ? `-${timeIndex}` : ''}`,
        content: {
          title: habitTitle,
          body: '',
          ...(await currentSoundContent()),
          data: { type: 'habit', habitId, route: '/(tabs)/calendar', weekday, time: scheduledTime },
          categoryIdentifier: 'habit-reminder-actions',
        },
        trigger: {
          ...(await currentSoundTrigger()),
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          weekday: weekday + 1,
          repeats: true,
        },
      });
      console.log('[Notifications] Habit reminder scheduled successfully');
    } catch (scheduleError) {
      console.warn('[Notifications] Could not schedule habit notification:', scheduleError);
    }
    return true;
  } catch (error) {
    console.warn('[Notifications] Error in scheduleHabitReminder:', error);
  }
};

/**
 * Cancel individual habit reminder
 */
export const cancelHabitReminder = async (habitId: string) => {
  try {
    const notificationId = `habit-${habitId}`;
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(existing.filter(n => String(n.identifier) === notificationId || String(n.identifier).startsWith(`${notificationId}-`)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    console.log('[Notifications] Habit reminder cancelled for', habitId);
  } catch (error) {
    console.error('[Notifications] Error cancelling habit reminder:', error);
  }
};

export const scheduleAffirmationReminders = async (id: string, text: string, days: number[], times: string[]) => {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && (await Notifications.requestPermissionsAsync()).status !== 'granted') return false;
  await cancelAffirmationReminders(id);
  await Notifications.setNotificationCategoryAsync('affirmation-actions', [
    { identifier: 'complete', buttonTitle: 'Acknowledge', options: { opensAppToForeground: false } },
  ]);
  for (const day of days) for (const time of times) {
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: `affirmation-${id}-${day}-${time.replace(':','')}`,
      content: { title: 'A thought for you', body: text, ...(await currentSoundContent()), data: { type: 'affirmation', affirmationId: id, route: '/(tabs)' }, categoryIdentifier: 'affirmation-actions' },
      trigger: { ...(await currentSoundTrigger()), type: Notifications.SchedulableTriggerInputTypes.CALENDAR, weekday: day + 1, hour, minute, repeats: true },
    });
  }
  return true;
};

export const cancelAffirmationReminders = async (id: string) => {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing.filter(n => String(n.identifier).startsWith(`affirmation-${id}-`)).map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
};

export const scheduleTaskReminder = async (taskId: string, title: string, date: string, time: string) => {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && (await Notifications.requestPermissionsAsync()).status !== 'granted') return false;
  await Notifications.setNotificationCategoryAsync('task-reminder-actions', [
    { identifier: 'complete', buttonTitle: 'Mark complete', options: { opensAppToForeground: true } },
    { identifier: 'snooze', buttonTitle: 'Snooze 10 min', options: { opensAppToForeground: false } },
  ]);
  await cancelTaskReminder(taskId);
  const [year, month, day] = date.split('-').map(Number); const [hour, minute] = time.split(':').map(Number);
  const triggerDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (triggerDate.getTime() <= Date.now()) return false;
  await Notifications.scheduleNotificationAsync({ identifier: `task-${taskId}`, content: { title, body: '', ...(await currentSoundContent()), data: { type: 'task', taskId, date, route: '/(tabs)/calendar' }, categoryIdentifier: 'task-reminder-actions' }, trigger: { ...(await currentSoundTrigger()), type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate } });
  return true;
};
export const cancelTaskReminder = async (taskId: string) => { try { await Notifications.cancelScheduledNotificationAsync(`task-${taskId}`); } catch {} };

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
