
export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  createdAt?: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  photoUri?: string;
  date: string;
  createdAt: string;
}

export interface Affirmation {
  id: string;
  text: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  badges: string[];
}

export interface DayStatus {
  date: string;
  completed: boolean;
  habitsCompleted?: number;
  totalHabits?: number;
}
