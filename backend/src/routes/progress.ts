import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';

interface CalendarDay {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt?: string;
}

const BADGES: Record<string, Badge> = {
  '7day': {
    id: '7day',
    name: '7-Day Streak',
    description: 'Completed all habits for 7 consecutive days',
  },
  '30day': {
    id: '30day',
    name: 'Monthly Master',
    description: 'Completed all habits for 30 consecutive days',
  },
  '100completions': {
    id: '100completions',
    name: '100 Completions',
    description: 'Achieved 100 total habit completions',
  },
  '500completions': {
    id: '500completions',
    name: '500 Completions',
    description: 'Achieved 500 total habit completions',
  },
  '1000completions': {
    id: '1000completions',
    name: '1000 Completions',
    description: 'Achieved 1000 total habit completions',
  },
};

export function registerProgressRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /progress
   * Get user progress stats, streaks, and badges
   */
  app.fastify.get<{}>(
    '/api/progress',
    {
      schema: {
        description: 'Get user progress stats',
        tags: ['progress'],
        response: {
          200: {
            type: 'object',
            properties: {
              currentStreak: { type: 'number' },
              longestStreak: { type: 'number' },
              totalCompletions: { type: 'number' },
              badges: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    earned: { type: 'boolean' },
                  },
                },
              },
              isPro: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      let userProgress = await app.db
        .select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, session.user.id))
        .then((rows) => rows[0]);

      // Create default progress record if doesn't exist
      if (!userProgress) {
        [userProgress] = await app.db
          .insert(schema.userProgress)
          .values({
            userId: session.user.id,
          })
          .returning();
      }

      // Format badges
      const badgeIds = (userProgress.badges as string[]) || [];
      const badges = Object.values(BADGES).map((badge) => ({
        ...badge,
        earned: badgeIds.includes(badge.id),
      }));

      return {
        currentStreak: userProgress.currentStreak || 0,
        longestStreak: userProgress.longestStreak || 0,
        totalCompletions: userProgress.totalCompletions || 0,
        badges,
        isPro: userProgress.isPro || false,
      };
    }
  );

  /**
   * GET /progress/calendar
   * Get calendar view of completions for a month
   */
  app.fastify.get<{
    Querystring: { month?: string; year?: string };
  }>(
    '/api/progress/calendar',
    {
      schema: {
        description: 'Get calendar view of habit completions',
        tags: ['progress'],
        querystring: {
          type: 'object',
          properties: {
            month: { type: 'string', description: 'Month (1-12), defaults to current' },
            year: { type: 'string', description: 'Year, defaults to current' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              month: { type: 'number' },
              year: { type: 'number' },
              calendar: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    completed: { type: 'number' },
                    total: { type: 'number' },
                    percentage: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { month?: string; year?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const today = new Date();
      const month = parseInt(request.query.month || String(today.getMonth() + 1));
      const year = parseInt(request.query.year || String(today.getFullYear()));

      // Get all active habits for user
      const activeHabits = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.userId, session.user.id),
            eq(schema.habits.isActive, true)
          )
        );

      if (activeHabits.length === 0) {
        return {
          month,
          year,
          calendar: [],
        };
      }

      const habitIds = activeHabits.map((h) => h.id);

      // Calculate days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const calendar: CalendarDay[] = [];

      // Get all completions for the month
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const completions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(
          and(
            eq(schema.habitCompletions.userId, session.user.id),
            gte(schema.habitCompletions.completionDate, monthStart),
            lte(schema.habitCompletions.completionDate, monthEnd)
          )
        );

      // Build calendar
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const dayCompletions = completions.filter((c) => c.completionDate === dateStr && c.completed);
        const completed = dayCompletions.length;
        const total = activeHabits.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        calendar.push({
          date: dateStr,
          completed,
          total,
          percentage,
        });
      }

      return {
        month,
        year,
        calendar,
      };
    }
  );

  /**
   * POST /progress/calculate
   * Recalculate streaks and award badges
   */
  app.fastify.post<{}>(
    '/api/progress/calculate',
    {
      schema: {
        description: 'Recalculate streaks and badges',
        tags: ['progress'],
        response: {
          200: {
            type: 'object',
            properties: {
              currentStreak: { type: 'number' },
              longestStreak: { type: 'number' },
              totalCompletions: { type: 'number' },
              badgesAwarded: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Get user progress
      let userProgress = await app.db
        .select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, session.user.id))
        .then((rows) => rows[0]);

      if (!userProgress) {
        [userProgress] = await app.db
          .insert(schema.userProgress)
          .values({ userId: session.user.id })
          .returning();
      }

      // Get all active habits
      const activeHabits = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.userId, session.user.id),
            eq(schema.habits.isActive, true)
          )
        );

      if (activeHabits.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: userProgress.longestStreak || 0,
          totalCompletions: 0,
          badgesAwarded: [],
        };
      }

      // Get all completions
      const allCompletions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(eq(schema.habitCompletions.userId, session.user.id))
        .orderBy(desc(schema.habitCompletions.completionDate));

      // Calculate total completions
      const totalCompletions = allCompletions.filter((c) => c.completed).length;

      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(
        allCompletions,
        activeHabits.length
      );

      // Determine earned badges
      const existingBadges = (userProgress.badges as string[]) || [];
      const badgesAwarded: string[] = [];

      if (currentStreak >= 7 && !existingBadges.includes('7day')) {
        badgesAwarded.push('7day');
      }
      if (currentStreak >= 30 && !existingBadges.includes('30day')) {
        badgesAwarded.push('30day');
      }
      if (totalCompletions >= 100 && !existingBadges.includes('100completions')) {
        badgesAwarded.push('100completions');
      }
      if (totalCompletions >= 500 && !existingBadges.includes('500completions')) {
        badgesAwarded.push('500completions');
      }
      if (totalCompletions >= 1000 && !existingBadges.includes('1000completions')) {
        badgesAwarded.push('1000completions');
      }

      // Update progress
      const newBadges = [...new Set([...existingBadges, ...badgesAwarded])];
      await app.db
        .update(schema.userProgress)
        .set({
          currentStreak,
          longestStreak: Math.max(longestStreak, userProgress.longestStreak || 0),
          totalCompletions,
          badges: newBadges,
        })
        .where(eq(schema.userProgress.userId, session.user.id));

      return {
        currentStreak,
        longestStreak: Math.max(longestStreak, userProgress.longestStreak || 0),
        totalCompletions,
        badgesAwarded,
      };
    }
  );
}

