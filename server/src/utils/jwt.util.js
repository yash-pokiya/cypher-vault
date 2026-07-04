'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const JWT_OPTIONS = { issuer: 'vault', audience: 'vault-client' };

const signAccess = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { ...JWT_OPTIONS, expiresIn: env.JWT_ACCESS_EXPIRY });

const signRefresh = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { ...JWT_OPTIONS, expiresIn: env.JWT_REFRESH_EXPIRY });

const verifyAccess = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, JWT_OPTIONS);

const verifyRefresh = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET, JWT_OPTIONS);

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
