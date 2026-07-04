'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { error: errorResponse } = require('./utils/response.util');

const authRoutes = require('./routes/auth.routes');
const fileRoutes = require('./routes/file.routes');
const keyRoutes = require('./routes/key.routes');
const profileRoutes = require('./routes/profile.routes');

const folderRoutes = require('./routes/folder.routes');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
  })
);

// ─── Body Parsers ──────────────────────────────────────────────────────────
// JSON limited to 10kb — file uploads use multipart (multer), not JSON body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/folders', folderRoutes);

// ─── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => errorResponse(res, 'Route not found', 404));

// ─── Global Error Handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message =
    env.isProduction && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error';
  console.error('[error]', err.message);
  errorResponse(res, message, status);
});

module.exports = app;
