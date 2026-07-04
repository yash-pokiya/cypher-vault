'use strict';
const mongoose = require('mongoose');
const env = require('./env');

const MAX_RETRIES = 5;

async function connectDB(attempt = 1) {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      console.error(`[db] Failed to connect after ${MAX_RETRIES} attempts. Exiting.`);
      process.exit(1);
    }
    const delay = 2000 * Math.pow(2, attempt - 1);
    console.warn(`[db] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
    await new Promise((r) => setTimeout(r, delay));
    return connectDB(attempt + 1);
  }
}

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected.'));
mongoose.connection.on('error', (err) => console.error('[db] MongoDB error:', err.message));

module.exports = { connectDB };
