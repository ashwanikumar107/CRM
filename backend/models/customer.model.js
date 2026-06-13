const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CustomerModel {
  async findAll({ page = 1, limit = 20, search = '', city = '' } = {}) {
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (city) {
      where += ' AND city = ?';
      params.push(city);
    }

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM customers WHERE ${where}`,
      params
    );
    const lim = Math.max(1, parseInt(limit) || 20);
    const off = Math.max(0, parseInt(offset) || 0);
    const [rows] = await db.execute(
      `SELECT * FROM customers WHERE ${where} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    return { data: rows, total, page, limit };
  }

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM customers WHERE customer_id = ?', [id]);
    return rows[0] || null;
  }

  async findBySegmentCondition(sqlCondition) {
    const [rows] = await db.execute(
      `SELECT * FROM customers WHERE ${sqlCondition} ORDER BY total_spent DESC`
    );
    return rows;
  }

  async create(data) {
    const id = uuidv4();
    const { name, email, phone = null, city = null } = data;
    await db.execute(
      `INSERT INTO customers (customer_id, name, email, phone, city)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, phone, city]
    );
    return this.findById(id);
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(data)) {
      if (['name','email','phone','city'].includes(k)) {
        fields.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (!fields.length) return this.findById(id);
    await db.execute(
      `UPDATE customers SET ${fields.join(', ')} WHERE customer_id = ?`,
      [...values, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const [res] = await db.execute('DELETE FROM customers WHERE customer_id = ?', [id]);
    return res.affectedRows > 0;
  }

  async getStats() {
    const [[stats]] = await db.execute(`
      SELECT
        COUNT(*) AS total_customers,
        SUM(total_spent) AS total_revenue,
        AVG(total_spent) AS avg_spent,
        SUM(order_count) AS total_orders,
        COUNT(CASE WHEN last_order_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS active_30d,
        COUNT(CASE WHEN last_order_at < DATE_SUB(NOW(), INTERVAL 60 DAY) OR last_order_at IS NULL THEN 1 END) AS inactive_60d
      FROM customers
    `);
    return stats;
  }

  async getCityDistribution() {
    const [rows] = await db.execute(
      `SELECT city, COUNT(*) AS count, SUM(total_spent) AS revenue
       FROM customers WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10`
    );
    return rows;
  }

  async recalcCustomerStats(customerId) {
    await db.execute(`
      UPDATE customers c SET
        total_spent  = (SELECT COALESCE(SUM(amount),0) FROM orders WHERE customer_id = ?),
        order_count  = (SELECT COUNT(*) FROM orders WHERE customer_id = ?),
        last_order_at= (SELECT MAX(order_date) FROM orders WHERE customer_id = ?)
      WHERE customer_id = ?
    `, [customerId, customerId, customerId, customerId]);
  }
}

module.exports = new CustomerModel();