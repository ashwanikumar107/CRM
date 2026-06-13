const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CampaignModel {
  async findAll({ page = 1, limit = 20, status = '' } = {}) {
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND c.status = ?'; params.push(status); }

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM campaigns c WHERE ${where}`, params
    );
    const lim = Math.max(1, parseInt(limit) || 20);
    const off = Math.max(0, parseInt(offset) || 0);
    const [rows] = await db.execute(
      `SELECT c.*, s.name AS segment_name, s.customer_count AS segment_size
       FROM campaigns c JOIN segments s ON s.segment_id = c.segment_id
       WHERE ${where} ORDER BY c.created_at DESC LIMIT ${lim} OFFSET ${off}`,
      params
    );
    return { data: rows, total, page, limit };
  }

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT c.*, s.name AS segment_name, s.sql_condition AS segment_condition
       FROM campaigns c JOIN segments s ON s.segment_id = c.segment_id
       WHERE c.campaign_id = ?`, [id]
    );
    return rows[0] || null;
  }

  async create(data) {
    const id = uuidv4();
    const { name, segment_id, channel, message, ai_generated = 0, scheduled_at = null } = data;
    await db.execute(
      `INSERT INTO campaigns (campaign_id, name, segment_id, channel, message, ai_generated, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, segment_id, channel, message, ai_generated, scheduled_at]
    );
    return this.findById(id);
  }

  async updateStatus(id, status, extra = {}) {
    const fields = ['status = ?'];
    const values = [status];
    if (status === 'sending' || status === 'sent') { fields.push('sent_at = NOW()'); }
    if (extra.stat_sent      !== undefined) { fields.push('stat_sent = ?');      values.push(extra.stat_sent); }
    if (extra.stat_delivered !== undefined) { fields.push('stat_delivered = ?'); values.push(extra.stat_delivered); }
    if (extra.stat_failed    !== undefined) { fields.push('stat_failed = ?');    values.push(extra.stat_failed); }
    await db.execute(
      `UPDATE campaigns SET ${fields.join(', ')} WHERE campaign_id = ?`,
      [...values, id]
    );
  }

  async incrementStat(id, statField, increment = 1) {
    const allowed = ['stat_sent','stat_delivered','stat_failed','stat_opened','stat_read','stat_clicked','stat_converted'];
    if (!allowed.includes(statField)) return;
    await db.execute(
      `UPDATE campaigns SET ${statField} = ${statField} + ? WHERE campaign_id = ?`,
      [increment, id]
    );
  }

  async getRecipients(campaignId) {
    const [rows] = await db.execute(
      `SELECT cr.*, c.name AS customer_name, c.email, c.phone
       FROM campaign_recipients cr JOIN customers c ON c.customer_id = cr.customer_id
       WHERE cr.campaign_id = ?`,
      [campaignId]
    );
    return rows;
  }

  async bulkInsertRecipients(campaignId, customerIds) {
    if (!customerIds.length) return;
    const values = customerIds.map(cid => `(${db.escape(campaignId)}, ${db.escape(cid)})`).join(',');
    await db.execute(
      `INSERT IGNORE INTO campaign_recipients (campaign_id, customer_id) VALUES ${values}`
    );
  }

  async updateRecipientStatus(campaignId, customerId, status) {
    const tsField = {
      sent: 'sent_at', delivered: 'delivered_at', opened: 'opened_at',
      read: 'read_at', clicked: 'clicked_at', converted: 'converted_at',
    }[status];
    const extra = tsField ? `, ${tsField} = NOW()` : '';
    await db.execute(
      `UPDATE campaign_recipients SET status = ?${extra}
       WHERE campaign_id = ? AND customer_id = ?`,
      [status, campaignId, customerId]
    );
  }

  async getOverallAnalytics() {
    const [[stats]] = await db.execute(`
      SELECT
        COUNT(*) AS total_campaigns,
        SUM(stat_sent) AS total_sent,
        SUM(stat_delivered) AS total_delivered,
        SUM(stat_failed) AS total_failed,
        SUM(stat_opened) AS total_opened,
        SUM(stat_clicked) AS total_clicked,
        SUM(stat_converted) AS total_converted
      FROM campaigns WHERE status != 'draft'
    `);
    return stats;
  }

  async getRecentActivity(limit = 10) {
    const lim = Math.max(1, parseInt(limit) || 10);
    const [rows] = await db.execute(
      `SELECT campaign_id, name, channel, status, stat_sent, stat_delivered,
              stat_clicked, stat_converted, sent_at
       FROM campaigns ORDER BY created_at DESC LIMIT ${lim}`
    );
    return rows;
  }
}

module.exports = new CampaignModel();