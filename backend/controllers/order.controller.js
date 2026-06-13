const OrderModel    = require('../models/order.model');
const CustomerModel = require('../models/customer.model');
const logger        = require('../config/logger');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, customer_id = '', category = '' } = req.query;
    const result = await OrderModel.findAll({
      page: parseInt(page), limit: parseInt(limit), customer_id, category,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const customer = await CustomerModel.findById(req.body.customer_id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    const order = await OrderModel.create(req.body);
    await CustomerModel.recalcCustomerStats(order.customer_id);
    logger.info(`Order created: ${order.order_id}`);
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const customerId = await OrderModel.delete(req.params.id);
    if (!customerId) return res.status(404).json({ success: false, message: 'Order not found' });
    await CustomerModel.recalcCustomerStats(customerId);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) { next(err); }
};

exports.analytics = async (req, res, next) => {
  try {
    const [monthly, categories, topCustomers] = await Promise.all([
      OrderModel.getRevenueByMonth(),
      OrderModel.getRevenueByCategory(),
      OrderModel.getTopCustomers(10),
    ]);
    res.json({ success: true, data: { monthly, categories, topCustomers } });
  } catch (err) { next(err); }
};
