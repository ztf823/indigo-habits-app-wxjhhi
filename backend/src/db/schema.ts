import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';
import { relations } from 'drizzle-orm';

/**
 * Journal Entries Table
 * Stores journal entries with optional photos
 */
export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    photoUrl: text('photo_url'),
    photoKey: text('photo_key'), // Storage key for uploaded photos
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('journal_entries_user_id_idx').on(table.userId),
    index('journal_entries_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Default Affirmations Table
 * Pre-populated with 500 inspirational affirmations
 */
export const defaultAffirmations = pgTable(
  'default_affirmations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    text: text('text').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

/**
 * User Affirmations Table
 * Stores custom affirmations and favorites
 */
export const affirmations = pgTable(
  'affirmations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    isCustom: boolean('is_custom').default(false).notNull(),
    isFavorite: boolean('is_favorite').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('affirmations_user_id_idx').on(table.userId),
    index('affirmations_is_favorite_idx').on(table.isFavorite),
  ]
);

/**
 * Habits Table
 * Stores user habits with soft delete via is_active flag
 */
export const habits = pgTable(
  'habits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    color: text('color').notNull(), // Hex color like #FF5733
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('habits_user_id_idx').on(table.userId),
    index('habits_is_active_idx').on(table.isActive),
  ]
);

/**
 * Habit Completions Table
 * Tracks daily completion status for each habit
 */
export const habitCompletions = pgTable(
  'habit_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    habitId: uuid('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    completionDate: date('completion_date', { mode: 'string' }).notNull(),
    completed: boolean('completed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('habit_completions_user_id_idx').on(table.userId),
    index('habit_completions_habit_id_idx').on(table.habitId),
    index('habit_completions_date_idx').on(table.completionDate),
  ]
);

/**
 * User Progress Table
 * Stores streaks, badge achievements, and subscription status
 */
export const userProgress = pgTable(
  'user_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    totalCompletions: integer('total_completions').default(0).notNull(),
    badges: jsonb('badges').default([]).notNull(), // Array of badge IDs: ["7day", "30day", "100completions", etc.]
    isPro: boolean('is_pro').default(false).notNull(),
    freeAffirmationsUsed: integer('free_affirmations_used').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('user_progress_user_id_idx').on(table.userId),
  ]
);

/**
 * Relations for Drizzle Query API
 */
export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(user, {
    fields: [journalEntries.userId],
    references: [user.id],
  }),
}));

export const affirmationsRelations = relations(affirmations, ({ one }) => ({
  user: one(user, {
    fields: [affirmations.userId],
    references: [user.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(user, {
    fields: [habits.userId],
    references: [user.id],
  }),
  completions: many(habitCompletions),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  user: one(user, {
    fields: [habitCompletions.userId],
    references: [user.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(user, {
    fields: [userProgress.userId],
    references: [user.id],
  }),
}));
