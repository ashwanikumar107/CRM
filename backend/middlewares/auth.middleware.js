const jwt    = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * authenticate — verifies the Bearer JWT in Authorization header.
 * Attaches decoded payload to req.user
 */
exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role, iat, exp }
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    logger.warn(`Auth failed: ${err.message} [${req.method} ${req.path}]`);
    return res.status(401).json({ success: false, message: msg });
  }
};

/**
 * authorize(...roles) — role-based access guard.
 * Use after authenticate.
 *
 * Example: router.delete('/users/:id', authenticate, authorize('admin'), ctrl.delete)
 */
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    logger.warn(`Forbidden: ${req.user.email} (${req.user.role}) tried ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};