/**
 * Helper function to calculate current and longest streaks
 * Considers a day complete if ALL habits are completed
 */
function calculateStreaks(
  allCompletions: typeof schema.habitCompletions.$inferSelect[],
  totalHabits: number
) {
  if (totalHabits === 0 || allCompletions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Group completions by date
  const completionsByDate = new Map<string, boolean[]>();

  for (const completion of allCompletions) {
    if (!completionsByDate.has(completion.completionDate)) {
      completionsByDate.set(completion.completionDate, []);
    }
    if (completion.completed) {
      completionsByDate.get(completion.completionDate)!.push(true);
    }
  }

  // Convert to array of dates with completion status
  const dateArray = Array.from(completionsByDate.entries())
    .map(([date, completions]) => ({
      date,
      isComplete: completions.length === totalHabits, // All habits completed
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  // Calculate current streak from today backwards
  const today = new Date().toISOString().split('T')[0];
  let expectedDate = new Date(today);

  for (const entry of dateArray) {
    const entryDate = new Date(entry.date);
    const daysDiff = Math.floor(
      (expectedDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0 || daysDiff === 1) {
      if (entry.isComplete) {
        streak++;
      } else if (currentStreak === 0) {
        break;
      }
      expectedDate = new Date(entryDate.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  currentStreak = streak;
  longestStreak = currentStreak;

  // Find longest streak overall
  streak = 0;
  for (const entry of dateArray) {
    if (entry.isComplete) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { currentStreak, longestStreak };
}
