'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const { batchRewrap } = require('../controllers/key.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { rewrapLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');

router.patch(
  '/rewrap',
  authenticate,
  rewrapLimiter,
  [
    body('updates').isArray({ min: 1, max: 500 }).withMessage('updates: array of 1-500 items required'),
    body('updates.*.fileId').isMongoId().withMessage('Each fileId must be a valid MongoDB ID'),
    body('updates.*.newWrappedFileKey').isBase64().withMessage('newWrappedFileKey must be base64'),
    body('updates.*.newSalt').isBase64().withMessage('newSalt must be base64'),
  ],
  validate,
  batchRewrap
);

module.exports = router;
