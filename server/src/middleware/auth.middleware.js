'use strict';
const { verifyAccess } = require('../utils/jwt.util');
const { error } = require('../utils/response.util');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyAccess(token);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token expired', 401);
    return error(res, 'Invalid token', 401);
  }
};

module.exports = { authenticate };
