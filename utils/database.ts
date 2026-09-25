/** Local durable SQLite storage. Initialization errors must reach the UI. */
import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_AFFIRMATIONS } from './affirmations';
import { localDateKey } from './dates';

const DB_NAME = 'indigo_habits.db';
let db: SQLiteDatabase | null = null;
let dbInitPromise: Promise<void> | null = null;

export const isDatabaseReady = (): boolean => db !== null;
export const waitForDatabase = (): Promise<void> => {
  if (db) return Promise.resolve();
  return dbInitPromise ?? Promise.reject(new Error('Local storage is not initialized.'));
};

const requireDb = (caller: string): SQLiteDatabase => {
  if (!db) throw new Error(`Local storage is unavailable (${caller}). Please restart or retry.`);
  return db;
};

export const initDatabase = async (): Promise<void> => {
  if (db) return;
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    let connection: SQLiteDatabase | null = null;
    try {
      const SQLite = await import('expo-sqlite');
      connection = await SQLite.openDatabaseAsync(DB_NAME);
      // A missing table distinguishes first installation from an existing user
      // who has deliberately removed all their habits.
      const existingHabits = await connection.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'habits'"
      );
      const existingAffirmations = await connection.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'affirmations'"
      );
      await connection.execAsync('PRAGMA foreign_keys = ON;');
        await connection.execAsync(`
          PRAGMA journal_mode = WAL;
          
          -- Affirmations table
          CREATE TABLE IF NOT EXISTS affirmations (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            isCustom INTEGER DEFAULT 0,
            isFavorite INTEGER DEFAULT 0,
            isRepeating INTEGER DEFAULT 0,
            orderIndex INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Habits table
          CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            color TEXT NOT NULL,
            isActive INTEGER DEFAULT 1,
            isRepeating INTEGER DEFAULT 0,
            isFavorite INTEGER DEFAULT 0,
            orderIndex INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Habit completions table (for tracking daily completions)
          CREATE TABLE IF NOT EXISTS habit_completions (
            id TEXT PRIMARY KEY,
            habitId TEXT NOT NULL,
            date TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
            UNIQUE(habitId, date)
          );
          
          -- Journal entries table
          CREATE TABLE IF NOT EXISTS journal_entries (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            photoUri TEXT,
            audioUri TEXT,
            affirmationText TEXT,
            isFavorite INTEGER DEFAULT 0,
            date TEXT NOT NULL,
            createdAt TEXT DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Profile table
          CREATE TABLE IF NOT EXISTS profile (
            id TEXT PRIMARY KEY DEFAULT 'default',
            name TEXT,
            email TEXT,
            photoUri TEXT,
            isPremium INTEGER DEFAULT 0,
            updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(date);
          CREATE INDEX IF NOT EXISTS idx_habit_completions_habitId ON habit_completions(habitId);
          CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
          CREATE INDEX IF NOT EXISTS idx_affirmations_order ON affirmations(orderIndex);
          CREATE INDEX IF NOT EXISTS idx_habits_order ON habits(orderIndex);
        `);

      await connection.execAsync('CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
      await connection.withTransactionAsync(async () => {
        const seeded = await connection!.getFirstAsync("SELECT value FROM app_metadata WHERE key = 'initial_habits'");
        if (!seeded && !existingHabits) {
          const defaults = [
            ['Morning meditation', '#10B981'],
            ['Exercise', '#3B82F6'],
            ['Read 10 pages', '#F59E0B'],
          ];
          for (let i = 0; i < defaults.length; i++) {
            await connection!.runAsync(
              'INSERT OR IGNORE INTO habits (id, title, color, isRepeating, orderIndex) VALUES (?, ?, ?, 1, ?)',
              [`starter_habit_${i}`, defaults[i][0], defaults[i][1], i]
            );
          }
        }
        await connection!.runAsync("INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('initial_habits', '1')");
        const affirmationsSeeded = await connection!.getFirstAsync("SELECT value FROM app_metadata WHERE key = 'initial_affirmations'");
        if (!affirmationsSeeded && !existingAffirmations) {
          for (let i = 0; i < 5; i++) {
            await connection!.runAsync(
              'INSERT OR IGNORE INTO affirmations (id, text, isCustom, isRepeating, orderIndex) VALUES (?, ?, 0, 1, ?)',
              [`starter_affirmation_${i}`, DEFAULT_AFFIRMATIONS[i], i]
            );
          }
        }
        await connection!.runAsync("INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('initial_affirmations', '1')");
        await connection!.runAsync("INSERT OR IGNORE INTO profile (id, name, email, isPremium) VALUES ('default', 'User', '', 0)");
      });
      db = connection;
    } catch (error) {
      if (connection) await connection.closeAsync().catch(() => {});
      throw error;
    }
  })();
  try {
    await dbInitPromise;
  } finally {
    dbInitPromise = null;
  }
};

