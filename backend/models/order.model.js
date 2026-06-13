const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class OrderModel {
  async findAll({ page = 1, limit = 20, customer_id = '', category = '' } = {}) {
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];

    if (customer_id) { where += ' AND o.customer_id = ?'; params.push(customer_id); }
    if (category)    { where += ' AND o.category = ?';    params.push(category); }

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM orders o WHERE ${where}`, params
    );
    const lim = Math.max(1, parseInt(limit) || 20);
    const off = Math.max(0, parseInt(offset) || 0);
    const [rows] = await db.execute(
      `SELECT o.*, c.name AS customer_name, c.email AS customer_email
       FROM orders o JOIN customers c ON c.customer_id = o.customer_id
       WHERE ${where} ORDER BY o.order_date DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    return { data: rows, total, page, limit };
  }

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT o.*, c.name AS customer_name FROM orders o
       JOIN customers c ON c.customer_id = o.customer_id WHERE o.order_id = ?`, [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const id = uuidv4();
    const { customer_id, product_name, category = null, amount, order_date = new Date() } = data;
    await db.execute(
      `INSERT INTO orders (order_id, customer_id, product_name, category, amount, order_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, customer_id, product_name, category, amount, order_date]
    );
    return this.findById(id);
  }

  async delete(id) {
    const order = await this.findById(id);
    if (!order) return false;
    await db.execute('DELETE FROM orders WHERE order_id = ?', [id]);
    return order.customer_id;
  }

  async getRevenueByMonth() {
    const [rows] = await db.execute(`
      SELECT DATE_FORMAT(order_date,'%Y-%m') AS month,
             SUM(amount) AS revenue, COUNT(*) AS orders
      FROM orders GROUP BY month ORDER BY month DESC LIMIT 12
    `);
    return rows.reverse();
  }

  async getRevenueByCategory() {
    const [rows] = await db.execute(`
      SELECT category, SUM(amount) AS revenue, COUNT(*) AS orders
      FROM orders WHERE category IS NOT NULL
      GROUP BY category ORDER BY revenue DESC
    `);
    return rows;
  }

  async getTopCustomers(limit = 10) {
    const lim = Math.max(1, parseInt(limit) || 10);
    const [rows] = await db.execute(`
      SELECT c.customer_id, c.name, c.email,
             SUM(o.amount) AS total, COUNT(o.order_id) AS orders
      FROM orders o JOIN customers c ON c.customer_id = o.customer_id
      GROUP BY c.customer_id ORDER BY total DESC LIMIT ${lim}
    `);
    return rows;
  }
}

module.exports = new OrderModel();