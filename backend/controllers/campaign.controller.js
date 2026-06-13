const CampaignModel = require('../models/campaign.model');
const SegmentModel  = require('../models/segment.model');
const CustomerModel = require('../models/customer.model');
const aiService     = require('../services/ai.service');
const axios         = require('axios');
const logger        = require('../config/logger');
const db            = require('../config/database');

const CHANNEL_SERVICE = process.env.CHANNEL_SERVICE_URL || 'http://localhost:6000';

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const result = await CampaignModel.findAll({ page: parseInt(page), limit: parseInt(limit), status });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const campaign = await CampaignModel.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    const recipients = await CampaignModel.getRecipients(campaign.campaign_id);
    res.json({ success: true, data: { ...campaign, recipients } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const campaign = await CampaignModel.create({ ...req.body, ai_generated: 0 });
    logger.info(`Campaign created: ${campaign.campaign_id}`);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) { next(err); }
};

exports.aiGenerateMessage = async (req, res, next) => {
  try {
    const { channel, segment_id, goal } = req.body;
    const segment = segment_id ? await SegmentModel.findById(segment_id) : null;
    const result = await aiService.generateCampaignMessage({
      channel: channel || 'WhatsApp',
      segmentDescription: segment ? segment.description || segment.name : 'all customers',
      goal: goal || 'increase engagement',
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

exports.send = async (req, res, next) => {
  try {
    const campaign = await CampaignModel.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (campaign.status !== 'draft')
      return res.status(400).json({ success: false, message: 'Campaign already sent' });

    // Get segment customers
    const customers = await CustomerModel.findBySegmentCondition(campaign.segment_condition);
    if (!customers.length)
      return res.status(400).json({ success: false, message: 'No customers in segment' });

    // Create recipient rows
    await CampaignModel.bulkInsertRecipients(
      campaign.campaign_id,
      customers.map(c => c.customer_id)
    );
    await CampaignModel.updateStatus(campaign.campaign_id, 'sending');

    // Fire off to channel service (non-blocking)
    const payload = {
      campaign_id: campaign.campaign_id,
      channel:     campaign.channel,
      message:     campaign.message,
      recipients:  customers.map(c => ({
        customer_id: c.customer_id,
        phone: c.phone,
        email: c.email,
        name:  c.name,
      })),
      callback_url: `${process.env.SELF_URL || 'http://localhost:5000'}/api/receipts`,
    };

    axios.post(`${CHANNEL_SERVICE}/api/send`, payload)
      .then(() => logger.info(`Campaign ${campaign.campaign_id} dispatched to channel service`))
      .catch(e  => logger.error(`Channel service error: ${e.message}`));

    res.json({ success: true, message: 'Campaign is being sent', data: { count: customers.length } });
  } catch (err) { next(err); }
};

// Called by Channel Service via POST /api/receipts
exports.receipt = async (req, res, next) => {
  try {
    const { campaign_id, customer_id, status } = req.body;
    if (!campaign_id || !customer_id || !status)
      return res.status(400).json({ success: false, message: 'Missing fields' });

    await CampaignModel.updateRecipientStatus(campaign_id, customer_id, status);

    const statMap = {
      sent: 'stat_sent', delivered: 'stat_delivered', failed: 'stat_failed',
      opened: 'stat_opened', read: 'stat_read', clicked: 'stat_clicked', converted: 'stat_converted',
    };
    const field = statMap[status];
    if (field) await CampaignModel.incrementStat(campaign_id, field);

    // Log it
    await db.execute(
      `INSERT INTO communication_logs (campaign_id, customer_id, channel, event_type, payload)
       SELECT campaign_id, ?, channel, ?, ?
       FROM campaigns WHERE campaign_id = ?`,
      [customer_id, status, JSON.stringify(req.body), campaign_id]
    );

    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.analytics = async (req, res, next) => {
  try {
    const [overall, recent] = await Promise.all([
      CampaignModel.getOverallAnalytics(),
      CampaignModel.getRecentActivity(10),
    ]);
    res.json({ success: true, data: { overall, recent } });
  } catch (err) { next(err); }
};
