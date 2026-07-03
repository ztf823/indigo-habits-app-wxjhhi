import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';
import { seedDefaultAffirmations } from './db/seed.js';

// Import route registration functions
import { registerJournalRoutes } from './routes/journal.js';
import { registerAffirmationsRoutes } from './routes/affirmations.js';
import { registerHabitsRoutes } from './routes/habits.js';
import { registerProgressRoutes } from './routes/progress.js';
import { registerProfileRoutes } from './routes/profile.js';

// Combine both schemas
const schema = { ...appSchema, ...authSchema };

// Create application with combined schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable Better Auth with Google and Apple OAuth
app.withAuth();

// Enable storage for photo uploads
app.withStorage();

// Seed default affirmations
await seedDefaultAffirmations(app);

// Register routes
registerProfileRoutes(app);
registerJournalRoutes(app);
registerAffirmationsRoutes(app);
registerHabitsRoutes(app);
registerProgressRoutes(app);

await app.run();
app.logger.info('Application running');
