const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// ── Public ─────────────────────────────────────────────────
router.post('/auth/signup',   ctrl.signup);
router.post('/auth/login',    ctrl.login);
router.post('/auth/refresh',  ctrl.refresh);
router.post('/auth/logout',   ctrl.logout);

// ── Authenticated ───────────────────────────────────────────
router.get ('/auth/me',               authenticate, ctrl.me);
router.put ('/auth/profile',          authenticate, ctrl.updateProfile);
router.put ('/auth/change-password',  authenticate, ctrl.changePassword);
router.post('/auth/logout-all',       authenticate, ctrl.logoutAll);

// ── Admin only ──────────────────────────────────────────────
router.post  ('/auth/register',       authenticate, authorize('admin'), ctrl.register);
router.get   ('/users',               authenticate, authorize('admin'), ctrl.listUsers);
router.put   ('/users/:id/role',      authenticate, authorize('admin'), ctrl.updateRole);
router.delete('/users/:id',           authenticate, authorize('admin'), ctrl.deactivateUser);

module.exports = router;