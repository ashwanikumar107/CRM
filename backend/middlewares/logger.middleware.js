const logger = require('../config/logger');

module.exports = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
};
