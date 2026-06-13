const CustomerModel = require('../models/customer.model');
const OrderModel    = require('../models/order.model');
const logger        = require('../config/logger');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', city = '' } = req.query;
    const result = await CustomerModel.findAll({
      page: parseInt(page), limit: parseInt(limit), search, city,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const orders = await OrderModel.findAll({ customer_id: customer.customer_id });
    res.json({ success: true, data: { ...customer, orders: orders.data } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const customer = await CustomerModel.create(req.body);
    logger.info(`Customer created: ${customer.customer_id}`);
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: 'Email already registered' });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await CustomerModel.update(req.params.id, req.body);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await CustomerModel.delete(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const stats = await CustomerModel.getStats();
    const cities = await CustomerModel.getCityDistribution();
    res.json({ success: true, data: { stats, cities } });
  } catch (err) { next(err); }
};
