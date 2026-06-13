const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const UserModel = require('../models/user.model');
const logger    = require('../config/logger');

// ── Token helpers ─────────────────────────────────────────────
function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

// ── Register ──────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Only admin can set non-manager roles
    const finalRole = (req.user?.role === 'admin' && role) ? role : 'manager';

    const existing = await UserModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already in use' });

    const user = await UserModel.create({ name, email, password, role: finalRole });
    logger.info(`New user registered: ${user.email} (${user.role})`);

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await UserModel.saveRefreshToken(user.user_id, hashToken(refreshToken), refreshExpiryDate());

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ── Public Signup (always role = viewer) ──────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const existing = await UserModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const user = await UserModel.create({ name, email, password, role: 'viewer' });
    logger.info(`New signup: ${user.email} (viewer)`);

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await UserModel.saveRefreshToken(user.user_id, hashToken(refreshToken), refreshExpiryDate());

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const valid = await UserModel.verifyPassword(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    await UserModel.updateLastLogin(user.user_id);

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await UserModel.saveRefreshToken(user.user_id, hashToken(refreshToken), refreshExpiryDate());

    // Strip hash before sending
    const { password_hash, ...safeUser } = user;

    logger.info(`Login: ${user.email}`);
    res.json({ success: true, data: { user: safeUser, accessToken, refreshToken } });
  } catch (err) { next(err); }
};

// ── Refresh Token ─────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, message: 'Refresh token required' });

    const stored = await UserModel.findRefreshToken(hashToken(refreshToken));
    if (!stored)
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });

    // Rotate: delete old, issue new
    await UserModel.deleteRefreshToken(hashToken(refreshToken));

    const user = await UserModel.findById(stored.user_id);
    if (!user)
      return res.status(401).json({ success: false, message: 'User not found' });

    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    await UserModel.saveRefreshToken(user.user_id, hashToken(newRefreshToken), refreshExpiryDate());

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) { next(err); }
};

// ── Logout ────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await UserModel.deleteRefreshToken(hashToken(refreshToken));
    res.json({ success: true, message: 'Logged out' });
  } catch (err) { next(err); }
};

// ── Logout All Devices ────────────────────────────────────────
exports.logoutAll = async (req, res, next) => {
  try {
    await UserModel.deleteAllUserTokens(req.user.userId);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (err) { next(err); }
};

// ── Get current user ──────────────────────────────────────────
exports.me = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ── Update profile ────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = await UserModel.updateProfile(req.user.userId, { name, avatar });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ── Change password ───────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findByEmail(req.user.email);
    const valid = await UserModel.verifyPassword(currentPassword, user.password_hash);
    if (!valid)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    await UserModel.changePassword(req.user.userId, newPassword);

    // Invalidate all sessions after password change
    await UserModel.deleteAllUserTokens(req.user.userId);

    res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err) { next(err); }
};

// ── Admin: list users ─────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// ── Admin: update role ────────────────────────────────────────
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin','manager','viewer'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });

    const user = await UserModel.updateRole(req.params.id, role);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ── Admin: deactivate user ────────────────────────────────────
exports.deactivateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId)
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    await UserModel.deactivate(req.params.id);
    await UserModel.deleteAllUserTokens(req.params.id);
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { next(err); }
};