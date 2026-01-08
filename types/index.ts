
export interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  photoUri?: string;
}

export type DayStatus = 'complete' | 'incomplete' | 'none';
