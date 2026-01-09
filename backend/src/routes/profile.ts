import type { App } from '../index.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import { user } from '../db/auth-schema.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function registerProfileRoutes(app: App) {
  const requireAuth = app.requireAuth();

  /**
   * GET /api/profile
   * Get user profile information
   */
  app.fastify.get<{}>(
    '/api/profile',
    {
      schema: {
        description: 'Get user profile',
        tags: ['profile'],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              profilePictureUrl: { type: ['string', 'null'] },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userRecord = await app.db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .then((rows) => rows[0]);

      if (!userRecord) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        profilePictureUrl: userRecord.image,
        createdAt: userRecord.createdAt,
      };
    }
  );

  /**
   * PUT /api/profile
   * Update user profile (name and/or profile picture URL)
   */
  app.fastify.put<{
    Body: { name?: string; profilePictureUrl?: string };
  }>(
    '/api/profile',
    {
      schema: {
        description: 'Update user profile',
        tags: ['profile'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'User display name' },
            profilePictureUrl: { type: 'string', description: 'Profile picture URL' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              profilePictureUrl: { type: ['string', 'null'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { name?: string; profilePictureUrl?: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { name, profilePictureUrl } = request.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (profilePictureUrl !== undefined) updates.image = profilePictureUrl;

      const [updated] = await app.db
        .update(user)
        .set(updates)
        .where(eq(user.id, session.user.id))
        .returning();

      return {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        profilePictureUrl: updated.image,
      };
    }
  );

  /**
   * POST /api/profile/picture
   * Upload profile picture (jpg, png, webp, max 5MB)
   */
  app.fastify.post<{}>(
    '/api/profile/picture',
    {
      schema: {
        description: 'Upload profile picture',
        tags: ['profile'],
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

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
        return reply.status(400).send({
          error: `Invalid file type. Allowed types: jpg, png, webp`,
        });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        return reply.status(413).send({ error: 'File too large (max 5MB)' });
      }

      // Validate file size
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(413).send({ error: 'File too large (max 5MB)' });
      }

      const fileExtension = data.mimetype.split('/')[1];
      const key = `profiles/${session.user.id}/picture-${Date.now()}.${fileExtension}`;

      try {
        // Delete old profile picture if exists
        const userRecord = await app.db
          .select()
          .from(user)
          .where(eq(user.id, session.user.id))
          .then((rows) => rows[0]);

        if (userRecord?.profilePictureKey) {
          try {
            await app.storage.delete(userRecord.profilePictureKey);
          } catch (err) {
            app.logger.warn(err, 'Failed to delete old profile picture');
          }
        }

        // Upload new picture
        const uploadedKey = await app.storage.upload(key, buffer);
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Update user record with new picture
        await app.db
          .update(user)
          .set({ image: url, profilePictureKey: uploadedKey })
          .where(eq(user.id, session.user.id));

        return { url, key: uploadedKey };
      } catch (error) {
        app.logger.error(error, 'Profile picture upload failed');
        return reply.status(500).send({ error: 'Upload failed' });
      }
    }
  );

  /**
   * DELETE /api/profile/picture
   * Delete user's profile picture
   */
  app.fastify.delete<{}>(
    '/api/profile/picture',
    {
      schema: {
        description: 'Delete profile picture',
        tags: ['profile'],
        response: {
          204: { description: 'Picture deleted' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userRecord = await app.db
        .select()
        .from(user)
        .where(eq(user.id, session.user.id))
        .then((rows) => rows[0]);

      if (!userRecord?.profilePictureKey) {
        return reply.status(404).send({ error: 'No profile picture to delete' });
      }

      try {
        await app.storage.delete(userRecord.profilePictureKey);

        // Clear picture from user record
        await app.db
          .update(user)
          .set({ image: null, profilePictureKey: null })
          .where(eq(user.id, session.user.id));

        return reply.status(204).send();
      } catch (error) {
        app.logger.error(error, 'Profile picture deletion failed');
        return reply.status(500).send({ error: 'Deletion failed' });
      }
    }
  );
}
