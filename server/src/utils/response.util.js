'use strict';

const success = (res, data = null, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, error: null });

const error = (res, message = 'An error occurred', statusCode = 400, errors = null) =>
  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
    ...(errors && { errors }),
  });

const paginated = (res, data, pagination, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data, error: null, pagination });

module.exports = { success, error, paginated };
