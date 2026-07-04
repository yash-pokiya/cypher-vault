'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, logout, refresh } = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');

const registerValidators = [
  body('name').trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Name required (max 100 chars)'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 12, max: 128 }).withMessage('Password: 12-128 characters')
    .matches(/[A-Z]/).withMessage('Password needs an uppercase letter')
    .matches(/[0-9]/).withMessage('Password needs a number'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/register', authLimiter, registerValidators, validate, register);
router.post('/login',    authLimiter, loginValidators,    validate, login);
router.post('/logout',   logout);
router.post('/refresh',  refresh);

module.exports = router;