export const retryDatabaseInit = async (): Promise<boolean> => {
  await initDatabase();
  return isDatabaseReady();
};

// ============================================================================
// AFFIRMATIONS
// ============================================================================

export const getAllAffirmations = async () => {
  const database = requireDb('getAllAffirmations');
  return await database.getAllAsync('SELECT * FROM affirmations ORDER BY orderIndex ASC, createdAt DESC');
};

export const getAffirmationById = async (id: string) => {
  const database = requireDb('getAffirmationById');
  return await database.getFirstAsync('SELECT * FROM affirmations WHERE id = ?', [id]);
};

export const createAffirmation = async (affirmation: {
  id: string;
  text: string;
  isCustom: boolean;
  isFavorite?: boolean;
  isRepeating?: boolean;
  orderIndex?: number;
}) => {
  const database = requireDb('createAffirmation');
  await database.runAsync(
    'INSERT INTO affirmations (id, text, isCustom, isFavorite, isRepeating, orderIndex) VALUES (?, ?, ?, ?, ?, ?)',
    [
      affirmation.id,
      affirmation.text,
      affirmation.isCustom ? 1 : 0,
      affirmation.isFavorite ? 1 : 0,
      affirmation.isRepeating ? 1 : 0,
      affirmation.orderIndex || 0,
    ]
  );
  return affirmation;
};

