'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const {
  getProfile,
  getStorageStats,
  updatePassword,
  getVaultStatus,
  setupVaultPassword,
  changeVaultPassword,
} = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');

router.get('/', authenticate, apiLimiter, getProfile);
router.get('/stats', authenticate, apiLimiter, getStorageStats);

router.get('/vault-status', authenticate, apiLimiter, getVaultStatus);
router.post('/vault-setup', authenticate, apiLimiter, setupVaultPassword);
router.patch('/vault-change', authenticate, apiLimiter, changeVaultPassword);

router.patch(
  '/password',
  authenticate,
  apiLimiter,
  [
    body('oldPassword').notEmpty().withMessage('Old password required'),
    body('newPassword')
      .isLength({ min: 12, max: 128 }).withMessage('New password: 12-128 characters')
      .matches(/[A-Z]/).withMessage('New password needs an uppercase letter')
      .matches(/[0-9]/).withMessage('New password needs a number'),
  ],
  validate,
  updatePassword
);

module.exports = router;
