const db      = require('../config/database');
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1', [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT user_id, name, email, role, avatar, is_active, last_login_at, created_at FROM users WHERE user_id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findAll() {
    const [rows] = await db.execute(
      'SELECT user_id, name, email, role, avatar, is_active, last_login_at, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  async create({ name, email, password, role = 'manager' }) {
    const id   = uuidv4();
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO users (user_id, name, email, password_hash, role) VALUES (?,?,?,?,?)',
      [id, name, email, hash, role]
    );
    return this.findById(id);
  }

  async updateProfile(id, { name, avatar }) {
    await db.execute(
      'UPDATE users SET name = ?, avatar = ? WHERE user_id = ?',
      [name, avatar || null, id]
    );
    return this.findById(id);
  }

  async changePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, id]);
  }

  async updateRole(id, role) {
    await db.execute('UPDATE users SET role = ? WHERE user_id = ?', [role, id]);
    return this.findById(id);
  }

  async deactivate(id) {
    await db.execute('UPDATE users SET is_active = 0 WHERE user_id = ?', [id]);
  }

  async updateLastLogin(id) {
    await db.execute('UPDATE users SET last_login_at = NOW() WHERE user_id = ?', [id]);
  }

  async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }

  // ── Refresh tokens ────────────────────────────────────────
  async saveRefreshToken(userId, tokenHash, expiresAt) {
    await db.execute(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)',
      [userId, tokenHash, expiresAt]
    );
  }

  async findRefreshToken(tokenHash) {
    const [rows] = await db.execute(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );
    return rows[0] || null;
  }

  async deleteRefreshToken(tokenHash) {
    await db.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
  }

  async deleteAllUserTokens(userId) {
    await db.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  }
}

module.exports = new UserModel();
