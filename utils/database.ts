
/**
 * Local SQLite Database for Indigo Habits
 * 
 * All data is stored locally on the device using SQLite.
 * No backend server required.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'indigo_habits.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables
 */
export const initDatabase = async (): Promise<void> => {
  try {
    console.log('[Database] Initializing SQLite database...');
    
    db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create tables
    await db.execAsync(`
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
        affirmationText TEXT,
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
    
    console.log('[Database] Database initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  }
};

/**
 * Get the database instance
 */
const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// ============================================================================
// AFFIRMATIONS
// ============================================================================

export const getAllAffirmations = async () => {
  const database = getDb();
  return await database.getAllAsync('SELECT * FROM affirmations ORDER BY orderIndex ASC, createdAt DESC');
};

export const getAffirmationById = async (id: string) => {
  const database = getDb();
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
  const database = getDb();
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
  const database = getDb();
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
  const database = getDb();
  await database.runAsync('DELETE FROM affirmations WHERE id = ?', [id]);
};

// ============================================================================
// HABITS
// ============================================================================

export const getAllHabits = async () => {
  const database = getDb();
  return await database.getAllAsync('SELECT * FROM habits WHERE isActive = 1 ORDER BY orderIndex ASC, createdAt DESC');
};

export const getHabitById = async (id: string) => {
  const database = getDb();
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
  const database = getDb();
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
  const database = getDb();
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
  const database = getDb();
  await database.runAsync('UPDATE habits SET isActive = 0 WHERE id = ?', [id]);
};

// ============================================================================
// HABIT COMPLETIONS
// ============================================================================

export const getHabitCompletion = async (habitId: string, date: string) => {
  const database = getDb();
  return await database.getFirstAsync(
    'SELECT * FROM habit_completions WHERE habitId = ? AND date = ?',
    [habitId, date]
  );
};

export const setHabitCompletion = async (habitId: string, date: string, completed: boolean) => {
  const database = getDb();
  const id = `${habitId}_${date}`;
  
  await database.runAsync(
    `INSERT INTO habit_completions (id, habitId, date, completed) 
     VALUES (?, ?, ?, ?)
     ON CONFLICT(habitId, date) DO UPDATE SET completed = ?`,
    [id, habitId, date, completed ? 1 : 0, completed ? 1 : 0]
  );
};

export const getHabitCompletionsForDate = async (date: string) => {
  const database = getDb();
  return await database.getAllAsync(
    'SELECT * FROM habit_completions WHERE date = ?',
    [date]
  );
};

export const getHabitCompletionsForRange = async (startDate: string, endDate: string) => {
  const database = getDb();
  return await database.getAllAsync(
    'SELECT * FROM habit_completions WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
};

// ============================================================================
// JOURNAL ENTRIES
// ============================================================================

export const getAllJournalEntries = async () => {
  const database = getDb();
  return await database.getAllAsync('SELECT * FROM journal_entries ORDER BY date DESC, createdAt DESC');
};

export const getJournalEntryById = async (id: string) => {
  const database = getDb();
  return await database.getFirstAsync('SELECT * FROM journal_entries WHERE id = ?', [id]);
};

export const getJournalEntriesForDate = async (date: string) => {
  const database = getDb();
  return await database.getAllAsync('SELECT * FROM journal_entries WHERE date = ?', [date]);
};

export const createJournalEntry = async (entry: {
  id: string;
  content: string;
  photoUri?: string;
  affirmationText?: string;
  date: string;
}) => {
  const database = getDb();
  await database.runAsync(
    'INSERT INTO journal_entries (id, content, photoUri, affirmationText, date) VALUES (?, ?, ?, ?, ?)',
    [entry.id, entry.content, entry.photoUri || null, entry.affirmationText || null, entry.date]
  );
  return entry;
};

export const updateJournalEntry = async (id: string, updates: {
  content?: string;
  photoUri?: string;
  affirmationText?: string;
}) => {
  const database = getDb();
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
  if (updates.affirmationText !== undefined) {
    fields.push('affirmationText = ?');
    values.push(updates.affirmationText || null);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  await database.runAsync(
    `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteJournalEntry = async (id: string) => {
  const database = getDb();
  await database.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
};

// ============================================================================
// PROFILE
// ============================================================================

export const getProfile = async () => {
  const database = getDb();
  let profile = await database.getFirstAsync('SELECT * FROM profile WHERE id = ?', ['default']);
  
  if (!profile) {
    // Create default profile
    await database.runAsync(
      'INSERT INTO profile (id, name, email, isPremium) VALUES (?, ?, ?, ?)',
      ['default', 'User', '', 0]
    );
    profile = await database.getFirstAsync('SELECT * FROM profile WHERE id = ?', ['default']);
  }
  
  return profile;
};

export const updateProfile = async (updates: {
  name?: string;
  email?: string;
  photoUri?: string;
  isPremium?: boolean;
}) => {
  const database = getDb();
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
  if (updates.photoUri !== undefined) {
    fields.push('photoUri = ?');
    values.push(updates.photoUri || null);
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
  const database = getDb();
  
  // Get all completions ordered by date
  const completions = await database.getAllAsync(`
    SELECT date, COUNT(*) as completed, 
           (SELECT COUNT(*) FROM habits WHERE isActive = 1) as total
    FROM habit_completions 
    WHERE completed = 1
    GROUP BY date 
    ORDER BY date DESC
  `);
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalCompletions = 0;
  
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date(today);
  
  // Calculate current streak
  for (const completion of completions as any[]) {
    const completionDate = completion.date;
    const expectedDate = checkDate.toISOString().split('T')[0];
    
    if (completionDate === expectedDate) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate longest streak and total completions
  for (const completion of completions as any[]) {
    totalCompletions += completion.completed;
    tempStreak++;
    
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }
  
  return {
    currentStreak,
    longestStreak,
    totalCompletions,
  };
};

export const getCalendarData = async (startDate: string, endDate: string) => {
  const database = getDb();
  
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
  const database = getDb();
  await database.execAsync(`
    DELETE FROM affirmations;
    DELETE FROM habits;
    DELETE FROM habit_completions;
    DELETE FROM journal_entries;
    DELETE FROM profile;
  `);
  console.log('[Database] All data cleared');
};
