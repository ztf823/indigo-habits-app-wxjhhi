import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';

export function registerJournalRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * POST /journal-entries
   * Create a new journal entry with optional photo
   */
  app.fastify.post<{
    Body: { content: string; photoUrl?: string };
  }>(
    '/api/journal-entries',
    {
      schema: {
        description: 'Create a new journal entry',
        tags: ['journal'],
        body: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', description: 'Journal content' },
            photoUrl: { type: 'string', description: 'Optional photo URL' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              content: { type: 'string' },
              photoUrl: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { content: string; photoUrl?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { content, photoUrl } = request.body;

      const [entry] = await app.db
        .insert(schema.journalEntries)
        .values({
          userId: session.user.id,
          content,
          photoUrl,
        })
        .returning();

      return reply.status(201).send(entry);
    }
  );

  /**
   * GET /journal-entries
   * Get user's journal entries with pagination
   */
  app.fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>(
    '/api/journal-entries',
    {
      schema: {
        description: 'Get user journal entries',
        tags: ['journal'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', default: '10' },
            offset: { type: 'string', default: '0' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              entries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    content: { type: 'string' },
                    photoUrl: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
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

      const limit = Math.min(parseInt(request.query.limit || '10'), 100);
      const offset = parseInt(request.query.offset || '0');

      const entries = await app.db
        .select()
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .orderBy(desc(schema.journalEntries.createdAt))
        .limit(limit)
        .offset(offset);

      const { total } = await app.db
        .select({ total: app.db.$count(schema.journalEntries.id) })
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, session.user.id))
        .then((rows) => rows[0] || { total: 0 });

      return { entries, total };
    }
  );

  /**
   * PUT /journal-entries/:id
   * Update a journal entry
   */
  app.fastify.put<{
    Params: { id: string };
    Body: { content?: string; photoUrl?: string };
  }>(
    '/api/journal-entries/:id',
    {
      schema: {
        description: 'Update a journal entry',
        tags: ['journal'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            photoUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              photoUrl: { type: ['string', 'null'] },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: { content?: string; photoUrl?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { content, photoUrl } = request.body;

      // Verify ownership
      const entry = await app.db
        .select()
        .from(schema.journalEntries)
        .where(
          and(
            eq(schema.journalEntries.id, id),
            eq(schema.journalEntries.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!entry) {
        return reply.status(404).send({ error: 'Journal entry not found' });
      }

      const updates: any = {};
      if (content !== undefined) updates.content = content;
      if (photoUrl !== undefined) updates.photoUrl = photoUrl;

      const [updated] = await app.db
        .update(schema.journalEntries)
        .set(updates)
        .where(eq(schema.journalEntries.id, id))
        .returning();

      return updated;
    }
  );

  /**
   * DELETE /journal-entries/:id
   * Delete a journal entry
   */
  app.fastify.delete<{
    Params: { id: string };
  }>(
    '/api/journal-entries/:id',
    {
      schema: {
        description: 'Delete a journal entry',
        tags: ['journal'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          204: { description: 'Entry deleted' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };

      const entry = await app.db
        .select()
        .from(schema.journalEntries)
        .where(
          and(
            eq(schema.journalEntries.id, id),
            eq(schema.journalEntries.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!entry) {
        return reply.status(404).send({ error: 'Journal entry not found' });
      }

      await app.db
        .delete(schema.journalEntries)
        .where(eq(schema.journalEntries.id, id));

      return reply.status(204).send();
    }
  );

  /**
   * POST /upload/photo
   * Upload a photo for journal entry
   */
  app.fastify.post<{}>(
    '/api/upload/photo',
    {
      schema: {
        description: 'Upload a photo for journal entry',
        tags: ['journal'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        return reply.status(413).send({ error: 'File too large (max 10MB)' });
      }

      const key = `journal/${session.user.id}/${Date.now()}-${data.filename}`;

      try {
        const uploadedKey = await app.storage.upload(key, buffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        return { url, key: uploadedKey };
      } catch (error) {
        app.logger.error(error, 'Photo upload failed');
        return reply.status(500).send({ error: 'Upload failed' });
      }
    }
  );

  /**
   * POST /journal-entries/:id/favorite
   * Toggle favorite status of a journal entry
   */
  app.fastify.post<{
    Params: { id: string };
  }>(
    '/api/journal-entries/:id/favorite',
    {
      schema: {
        description: 'Toggle journal entry favorite status',
        tags: ['journal'],
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

      const entry = await app.db
        .select()
        .from(schema.journalEntries)
        .where(
          and(
            eq(schema.journalEntries.id, id),
            eq(schema.journalEntries.userId, session.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!entry) {
        return reply.status(404).send({ error: 'Journal entry not found' });
      }

      const [updated] = await app.db
        .update(schema.journalEntries)
        .set({ isFavorite: !entry.isFavorite })
        .where(eq(schema.journalEntries.id, id))
        .returning();

      return { id: updated.id, isFavorite: updated.isFavorite };
    }
  );
}
