import type { App } from '../index.js';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';
import affirmationsData from './seed-affirmations.js';

/**
 * Seed the database with default affirmations on first deployment
 */
export async function seedDefaultAffirmations(app: App) {
  try {
    // Check if affirmations already exist
    const { count } = await app.db
      .select({ count: app.db.$count(schema.defaultAffirmations.id) })
      .from(schema.defaultAffirmations)
      .then((rows) => rows[0] || { count: 0 });

    if (count > 0) {
      app.logger.info(`Affirmations table already seeded with ${count} entries`);
      return;
    }

    app.logger.info('Seeding default affirmations...');

    // Insert affirmations in batches to avoid overloading the database
    const batchSize = 50;
    for (let i = 0; i < affirmationsData.length; i += batchSize) {
      const batch = affirmationsData.slice(i, i + batchSize);
      const values = batch.map((text) => ({ text }));

      await app.db.insert(schema.defaultAffirmations).values(values);

      app.logger.debug(`Seeded ${Math.min(i + batchSize, affirmationsData.length)} affirmations`);
    }

    app.logger.info(`Successfully seeded ${affirmationsData.length} default affirmations`);
  } catch (error) {
    app.logger.error(error, 'Failed to seed affirmations');
    // Don't fail startup if seeding fails
  }
}
