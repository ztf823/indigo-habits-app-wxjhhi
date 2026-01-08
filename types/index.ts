
export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  icon?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  photoUri?: string;
}

export interface DayStatus {
  date: string;
  completed: boolean;
  habitsCompleted: number;
  totalHabits: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}
