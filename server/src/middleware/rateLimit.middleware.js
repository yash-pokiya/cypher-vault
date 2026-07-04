'use strict';
const rateLimit = require('express-rate-limit');

const makeLimit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, data: null, error: message },
  });

// 10 requests per 15 minutes — login + register
const authLimiter = makeLimit(
  15 * 60 * 1000,
  20,
  'Too many auth attempts. Try again in 15 minutes.'
);

// 20 uploads per hour
const uploadLimiter = makeLimit(
  60 * 60 * 1000,
  50,
  'Upload limit reached. Try again in 1 hour.'
);

// 100 requests per minute — general API
const apiLimiter = makeLimit(
  60 * 1000,
  250,
  'Rate limit exceeded. Try again in 1 minute.'
);

// 5 rewrap requests per 10 minutes — prevents brute-force key re-derivation
const rewrapLimiter = makeLimit(
  10 * 60 * 1000,
  20,
  'Too many key rewrap requests. Try again in 10 minutes.'
);

module.exports = { authLimiter, uploadLimiter, apiLimiter, rewrapLimiter };
