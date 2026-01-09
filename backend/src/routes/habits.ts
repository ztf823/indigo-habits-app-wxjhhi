import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import * as schema from '../db/schema.js';

const FREE_HABIT_LIMIT = 3;
const PRO_HABIT_LIMIT = 10;

export function registerHabitsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /habits
   * Create a new habit (respects free/pro limits)
   */
  app.fastify.post<{
    Body: { title: string; color: string };
  }>(
    '/api/habits',
    {
      schema: {
        description: 'Create a new habit',
        tags: ['habits'],
        body: {
          type: 'object',
          required: ['title', 'color'],
          properties: {
            title: { type: 'string' },
            color: { type: 'string', description: 'Hex color code' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              color: { type: 'string' },
              isActive: { type: 'boolean' },
              sortOrder: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { title: string; color: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { title, color } = request.body;

      // Check user progress and subscription
      const userProgress = await app.db
        .select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, session.user.id))
        .then((rows) => rows[0]);

      const isPro = userProgress?.isPro || false;
      const limit = isPro ? PRO_HABIT_LIMIT : FREE_HABIT_LIMIT;

      // Count active habits
      const { activeCount } = await app.db
        .select({ activeCount: app.db.$count(schema.habits.id) })
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.userId, session.user.id),
            eq(schema.habits.isActive, true)
          )
        )
        .then((rows) => rows[0] || { activeCount: 0 });

      if (activeCount >= limit) {
        return reply.status(429).send({
          error: `Habit limit reached. Free users: ${FREE_HABIT_LIMIT}, Pro users: ${PRO_HABIT_LIMIT}`,
        });
      }

      // Get next sort order
      const { maxSort } = await app.db
        .select({ maxSort: sql<number>`max(${schema.habits.sortOrder})::int` })
        .from(schema.habits)
        .where(eq(schema.habits.userId, session.user.id))
        .then((rows) => rows[0] || { maxSort: 0 });

      const [habit] = await app.db
        .insert(schema.habits)
        .values({
          userId: session.user.id,
          title,
          color,
          sortOrder: (maxSort || 0) + 1,
        })
        .returning();

      return reply.status(201).send(habit);
    }
  );

  /**
   * GET /habits
   * Get user's active habits
   */
  app.fastify.get<{}>(
    '/api/habits',
    {
      schema: {
        description: 'Get user habits',
        tags: ['habits'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                color: { type: 'string' },
                isActive: { type: 'boolean' },
                sortOrder: { type: 'number' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const habits = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.userId, session.user.id),
            eq(schema.habits.isActive, true)
          )
        )
        .orderBy(schema.habits.sortOrder);

      return habits;
    }
  );

  /**
   * PUT /habits/:id
   * Update a habit (title, color, or soft delete via isActive)
   */
  app.fastify.put<{
    Params: { id: string };
    Body: { title?: string; color?: string; isActive?: boolean };
  }>(
    '/api/habits/:id',
    {
      schema: {
        description: 'Update a habit',
        tags: ['habits'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            color: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              color: { type: 'string' },
              isActive: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { title?: string; color?: string; isActive?: boolean } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { title, color, isActive } = request.body;

      // Verify ownership
      const habit = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.id, id),
            eq(schema.habits.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!habit) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (color !== undefined) updates.color = color;
      if (isActive !== undefined) updates.isActive = isActive;

      const [updated] = await app.db
        .update(schema.habits)
        .set(updates)
        .where(eq(schema.habits.id, id))
        .returning();

      return updated;
    }
  );

  /**
   * DELETE /habits/:id
   * Soft delete a habit (sets isActive to false)
   */
  app.fastify.delete<{
    Params: { id: string };
  }>(
    '/api/habits/:id',
    {
      schema: {
        description: 'Delete a habit (soft delete)',
        tags: ['habits'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          204: { description: 'Habit deleted' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      const habit = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.id, id),
            eq(schema.habits.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!habit) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      // Soft delete by setting isActive to false
      await app.db
        .update(schema.habits)
        .set({ isActive: false })
        .where(eq(schema.habits.id, id));

      return reply.status(204).send();
    }
  );

  /**
   * POST /habits/:id/complete
   * Mark habit complete/incomplete for today
   */
  app.fastify.post<{
    Params: { id: string };
    Body: { completed: boolean; date?: string };
  }>(
    '/api/habits/:id/complete',
    {
      schema: {
        description: 'Toggle habit completion for a date',
        tags: ['habits'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['completed'],
          properties: {
            completed: { type: 'boolean' },
            date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              habitId: { type: 'string' },
              completionDate: { type: 'string' },
              completed: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { completed: boolean; date?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { completed, date } = request.body;

      // Verify habit ownership
      const habit = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.id, id),
            eq(schema.habits.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!habit) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      const completionDate = date || new Date().toISOString().split('T')[0];

      // Check if completion record exists
      const existingCompletion = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(
          and(
            eq(schema.habitCompletions.habitId, id),
            eq(schema.habitCompletions.completionDate, completionDate)
          )
        )
        .then((rows) => rows[0]);

      let completion;
      if (existingCompletion) {
        [completion] = await app.db
          .update(schema.habitCompletions)
          .set({ completed })
          .where(eq(schema.habitCompletions.id, existingCompletion.id))
          .returning();
      } else {
        [completion] = await app.db
          .insert(schema.habitCompletions)
          .values({
            habitId: id,
            userId: session.user.id,
            completionDate,
            completed,
          })
          .returning();
      }

      return completion;
    }
  );

  /**
   * GET /habits/completions
   * Get habit completions for a date range
   */
  app.fastify.get<{
    Querystring: { startDate?: string; endDate?: string; habitId?: string };
  }>(
    '/api/habits/completions',
    {
      schema: {
        description: 'Get habit completions for date range',
        tags: ['habits'],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            habitId: { type: 'string', description: 'Optional specific habit' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              completions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    habitId: { type: 'string' },
                    completionDate: { type: 'string' },
                    completed: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string; habitId?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { startDate, endDate, habitId } = request.query;

      // Default to last 30 days if not specified
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const start = startDate || thirtyDaysAgo.toISOString().split('T')[0];
      const end = endDate || today.toISOString().split('T')[0];

      // Build conditions array
      const conditions = [
        eq(schema.habitCompletions.userId, session.user.id),
        gte(schema.habitCompletions.completionDate, start),
        lte(schema.habitCompletions.completionDate, end),
      ];

      if (habitId) {
        conditions.push(eq(schema.habitCompletions.habitId, habitId));
      }

      const completions = await app.db
        .select()
        .from(schema.habitCompletions)
        .where(and(...conditions))
        .orderBy(desc(schema.habitCompletions.completionDate));

      return { completions };
    }
  );

  /**
   * POST /habits/:id/favorite
   * Toggle favorite status of a habit
   */
  app.fastify.post<{
    Params: { id: string };
  }>(
    '/api/habits/:id/favorite',
    {
      schema: {
        description: 'Toggle habit favorite status',
        tags: ['habits'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              isFavorite: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;

      const habit = await app.db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.id, id),
            eq(schema.habits.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!habit) {
        return reply.status(404).send({ error: 'Habit not found' });
      }

      const [updated] = await app.db
        .update(schema.habits)
        .set({ isFavorite: !habit.isFavorite })
        .where(eq(schema.habits.id, id))
        .returning();

      return { id: updated.id, isFavorite: updated.isFavorite };
    }
  );
}
