/** Local reminders use the device's default notification sound. */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_HABITS_REMINDER_KEY = 'dailyHabitsReminder';
const JOURNAL_REMINDER_KEY = 'journalReminder';
const HABIT_REMINDERS_KEY = 'habitReminders';
const DAILY_HABITS_NOTIFICATION_ID = 'daily-habits-reminder';
const JOURNAL_NOTIFICATION_ID = 'journal-reminder';
const CHANNEL_ID = 'habits-reminders';

export interface ReminderSettings { enabled: boolean; time: string; }
export interface HabitReminder { habitId: string; time: string; }

let initialized = false;
/** Set up foreground delivery without requesting permission on app launch. */
export const initializeNotifications = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  if (!initialized) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, shouldShowList: true,
        shouldPlaySound: true, shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Habit reminders', importance: Notifications.AndroidImportance.HIGH,
        sound: 'default', vibrationPattern: [0, 250, 250, 250], lightColor: '#2637D9',
      });
    }
    initialized = true;
  }
  return true;
};

const ensurePermission = async () => {
  if (!await initializeNotifications()) throw new Error('Reminders are available in the iOS and Android app.');
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  const provisional = permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!permission.granted && !provisional) {
    throw new Error('Allow notifications for Indigo Habits in your device Settings, then try again.');
  }
};

const parseTime = (time: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Choose a valid reminder time.');
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
};

const schedule = async (identifier: string, time: string, title: string, body: string, data: Record<string, string>) => {
  const { hour, minute } = parseTime(time);
  await ensurePermission();
  // A stable identifier replaces this reminder without duplicating daily alerts.
  // Do not cancel first: a failed replacement should leave the previous reminder intact.
  await Notifications.scheduleNotificationAsync({
    identifier, content: { title, body, sound: 'default', data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
};

export const scheduleDailyHabitsReminder = (time: string) => schedule(
  DAILY_HABITS_NOTIFICATION_ID, time, 'Time for your daily habits! 🌟',
  'Complete your habits to build your streak', { type: 'daily-habits' },
);
export const cancelDailyHabitsReminder = () => Notifications.cancelScheduledNotificationAsync(DAILY_HABITS_NOTIFICATION_ID);
export const scheduleJournalReminder = (time: string) => schedule(
  JOURNAL_NOTIFICATION_ID, time, 'Time to journal 📝',
  'Reflect on your day and capture your thoughts', { type: 'journal' },
);
export const cancelJournalReminder = () => Notifications.cancelScheduledNotificationAsync(JOURNAL_NOTIFICATION_ID);
export const scheduleHabitReminder = (habitId: string, habitTitle: string, time: string) => schedule(
  `habit-${habitId}`, time, `Time for: ${habitTitle} ⏰`,
  'Complete this habit to maintain your streak', { type: 'habit', habitId },
);
export const cancelHabitReminder = (habitId: string) => Notifications.cancelScheduledNotificationAsync(`habit-${habitId}`);

const readSettings = async (key: string, fallbackTime: string): Promise<ReminderSettings> => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return { enabled: false, time: fallbackTime };
  const settings = JSON.parse(raw);
  if (typeof settings.enabled !== 'boolean' || typeof settings.time !== 'string') throw new Error('Reminder settings could not be read.');
  parseTime(settings.time);
  return settings;
};
export const getDailyHabitsReminderSettings = () => readSettings(DAILY_HABITS_REMINDER_KEY, '09:00');
export const getJournalReminderSettings = () => readSettings(JOURNAL_REMINDER_KEY, '20:00');

export const saveDailyHabitsReminderSettings = async (settings: ReminderSettings) => {
  parseTime(settings.time);
  if (settings.enabled) await scheduleDailyHabitsReminder(settings.time);
  else await cancelDailyHabitsReminder();
  await AsyncStorage.setItem(DAILY_HABITS_REMINDER_KEY, JSON.stringify(settings));
};
export const saveJournalReminderSettings = async (settings: ReminderSettings) => {
  parseTime(settings.time);
  if (settings.enabled) await scheduleJournalReminder(settings.time);
  else await cancelJournalReminder();
  await AsyncStorage.setItem(JOURNAL_REMINDER_KEY, JSON.stringify(settings));
};
export const getHabitReminders = async (): Promise<HabitReminder[]> => {
  const raw = await AsyncStorage.getItem(HABIT_REMINDERS_KEY);
  if (!raw) return [];
  const reminders = JSON.parse(raw);
  if (!Array.isArray(reminders)) throw new Error('Habit reminders could not be read.');
  for (const reminder of reminders) {
    if (typeof reminder.habitId !== 'string' || typeof reminder.time !== 'string') throw new Error('Habit reminder could not be read.');
    parseTime(reminder.time);
  }
  return reminders;
};
export const saveHabitReminder = async (habitId: string, time: string, habitTitle: string) => {
  const reminders = await getHabitReminders();
  const next = [...reminders.filter(r => r.habitId !== habitId), { habitId, time }];
  await scheduleHabitReminder(habitId, habitTitle, time);
  await AsyncStorage.setItem(HABIT_REMINDERS_KEY, JSON.stringify(next));
};
export const removeHabitReminder = async (habitId: string) => {
  const reminders = await getHabitReminders();
  await cancelHabitReminder(habitId);
  await AsyncStorage.setItem(HABIT_REMINDERS_KEY, JSON.stringify(reminders.filter(r => r.habitId !== habitId)));
};
export const getHabitReminderTime = async (habitId: string): Promise<string | null> => {
  return (await getHabitReminders()).find(r => r.habitId === habitId)?.time ?? null;
};
