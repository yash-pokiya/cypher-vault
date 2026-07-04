'use strict';
require('./src/config/env'); // validate env vars before anything else
const { connectDB } = require('./src/config/db');
const app = require('./src/app');
const env = require('./src/config/env');

const start = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[server] VAULT running on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received — graceful shutdown...`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('[server] Shutdown complete.');
      process.exit(0);
    });
    // Force exit after 10s if connections don't close
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
