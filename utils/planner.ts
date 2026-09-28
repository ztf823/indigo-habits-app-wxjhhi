import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getAllHabits,
  getHabitCompletionsForDate,
} from "@/utils/database";

export type HabitSchedule = {
  days: number[];
  time: string;
  reminderEnabled: boolean;
  paused: boolean;
};

export type PlannedItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
  reminderEnabled: boolean;
  createdAt: string;
};

export type PlanEntry = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: "habit" | "task" | "affirmation";
  completed: boolean;
  color?: string;
  reminderEnabled: boolean;
  habitId?: string;
  taskId?: string;
  affirmationId?: string;
};

export type AffirmationSchedule = {
  enabled: boolean;
  affirmationId: string;
  days: number[];
  times: string[];
};

const HABIT_SCHEDULES_KEY = "@indigo_habits/habit_schedules_v1";
const PLANNED_ITEMS_KEY = "@indigo_habits/planned_items_v1";
const AFFIRMATION_SCHEDULE_KEY = "@indigo_habits/affirmation_schedules_v2";
const AFFIRMATION_USAGE_KEY = "@indigo_habits/affirmation_usage_v1";
const CURRENT_AFFIRMATION_KEY = "@indigo_habits/current_affirmation_v1";

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [1, 2, 3, 4, 5];

const parseJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getWeekdayForDateKey = (dateKey: string) =>
  new Date(`${dateKey}T12:00:00`).getDay();

