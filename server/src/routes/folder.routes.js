'use strict';
const router = require('express').Router();
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFiles,
} = require('../controllers/folder.controller');

router.use(authenticate);
router.use(apiLimiter);

// Move files into/out of folder
router.patch(
  '/move-files',
  [
    body('fileIds').isArray({ min: 1, max: 200 }),
    body('fileIds.*').isMongoId(),
    body('targetFolderId').optional({ nullable: true }).isMongoId(),
  ],
  validate,
  moveFiles
);

// List all folders
router.get('/', listFolders);

// Create folder
router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 50 }),
    body('color').optional().isIn(['indigo', 'rose', 'amber', 'emerald', 'sky', 'violet', 'orange', 'teal']),
    body('icon').optional().isLength({ max: 10 }),
    body('description').optional().isLength({ max: 200 }),
  ],
  validate,
  createFolder
);

// Update folder
router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().notEmpty().isLength({ max: 50 }),
    body('color').optional().isIn(['indigo', 'rose', 'amber', 'emerald', 'sky', 'violet', 'orange', 'teal']),
  ],
  validate,
  updateFolder
);

// Delete folder
router.delete('/:id', [param('id').isMongoId()], validate, deleteFolder);

module.exports = router;
