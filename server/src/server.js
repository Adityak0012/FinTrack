import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { seedDemo } from './seed/seed.js';

async function start() {
  const inMemory = await connectDB();

  // Fill an empty database with the demo account so the dashboard has data to show
  if (inMemory || (await User.estimatedDocumentCount()) === 0) await seedDemo();

  const app = createApp();
  const server = app.listen(env.port, () => console.log(`[api] FinTrack API running on http://localhost:${env.port}`));

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[api] failed to start:', err.message);
  process.exit(1);
});
