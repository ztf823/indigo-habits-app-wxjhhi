import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and } from 'drizzle-orm';
import { gateway } from '@specific-dev/framework';
import { generateText } from 'ai';
import * as schema from '../db/schema.js';

const FREE_AFFIRMATION_LIMIT = 5;
const AFFIRMATIONS_PER_PAGE = 20;

export function registerAffirmationsRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /affirmations/daily
   * Get up to 3 daily affirmations (prioritize repeating, then favorites, then defaults)
   */
  app.fastify.get<{}>(
    '/api/affirmations/daily',
    {
      schema: {
        description: 'Get daily affirmations (up to 3)',
        tags: ['affirmations'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                isCustom: { type: 'boolean' },
                isRepeating: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const affirmations: any[] = [];

      // Priority 1: Get repeating affirmations
      const repeating = await app.db
        .select()
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.userId, session.user.id),
            eq(schema.affirmations.isRepeating, true)
          )
        );

      if (repeating.length > 0) {
        // Pick up to 2 random repeating affirmations
        const shuffled = repeating.sort(() => Math.random() - 0.5);
        affirmations.push(
          ...shuffled.slice(0, Math.min(2, shuffled.length)).map((a) => ({
            id: a.id,
            text: a.text,
            isCustom: true,
            isRepeating: true,
          }))
        );
      }

      // Priority 2: Fill with favorites if needed
      if (affirmations.length < 3) {
        const favorites = await app.db
          .select()
          .from(schema.affirmations)
          .where(
            and(
              eq(schema.affirmations.userId, session.user.id),
              eq(schema.affirmations.isFavorite, true),
              eq(schema.affirmations.isRepeating, false)
            )
          );

        const shuffled = favorites.sort(() => Math.random() - 0.5);
        const needed = 3 - affirmations.length;
        affirmations.push(
          ...shuffled.slice(0, Math.min(needed, shuffled.length)).map((a) => ({
            id: a.id,
            text: a.text,
            isCustom: true,
            isRepeating: false,
          }))
        );
      }

      // Priority 3: Fill with defaults for offline use
      if (affirmations.length < 3) {
        const allDefaults = await app.db.select().from(schema.defaultAffirmations);
        if (allDefaults.length > 0) {
          const shuffled = allDefaults.sort(() => Math.random() - 0.5);
          const needed = 3 - affirmations.length;
          affirmations.push(
            ...shuffled.slice(0, Math.min(needed, shuffled.length)).map((a) => ({
              id: a.id,
              text: a.text,
              isCustom: false,
              isRepeating: false,
            }))
          );
        }
      }

      return affirmations;
    }
  );

  /**
   * POST /affirmations/generate
   * Generate a new affirmation using AI (respects free user limits)
   */
  app.fastify.post<{
    Body: { prompt?: string };
  }>(
    '/api/affirmations/generate',
    {
      schema: {
        description: 'Generate an affirmation using AI',
        tags: ['affirmations'],
        body: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'Optional custom prompt' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              isCustom: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { prompt?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      // Check user progress and subscription
      const userProgress = await app.db
        .select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, session.user.id))
        .then((rows) => rows[0]);

      // Check free user limits
      if (!userProgress?.isPro) {
        if ((userProgress?.freeAffirmationsUsed || 0) >= FREE_AFFIRMATION_LIMIT) {
          return reply.status(429).send({
            error: `Free users limited to ${FREE_AFFIRMATION_LIMIT} generated affirmations. Upgrade to Pro for unlimited.`,
          });
        }
      }

      const { prompt } = request.body;

      try {
        const { text: generatedText } = await generateText({
          model: gateway('openai/gpt-5.2'),
          prompt: prompt || 'Generate a single positive, uplifting daily affirmation in 1-2 sentences. Make it personal, actionable, and inspiring.',
        });

        // Save to database as custom affirmation
        const [affirmation] = await app.db
          .insert(schema.affirmations)
          .values({
            userId: session.user.id,
            text: generatedText,
            isCustom: true,
            isFavorite: false,
            isRepeating: false,
          })
          .returning();

        // Update free affirmations count for free users
        if (!userProgress?.isPro) {
          if (userProgress) {
            await app.db
              .update(schema.userProgress)
              .set({ freeAffirmationsUsed: (userProgress.freeAffirmationsUsed || 0) + 1 })
              .where(eq(schema.userProgress.userId, session.user.id));
          } else {
            await app.db
              .insert(schema.userProgress)
              .values({
                userId: session.user.id,
                freeAffirmationsUsed: 1,
              })
              .onConflictDoUpdate({
                target: schema.userProgress.userId,
                set: { freeAffirmationsUsed: (userProgress?.freeAffirmationsUsed || 0) + 1 },
              });
          }
        }

        return reply.status(201).send({
          id: affirmation.id,
          text: affirmation.text,
          isCustom: true,
        });
      } catch (error) {
        app.logger.error(error, 'Affirmation generation failed');
        return reply.status(500).send({ error: 'Failed to generate affirmation' });
      }
    }
  );

  /**
   * POST /affirmations/custom
   * Create a custom affirmation
   */
  app.fastify.post<{
    Body: { text: string };
  }>(
    '/api/affirmations/custom',
    {
      schema: {
        description: 'Create a custom affirmation',
        tags: ['affirmations'],
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              isCustom: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { text: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { text } = request.body;

      const [affirmation] = await app.db
        .insert(schema.affirmations)
        .values({
          userId: session.user.id,
          text,
          isCustom: true,
          isFavorite: false,
          isRepeating: false,
        })
        .returning();

      return reply.status(201).send({
        id: affirmation.id,
        text: affirmation.text,
        isCustom: true,
        isRepeating: false,
      });
    }
  );

  /**
   * GET /affirmations/favorites
   * Get user's favorite affirmations
   */
  app.fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>(
    '/api/affirmations/favorites',
    {
      schema: {
        description: 'Get favorite affirmations',
        tags: ['affirmations'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '20' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              affirmations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    isCustom: { type: 'boolean' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(parseInt(request.query.limit || String(AFFIRMATIONS_PER_PAGE)), 100);
      const offset = parseInt(request.query.offset || '0');

      const affirmations = await app.db
        .select()
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.userId, session.user.id),
            eq(schema.affirmations.isFavorite, true)
          )
        )
        .orderBy(desc(schema.affirmations.createdAt))
        .limit(limit)
        .offset(offset);

      const { total } = await app.db
        .select({ total: app.db.$count(schema.affirmations.id) })
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.userId, session.user.id),
            eq(schema.affirmations.isFavorite, true)
          )
        )
        .then((rows) => rows[0] || { total: 0 });

      return { affirmations, total };
    }
  );

  /**
   * POST /affirmations/:id/favorite
   * Toggle favorite status
   */
  app.fastify.post<{
    Params: { id: string };
  }>(
    '/api/affirmations/:id/favorite',
    {
      schema: {
        description: 'Toggle affirmation favorite status',
        tags: ['affirmations'],
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
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      const affirmation = await app.db
        .select()
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.id, id),
            eq(schema.affirmations.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!affirmation) {
        return reply.status(404).send({ error: 'Affirmation not found' });
      }

      const [updated] = await app.db
        .update(schema.affirmations)
        .set({ isFavorite: !affirmation.isFavorite })
        .where(eq(schema.affirmations.id, id))
        .returning();

      return { id: updated.id, isFavorite: updated.isFavorite };
    }
  );

  /**
   * GET /affirmations
   * Get all user affirmations (custom + defaults)
   */
  app.fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>(
    '/api/affirmations',
    {
      schema: {
        description: 'Get all affirmations',
        tags: ['affirmations'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '20' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              affirmations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    isCustom: { type: 'boolean' },
                    isFavorite: { type: 'boolean' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(parseInt(request.query.limit || String(AFFIRMATIONS_PER_PAGE)), 100);
      const offset = parseInt(request.query.offset || '0');

      // Get user custom affirmations
      const customAffirmations = await app.db
        .select()
        .from(schema.affirmations)
        .where(eq(schema.affirmations.userId, session.user.id))
        .orderBy(desc(schema.affirmations.createdAt));

      // Get default affirmations
      const defaultAffirmations = await app.db
        .select()
        .from(schema.defaultAffirmations)
        .limit(limit - customAffirmations.length)
        .offset(Math.max(0, offset - customAffirmations.length));

      // Combine results
      const combined = [
        ...customAffirmations.map((a) => ({
          id: a.id,
          text: a.text,
          isCustom: true,
          isFavorite: a.isFavorite,
        })),
        ...defaultAffirmations.map((a) => ({
          id: a.id,
          text: a.text,
          isCustom: false,
          isFavorite: false,
        })),
      ].slice(offset, offset + limit);

      const { customCount } = await app.db
        .select({ customCount: app.db.$count(schema.affirmations.id) })
        .from(schema.affirmations)
        .where(eq(schema.affirmations.userId, session.user.id))
        .then((rows) => rows[0] || { customCount: 0 });

      const { defaultCount } = await app.db
        .select({ defaultCount: app.db.$count(schema.defaultAffirmations.id) })
        .from(schema.defaultAffirmations)
        .then((rows) => rows[0] || { defaultCount: 0 });

      return {
        affirmations: combined,
        total: customCount + defaultCount,
      };
    }
  );

  /**
   * POST /affirmations/:id/repeat
   * Set an affirmation as a daily repeating routine
   */
  app.fastify.post<{
    Params: { id: string };
  }>(
    '/api/affirmations/:id/repeat',
    {
      schema: {
        description: 'Toggle affirmation repeating status',
        tags: ['affirmations'],
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
              isRepeating: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;

      const affirmation = await app.db
        .select()
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.id, id),
            eq(schema.affirmations.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!affirmation) {
        return reply.status(404).send({ error: 'Affirmation not found' });
      }

      const [updated] = await app.db
        .update(schema.affirmations)
        .set({ isRepeating: !affirmation.isRepeating })
        .where(eq(schema.affirmations.id, id))
        .returning();

      return { id: updated.id, isRepeating: updated.isRepeating };
    }
  );

  /**
   * GET /affirmations/repeating
   * Get all user's repeating affirmations
   */
  app.fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>(
    '/api/affirmations/repeating',
    {
      schema: {
        description: 'Get repeating affirmations',
        tags: ['affirmations'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '20' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              affirmations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    isRepeating: { type: 'boolean' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(parseInt(request.query.limit || String(AFFIRMATIONS_PER_PAGE)), 100);
      const offset = parseInt(request.query.offset || '0');

      const affirmations = await app.db
        .select()
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.userId, session.user.id),
            eq(schema.affirmations.isRepeating, true)
          )
        )
        .orderBy(desc(schema.affirmations.createdAt))
        .limit(limit)
        .offset(offset);

      const { total } = await app.db
        .select({ total: app.db.$count(schema.affirmations.id) })
        .from(schema.affirmations)
        .where(
          and(
            eq(schema.affirmations.userId, session.user.id),
            eq(schema.affirmations.isRepeating, true)
          )
        )
        .then((rows) => rows[0] || { total: 0 });

      return { affirmations, total };
    }
  );
}
