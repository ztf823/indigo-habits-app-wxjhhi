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
  repeatEveryMinutes?: number;
  endTime?: string;
  startDate?: string;
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
const AFFIRMATION_PLAN_COMPLETIONS_KEY = "@indigo_habits/affirmation_plan_completions_v1";
const CURRENT_AFFIRMATION_KEY = "@indigo_habits/current_affirmation_v1";
const DAILY_AFFIRMATIONS_KEY = "@indigo_habits/daily_affirmations_v2";
const LEGACY_DAILY_AFFIRMATIONS_KEY = "@indigo_habits/daily_affirmations_v1";

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

export const timeToMinutes = (time?: string | null): number | null => {
  if (!time) return null;
  const value = time.trim();
  const twelveHour = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2]);
    if (hour < 1 || hour > 12 || minute > 59) return null;
    return (hour % 12 + (/PM/i.test(twelveHour[3]) ? 12 : 0)) * 60 + minute;
  }
  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFourHour) return null;
  const hour = Number(twentyFourHour[1]);
  const minute = Number(twentyFourHour[2]);
  return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
};

export const normalizeTime = (time?: string | null): string | null => {
  const minutes = timeToMinutes(time);
  if (minutes === null) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export const timeToDate = (time?: string | null): Date | null => {
  const minutes = timeToMinutes(time);
  if (minutes === null) return null;
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

export const timeToString = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export const sortTimes = (times: string[]) => [...new Set(times
  .map(normalizeTime)
  .filter((time): time is string => time !== null))]
  .sort((a, b) => (timeToMinutes(a) ?? 0) - (timeToMinutes(b) ?? 0));

export const formatTime = (time?: string | null) => {
  if (!time) return "Any time";
  const minutes = timeToMinutes(time);
  if (minutes === null) return time;
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
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
    time: normalizeTime(schedule.time) || "",
    endTime: normalizeTime(schedule.endTime) || undefined,
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

/** Completed tasks stay in history but no longer count against the active Free plan limit. */
export const getActivePlannedTaskCount = async () =>
  (await getPlannedItems()).filter(item => !item.completed).length;

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

export const getAffirmationPlanCompletions = async (date: string): Promise<string[]> => {
  const all = parseJson<Record<string, string[]>>(await AsyncStorage.getItem(AFFIRMATION_PLAN_COMPLETIONS_KEY), {});
  return all[date] || [];
};

export const setAffirmationPlanEntryCompleted = async (entryId: string, date: string, completed: boolean) => {
  const all = parseJson<Record<string, string[]>>(await AsyncStorage.getItem(AFFIRMATION_PLAN_COMPLETIONS_KEY), {});
  const day = new Set(all[date] || []);
  if (completed) day.add(entryId);
  else day.delete(entryId);
  all[date] = [...day];
  await AsyncStorage.setItem(AFFIRMATION_PLAN_COMPLETIONS_KEY, JSON.stringify(all));
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
    times: sortTimes(schedule.times),
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
export const getDailyAffirmationIds = async (date = getLocalDateKey()): Promise<string[]> => {
  const current = parseJson<Record<string, string[]>>(await AsyncStorage.getItem(DAILY_AFFIRMATIONS_KEY), {});
  if (Array.isArray(current[date])) return [...new Set(current[date])];
  const legacy = parseJson<Record<string, string>>(await AsyncStorage.getItem(LEGACY_DAILY_AFFIRMATIONS_KEY), {});
  return legacy[date] ? [legacy[date]] : [];
};
export const setDailyAffirmationIds = async (ids: string[], date = getLocalDateKey()) => {
  const daily = parseJson<Record<string, string[]>>(await AsyncStorage.getItem(DAILY_AFFIRMATIONS_KEY), {});
  daily[date] = [...new Set(ids)];
  await AsyncStorage.setItem(DAILY_AFFIRMATIONS_KEY, JSON.stringify(daily));
};
export const getDailyAffirmationId = async (date = getLocalDateKey()) => (await getDailyAffirmationIds(date))[0] || null;
export const setDailyAffirmationId = async (id: string, date = getLocalDateKey()) => setDailyAffirmationIds([id], date);

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
  const [habits, completions, schedules, tasks, affirmationSchedules, affirmationCompletions] = await Promise.all([
    getAllHabits() as Promise<any[]>,
    getHabitCompletionsForDate(date) as Promise<any[]>,
    readHabitSchedules(),
    getPlannedItemsForDate(date),
    getAffirmationSchedules(),
    getAffirmationPlanCompletions(date),
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
    if (schedule.paused || !schedule.days.includes(weekday) || (schedule.startDate && date < schedule.startDate)) return [];
    if (habit.isRepeating !== 1 && !schedules[habit.id]) return [];
    const firstTime = normalizeTime(schedule.time) || "";
    const times = schedule.repeatEveryMinutes && firstTime
      ? getIntervalTimes(firstTime, schedule.endTime || "21:00", schedule.repeatEveryMinutes)
      : [firstTime];
    return times.map((time, index) => ({
      id: `habit:${habit.id}:${index}`,
      habitId: habit.id,
      title: habit.title,
      date,
      time,
      kind: "habit" as const,
      completed: completedHabitIds.has(habit.id),
      color: habit.color,
      reminderEnabled: schedule.reminderEnabled,
    }));
  });

  const taskEntries: PlanEntry[] = tasks.map(task => ({
    id: `task:${task.id}`,
    taskId: task.id,
    title: task.title,
    date,
    time: normalizeTime(task.time) || "",
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
      completed: affirmationCompletions.includes(`affirmation:${schedule.affirmationId}:${time}:${index}`),
      reminderEnabled: true,
    });
  }

  return [...habitEntries, ...taskEntries, ...affirmationEntries].sort((a, b) => {
    const aTime = timeToMinutes(a.time);
    const bTime = timeToMinutes(b.time);
    if (aTime === null && bTime !== null) return 1;
    if (bTime === null && aTime !== null) return -1;
    return (aTime ?? 0) - (bTime ?? 0) || a.title.localeCompare(b.title);
  });
};

export const getIntervalTimes = (startTime: string, endTime: string, intervalMinutes: number) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || intervalMinutes < 1 || end < start) return [normalizeTime(startTime) || ""];
  const times: string[] = [];
  for (let minutes = start; minutes <= end; minutes += intervalMinutes) {
    times.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  return times;
};

export const getDayCompletion = (items: PlanEntry[]) => {
  const trackable = items;
  return {
    completed: trackable.filter(item => item.completed).length,
    total: trackable.length,
  };
};