export const updateAffirmation = async (id: string, updates: {
  text?: string;
  isFavorite?: boolean;
  isRepeating?: boolean;
  orderIndex?: number;
}) => {
  const database = requireDb('updateAffirmation');
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.text !== undefined) {
    fields.push('text = ?');
    values.push(updates.text);
  }
  if (updates.isFavorite !== undefined) {
    fields.push('isFavorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }
  if (updates.isRepeating !== undefined) {
    fields.push('isRepeating = ?');
    values.push(updates.isRepeating ? 1 : 0);
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?');
    values.push(updates.orderIndex);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await database.runAsync(
    `UPDATE affirmations SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteAffirmation = async (id: string) => {
  const database = requireDb('deleteAffirmation');
  await database.runAsync('DELETE FROM affirmations WHERE id = ?', [id]);
};

// ============================================================================
// HABITS
// ============================================================================

export const getAllHabits = async () => {
  const database = requireDb('getAllHabits');
  return await database.getAllAsync('SELECT * FROM habits WHERE isActive = 1 ORDER BY orderIndex ASC, createdAt DESC');
};

export const getHabitById = async (id: string) => {
  const database = requireDb('getHabitById');
  return await database.getFirstAsync('SELECT * FROM habits WHERE id = ?', [id]);
};

export const createHabit = async (habit: {
  id: string;
  title: string;
  color: string;
  isRepeating?: boolean;
  isFavorite?: boolean;
  orderIndex?: number;
}) => {
  const database = requireDb('createHabit');
  await database.runAsync(
    'INSERT INTO habits (id, title, color, isRepeating, isFavorite, orderIndex) VALUES (?, ?, ?, ?, ?, ?)',
    [
      habit.id,
      habit.title,
      habit.color,
      habit.isRepeating ? 1 : 0,
      habit.isFavorite ? 1 : 0,
      habit.orderIndex || 0,
    ]
  );
  return habit;
};

export const updateHabit = async (id: string, updates: {
  title?: string;
  color?: string;
  isRepeating?: boolean;
  isFavorite?: boolean;
  orderIndex?: number;
}) => {
  const database = requireDb('updateHabit');
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.isRepeating !== undefined) {
    fields.push('isRepeating = ?');
    values.push(updates.isRepeating ? 1 : 0);
  }
  if (updates.isFavorite !== undefined) {
    fields.push('isFavorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }
  if (updates.orderIndex !== undefined) {
    fields.push('orderIndex = ?');
    values.push(updates.orderIndex);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await database.runAsync(
    `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteHabit = async (id: string) => {
  const database = requireDb('deleteHabit');
  await database.runAsync('UPDATE habits SET isActive = 0 WHERE id = ?', [id]);
};

// ============================================================================
// HABIT COMPLETIONS
// ============================================================================

export const getHabitCompletion = async (habitId: string, date: string) => {
  const database = requireDb('getHabitCompletion');
  return await database.getFirstAsync(
    'SELECT * FROM habit_completions WHERE habitId = ? AND date = ?',
    [habitId, date]
  );
};

export const setHabitCompletion = async (habitId: string, date: string, completed: boolean) => {
  const database = requireDb('setHabitCompletion');
  const id = `${habitId}_${date}`;
  
  await database.runAsync(
    `INSERT INTO habit_completions (id, habitId, date, completed) 
     VALUES (?, ?, ?, ?)
     ON CONFLICT(habitId, date) DO UPDATE SET completed = ?`,
    [id, habitId, date, completed ? 1 : 0, completed ? 1 : 0]
  );
};

export const getHabitCompletionsForDate = async (date: string) => {
  const database = requireDb('getHabitCompletionsForDate');
  return await database.getAllAsync(
    'SELECT * FROM habit_completions WHERE date = ?',
    [date]
  );
};

export const getHabitCompletionsForRange = async (startDate: string, endDate: string) => {
  const database = requireDb('getHabitCompletionsForRange');
  return await database.getAllAsync(
    'SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
};

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

export const getAllJournalEntries = async () => {
  const database = requireDb('getAllJournalEntries');
  return await database.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC, createdAt DESC');
};

export const getJournalEntryById = async (id: string) => {
  const database = requireDb('getJournalEntryById');
  return await database.getFirstAsync('SELECT * FROM journal_entries WHERE id = ?', [id]);
};

export const getJournalEntriesForDate = async (date: string) => {
  const database = requireDb('getJournalEntriesForDate');
  return await database.getAllAsync('SELECT * FROM journal_entries WHERE date = ?', [date]);
};

export const createJournalEntry = async (entry: {
  id: string;
  content: string;
  photoUri?: string;
  audioUri?: string;
  affirmationText?: string;
  date: string;
}) => {
  const database = requireDb('createJournalEntry');
  await database.runAsync(
    'INSERT INTO journal_entries (id, content, photoUri, audioUri, affirmationText, date, isFavorite) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [entry.id, entry.content, entry.photoUri || null, entry.audioUri || null, entry.affirmationText || null, entry.date, 0]
  );
  return entry;
};

export const updateJournalEntry = async (id: string, updates: {
  content?: string;
  photoUri?: string;
  audioUri?: string;
  affirmationText?: string;
  isFavorite?: boolean;
}) => {
  const database = requireDb('updateJournalEntry');
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.photoUri !== undefined) {
    fields.push('photoUri = ?');
    values.push(updates.photoUri || null);
  }
  if (updates.audioUri !== undefined) {
    fields.push('audioUri = ?');
    values.push(updates.audioUri || null);
  }
  if (updates.affirmationText !== undefined) {
    fields.push('affirmationText = ?');
    values.push(updates.affirmationText || null);
  }
  if (updates.isFavorite !== undefined) {
    fields.push('isFavorite = ?');
    values.push(updates.isFavorite ? 1 : 0);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await database.runAsync(
    `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteJournalEntry = async (id: string) => {
  const database = requireDb('deleteJournalEntry');
  await database.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
};

// ============================================================================
// PROFILE
// ============================================================================

export const getProfile = async () => {
  const database = requireDb('getProfile');
  let profile = await database.getFirstAsync<{ id: string; name: string; email: string; photoUri: string | null; isPremium: number }>('SELECT * FROM profile WHERE id = ?', ['default']);
  
  if (!profile) {
    // Create default profile
    await database.runAsync(
      'INSERT OR IGNORE INTO profile (id, name, email, isPremium) VALUES (?, ?, ?, ?)',
      ['default', 'User', '', 0]
    );
    profile = await database.getFirstAsync<{ id: string; name: string; email: string; photoUri: string | null; isPremium: number }>('SELECT * FROM profile WHERE id = ?', ['default']);
  }
  
  return profile;
};

export const updateProfile = async (updates: {
  name?: string;
  email?: string;
  photoUri?: string;
  profilePicture?: string;
  isPremium?: boolean;
}) => {
  const database = requireDb('updateProfile');
  await database.runAsync("INSERT OR IGNORE INTO profile (id, name, email, isPremium) VALUES ('default', 'User', '', 0)");
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  const profilePhoto = updates.photoUri ?? updates.profilePicture;
  if (profilePhoto !== undefined) {
    fields.push('photoUri = ?');
    values.push(profilePhoto || null);
  }
  if (updates.isPremium !== undefined) {
    fields.push('isPremium = ?');
    values.push(updates.isPremium ? 1 : 0);
  }
  
  if (fields.length === 0) return;
  
  fields.push('updatedAt = CURRENT_TIMESTAMP');
  values.push('default');
  
  await database.runAsync(
    `UPDATE profile SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

// ============================================================================
// PROGRESS & STATS
// ============================================================================

export const getStreakData = async () => {
  const database = requireDb('getStreakData');
  
  // Get all completions ordered by date
  const completions = await database.getAllAsync(`
    SELECT date, COUNT(*) as completed, 
           (SELECT COUNT(*) FROM habits WHERE isActive = 1) as total
    FROM habit_completions 
    WHERE completed = 1
    GROUP BY date 
    ORDER BY date DESC
  `);
  
  // Convert local calendar labels to day ordinals, avoiding UTC-date drift and
  // 23/25-hour daylight-saving days when checking adjacency.
  const dayOrdinal = (date: string): number => {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / 86400000;
  };
  const today = dayOrdinal(localDateKey());
  const days = (completions as { date: string; completed: number }[])
    .map(row => ({ day: dayOrdinal(row.date), completed: row.completed }))
    .filter(row => Number.isFinite(row.day) && row.day <= today);
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  let previousDay: number | undefined;
  let totalCompletions = 0;
  for (const row of days) {
    totalCompletions += row.completed;
    run = previousDay !== undefined && previousDay - row.day === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previousDay = row.day;
  }
  // Yesterday's streak remains active until the user has had today to finish.
  if (days.length && today - days[0].day <= 1) {
    currentStreak = 1;
    for (let i = 1; i < days.length && days[i - 1].day - days[i].day === 1; i++) {
      currentStreak++;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
  };
};

export const getCalendarData = async (startDate: string, endDate: string) => {
  const database = requireDb('getCalendarData');
  
  const data = await database.getAllAsync(`
    SELECT 
      date,
      COUNT(CASE WHEN completed = 1 THEN 1 END) as completed,
      COUNT(*) as total
    FROM habit_completions
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `, [startDate, endDate]);
  
  return data;
};

/**
 * Clear all data from the database (for testing or reset)
 */
export const clearAllData = async () => {
  const database = requireDb('clearAllData');
  await database.execAsync(`
    DELETE FROM affirmations;
    DELETE FROM habit_completions;
    DELETE FROM habits;
    DELETE FROM journal_entries;
    DELETE FROM profile;
  `);
  console.log('[Database] All data cleared');
};
