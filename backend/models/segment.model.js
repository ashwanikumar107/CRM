const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class SegmentModel {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM segments ORDER BY created_at DESC');
    return rows;
  }

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM segments WHERE segment_id = ?', [id]);
    return rows[0] || null;
  }

  async create(data) {
    const id = uuidv4();
    const { name, description = null, conditions, sql_condition, ai_generated = 0, customer_count = 0 } = data;
    await db.execute(
      `INSERT INTO segments (segment_id, name, description, conditions, sql_condition, ai_generated, customer_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description, JSON.stringify(conditions), sql_condition, ai_generated, customer_count]
    );
    return this.findById(id);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['name','description','conditions','sql_condition','customer_count'];
    for (const [k, v] of Object.entries(data)) {
      if (allowed.includes(k)) {
        fields.push(`${k} = ?`);
        values.push(k === 'conditions' ? JSON.stringify(v) : v);
      }
    }
    if (!fields.length) return this.findById(id);
    await db.execute(
      `UPDATE segments SET ${fields.join(', ')} WHERE segment_id = ?`,
      [...values, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const [res] = await db.execute('DELETE FROM segments WHERE segment_id = ?', [id]);
    return res.affectedRows > 0;
  }

  async updateCount(id, count) {
    await db.execute('UPDATE segments SET customer_count = ? WHERE segment_id = ?', [count, id]);
  }
}

module.exports = new SegmentModel();
