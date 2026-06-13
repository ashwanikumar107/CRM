const logger = require('../config/logger');

module.exports = (err, req, res, _next) => {
  logger.error(`${req.method} ${req.path} → ${err.message}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