export const formatTime = (time?: string | null) => {
  if (!time) return "Any time";
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`;
};

export const makeId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const readHabitSchedules = async (): Promise<Record<string, HabitSchedule>> =>
  parseJson(await AsyncStorage.getItem(HABIT_SCHEDULES_KEY), {});

export const getHabitSchedule = async (habitId: string): Promise<HabitSchedule> => {
  const schedules = await readHabitSchedules();
  return schedules[habitId] || {
    days: ALL_DAYS,
    time: "",
    reminderEnabled: false,
    paused: false,
  };
};

export const getAllHabitSchedules = readHabitSchedules;

export const saveHabitSchedule = async (habitId: string, schedule: HabitSchedule) => {
  const schedules = await readHabitSchedules();
  schedules[habitId] = {
    ...schedule,
    days: [...new Set(schedule.days)].filter(day => day >= 0 && day <= 6).sort(),
  };
  await AsyncStorage.setItem(HABIT_SCHEDULES_KEY, JSON.stringify(schedules));
};

export const removeHabitSchedule = async (habitId: string) => {
  const schedules = await readHabitSchedules();
  delete schedules[habitId];
  await AsyncStorage.setItem(HABIT_SCHEDULES_KEY, JSON.stringify(schedules));
};

export const getPlannedItems = async (): Promise<PlannedItem[]> =>
  parseJson(await AsyncStorage.getItem(PLANNED_ITEMS_KEY), []);

export const getPlannedItemsForDate = async (date: string) =>
  (await getPlannedItems()).filter(item => item.date === date);

export const addPlannedItem = async (input: Omit<PlannedItem, "createdAt" | "completed">) => {
  const items = await getPlannedItems();
  const item: PlannedItem = {
    ...input,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PLANNED_ITEMS_KEY, JSON.stringify([...items, item]));
  return item;
};

export const setPlannedItemCompleted = async (id: string, date: string, completed: boolean) => {
  const items = await getPlannedItems();
  const updated = items.map(item =>
    item.id === id && item.date === date ? { ...item, completed } : item
  );
  await AsyncStorage.setItem(PLANNED_ITEMS_KEY, JSON.stringify(updated));
};

export const deletePlannedItem = async (id: string) => {
  const items = await getPlannedItems();
  await AsyncStorage.setItem(PLANNED_ITEMS_KEY, JSON.stringify(items.filter(item => item.id !== id)));
};

export const getAffirmationSchedules = async (): Promise<AffirmationSchedule[]> =>
  parseJson(await AsyncStorage.getItem(AFFIRMATION_SCHEDULE_KEY), []);

export const getAffirmationSchedule = async (): Promise<AffirmationSchedule> =>
  (await getAffirmationSchedules())[0] || {
    enabled: false,
    affirmationId: "",
    days: ALL_DAYS,
    times: ["09:00"],
  };

export const saveAffirmationSchedule = async (schedule: AffirmationSchedule) => {
  const schedules = await getAffirmationSchedules();
  const normalized = {
    ...schedule,
    days: [...new Set(schedule.days)].filter(day => day >= 0 && day <= 6).sort(),
    times: [...new Set(schedule.times)].filter(Boolean).sort(),
  };
  const next = schedules.filter(item => item.affirmationId !== schedule.affirmationId);
  if (normalized.enabled && normalized.affirmationId) next.push(normalized);
  await AsyncStorage.setItem(AFFIRMATION_SCHEDULE_KEY, JSON.stringify(next));
};

export const removeAffirmationSchedule = async (affirmationId: string) => {
  const schedules = await getAffirmationSchedules();
  await AsyncStorage.setItem(AFFIRMATION_SCHEDULE_KEY, JSON.stringify(
    schedules.filter(item => item.affirmationId !== affirmationId)
  ));
};

export const getCurrentAffirmationId = () => AsyncStorage.getItem(CURRENT_AFFIRMATION_KEY);
export const setCurrentAffirmationId = (id: string) => AsyncStorage.setItem(CURRENT_AFFIRMATION_KEY, id);

export const getAffirmationUsage = async (date = getLocalDateKey()): Promise<number> => {
  const usage = parseJson<Record<string, number>>(await AsyncStorage.getItem(AFFIRMATION_USAGE_KEY), {});
  return usage[date] || 0;
};

export const recordAffirmationRefresh = async (date = getLocalDateKey()) => {
  const usage = parseJson<Record<string, number>>(await AsyncStorage.getItem(AFFIRMATION_USAGE_KEY), {});
  usage[date] = (usage[date] || 0) + 1;
  await AsyncStorage.setItem(AFFIRMATION_USAGE_KEY, JSON.stringify(usage));
  return usage[date];
};

export const getPlanForDate = async (date: string): Promise<PlanEntry[]> => {
  const weekday = getWeekdayForDateKey(date);
  const [habits, completions, schedules, tasks, affirmationSchedules] = await Promise.all([
    getAllHabits() as Promise<any[]>,
    getHabitCompletionsForDate(date) as Promise<any[]>,
    readHabitSchedules(),
    getPlannedItemsForDate(date),
    getAffirmationSchedules(),
  ]);

  const completedHabitIds = new Set(
    completions.filter(item => item.completed === 1).map(item => item.habitId)
  );
  const habitEntries: PlanEntry[] = habits.flatMap(habit => {
    const schedule = schedules[habit.id] || {
      days: ALL_DAYS,
      time: "",
      reminderEnabled: false,
      paused: false,
    };
    if (schedule.paused || !schedule.days.includes(weekday)) return [];
    if (habit.isRepeating !== 1 && !schedules[habit.id]) return [];
    return [{
      id: `habit:${habit.id}`,
      habitId: habit.id,
      title: habit.title,
      date,
      time: schedule.time || "",
      kind: "habit" as const,
      completed: completedHabitIds.has(habit.id),
      color: habit.color,
      reminderEnabled: schedule.reminderEnabled,
    }];
  });

  const taskEntries: PlanEntry[] = tasks.map(task => ({
    id: `task:${task.id}`,
    taskId: task.id,
    title: task.title,
    date,
    time: task.time || "",
    kind: "task",
    completed: task.completed,
    reminderEnabled: task.reminderEnabled,
  }));

  const affirmationEntries: PlanEntry[] = [];
  const database = await import("@/utils/database");
  for (const schedule of affirmationSchedules) {
    if (!schedule.enabled || !schedule.days.includes(weekday)) continue;
    const affirmation = await database.getAffirmationById(schedule.affirmationId);
    if (!affirmation) continue;
    for (const [index, time] of schedule.times.entries()) affirmationEntries.push({
      id: `affirmation:${schedule.affirmationId}:${time}:${index}`,
      affirmationId: schedule.affirmationId,
      title: affirmation.text,
      date,
      time,
      kind: "affirmation",
      completed: false,
      reminderEnabled: true,
    });
  }

  return [...habitEntries, ...taskEntries, ...affirmationEntries].sort((a, b) =>
    a.time.localeCompare(b.time) || a.title.localeCompare(b.title)
  );
};

export const getDayCompletion = (items: PlanEntry[]) => {
  const trackable = items.filter(item => item.kind !== "affirmation");
  return {
    completed: trackable.filter(item => item.completed).length,
    total: trackable.length,
  };
};
