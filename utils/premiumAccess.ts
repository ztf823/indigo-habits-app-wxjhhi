import { getAllHabits } from '@/utils/database';
import { cancelHabitReminder, getJournalReminderSettings, saveJournalReminderSettings } from '@/utils/notifications';
import { getAllHabitSchedules, saveHabitSchedule } from '@/utils/planner';

/** Cancel features that must not continue delivering after Premium expires. */
export async function disablePremiumOnlyReminders(): Promise<void> {
  const journal = await getJournalReminderSettings();
  if (journal.enabled) {
    await saveJournalReminderSettings({ ...journal, enabled: false });
  }

  const [habits, schedules] = await Promise.all([getAllHabits(), getAllHabitSchedules()]);
  for (const habit of habits as { id: string }[]) {
    const schedule = schedules[habit.id];
    if (!schedule?.reminderEnabled) continue;
    await saveHabitSchedule(habit.id, { ...schedule, reminderEnabled: false });
    await cancelHabitReminder(habit.id);
  }
}
