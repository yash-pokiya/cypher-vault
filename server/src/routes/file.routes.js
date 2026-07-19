'use strict';
const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { upload, list, getById, remove, deleteBatch } = require('../controllers/file.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadLimiter, apiLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');
const { singleEncryptedFile } = require('../middleware/upload.middleware');

const uploadValidators = [
  body('wrappedFileKey').notEmpty().isBase64().withMessage('wrappedFileKey must be base64'),
  body('iv').notEmpty().isBase64().withMessage('iv must be base64'),
  body('salt').notEmpty().isBase64().withMessage('salt must be base64'),
  body('mimeType').notEmpty().isString().isLength({ max: 100 }).withMessage('mimeType required'),
  body('filename').notEmpty().isString().isLength({ max: 255 }).withMessage('filename required'),
  body('size').notEmpty().isInt({ min: 0 }).withMessage('size must be a non-negative integer'),
];

router.post(
  '/upload',
  authenticate,
  uploadLimiter,
  singleEncryptedFile,
  uploadValidators,
  validate,
  upload
);

router.post(
  '/delete-batch',
  authenticate,
  apiLimiter,
  [body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array')],
  validate,
  deleteBatch
);

router.get(
  '/',
  authenticate,
  apiLimiter,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('search').optional().isString().isLength({ max: 100 }),
    query('folder').optional().isString().isLength({ max: 100 }),
  ],
  validate,
  list
);

router.get(
  '/:id/metadata',
  authenticate,
  apiLimiter,
  [param('id').isMongoId().withMessage('Invalid file ID')],
  validate,
  getById
);

router.delete(
  '/:id',
  authenticate,
  apiLimiter,
  [param('id').isMongoId().withMessage('Invalid file ID')],
  validate,
  remove
);

module.exports = router;
