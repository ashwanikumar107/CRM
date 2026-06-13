const SegmentModel  = require('../models/segment.model');
const CustomerModel = require('../models/customer.model');
const aiService     = require('../services/ai.service');
const logger        = require('../config/logger');

exports.list = async (req, res, next) => {
  try {
    const segments = await SegmentModel.findAll();
    res.json({ success: true, data: segments });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const segment = await SegmentModel.findById(req.params.id);
    if (!segment) return res.status(404).json({ success: false, message: 'Segment not found' });
    const customers = await CustomerModel.findBySegmentCondition(segment.sql_condition);
    res.json({ success: true, data: { ...segment, customers } });
  } catch (err) { next(err); }
};

exports.preview = async (req, res, next) => {
  try {
    const { sql_condition } = req.body;
    if (!sql_condition) return res.status(400).json({ success: false, message: 'sql_condition required' });
    const customers = await CustomerModel.findBySegmentCondition(sql_condition);
    res.json({ success: true, data: customers, count: customers.length });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, conditions, sql_condition } = req.body;
    const customers = await CustomerModel.findBySegmentCondition(sql_condition);
    const segment = await SegmentModel.create({
      name, description, conditions, sql_condition,
      customer_count: customers.length, ai_generated: 0,
    });
    logger.info(`Segment created: ${segment.segment_id}`);
    res.status(201).json({ success: true, data: segment });
  } catch (err) { next(err); }
};

exports.aiCreate = async (req, res, next) => {
  try {
    const { name, natural_language } = req.body;
    if (!natural_language) return res.status(400).json({ success: false, message: 'natural_language required' });

    const { sql, explanation } = await aiService.nlToSqlSegment(natural_language);
    const customers = await CustomerModel.findBySegmentCondition(sql);
    const segment = await SegmentModel.create({
      name: name || natural_language.slice(0, 80),
      description: explanation,
      conditions: { natural_language },
      sql_condition: sql,
      customer_count: customers.length,
      ai_generated: 1,
    });
    logger.info(`AI Segment created: ${segment.segment_id}`);
    res.status(201).json({ success: true, data: segment, customers, explanation });
  } catch (err) { next(err); }
};

exports.aiSuggest = async (req, res, next) => {
  try {
    const stats = await CustomerModel.getStats();
    const suggestions = await aiService.suggestSegments(stats);
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const segment = await SegmentModel.update(req.params.id, req.body);
    if (!segment) return res.status(404).json({ success: false, message: 'Segment not found' });
    res.json({ success: true, data: segment });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await SegmentModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Segment not found' });
    res.json({ success: true, message: 'Segment deleted' });
  } catch (err) { next(err); }
};
