'use strict';
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt.util');
const { success, error } = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const BCRYPT_ROUNDS = 12;

// httpOnly refresh token cookie — browser JS cannot read this
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
};

// ─── Register ──────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return error(res, 'Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash });

  const payload = { sub: user._id.toString(), email: user.email };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  return success(
    res,
    { accessToken, user: { id: user._id, name: user.name, email: user.email, vaultPasswordSet: user.vaultPasswordSet } },
    201
  );
});

// ─── Login ─────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  // Run bcrypt even if user not found to prevent timing-based user enumeration
  const dummyHash = '$2b$12$invalidhashinvalidhashinvalidhashinvalidhash';
  const valid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!user || !valid) return error(res, 'Invalid credentials', 401);

  const payload = { sub: user._id.toString(), email: user.email };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  return success(res, { accessToken, user: { id: user._id, name: user.name, email: user.email, vaultPasswordSet: user.vaultPasswordSet } });
});

// ─── Logout ────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTS, maxAge: 0 });
  return success(res, { message: 'Logged out' });
});

// ─── Refresh Access Token ──────────────────────────────────────────────────
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return error(res, 'Refresh token missing', 401);

  let decoded;
  try {
    decoded = verifyRefresh(token);
  } catch {
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTS, maxAge: 0 });
    return error(res, 'Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.sub);
  if (!user) return error(res, 'User not found', 401);

  const payload = { sub: user._id.toString(), email: user.email };
  const newAccessToken = signAccess(payload);
  const newRefreshToken = signRefresh(payload);

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTS);
  return success(res, { accessToken: newAccessToken });
});

module.exports = { register, login, logout, refresh };
