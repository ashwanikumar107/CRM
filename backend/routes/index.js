const router = require('express').Router();

const customerCtrl = require('../controllers/customer.controller');
const orderCtrl    = require('../controllers/order.controller');
const segmentCtrl  = require('../controllers/segment.controller');
const campaignCtrl = require('../controllers/campaign.controller');
const aiCtrl       = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All routes below require a valid JWT
router.use(authenticate);

// ── Customers ──────────────────────────────────────────────
router.get   ('/customers',          customerCtrl.list);
router.get   ('/customers/stats',    customerCtrl.stats);
router.get   ('/customers/:id',      customerCtrl.getById);
router.post  ('/customers',          authorize('admin','manager'), customerCtrl.create);
router.put   ('/customers/:id',      authorize('admin','manager'), customerCtrl.update);
router.delete('/customers/:id',      authorize('admin'),           customerCtrl.remove);

// ── Orders ─────────────────────────────────────────────────
router.get   ('/orders',             orderCtrl.list);
router.get   ('/orders/analytics',   orderCtrl.analytics);
router.post  ('/orders',             authorize('admin','manager'), orderCtrl.create);
router.delete('/orders/:id',         authorize('admin'),           orderCtrl.remove);

// ── Segments ────────────────────────────────────────────────
router.get   ('/segments',           segmentCtrl.list);
router.get   ('/segments/:id',       segmentCtrl.getById);
router.post  ('/segments',           authorize('admin','manager'), segmentCtrl.create);
router.post  ('/segments/preview',   authorize('admin','manager'), segmentCtrl.preview);
router.post  ('/segments/ai',        authorize('admin','manager'), segmentCtrl.aiCreate);
router.post  ('/segments/ai/suggest',authorize('admin','manager'), segmentCtrl.aiSuggest);
router.put   ('/segments/:id',       authorize('admin','manager'), segmentCtrl.update);
router.delete('/segments/:id',       authorize('admin'),           segmentCtrl.remove);

// ── Campaigns ───────────────────────────────────────────────
router.get   ('/campaigns',           campaignCtrl.list);
router.get   ('/campaigns/analytics', campaignCtrl.analytics);
router.get   ('/campaigns/:id',       campaignCtrl.getById);
router.post  ('/campaigns',           authorize('admin','manager'), campaignCtrl.create);
router.post  ('/campaigns/ai/message',authorize('admin','manager'), campaignCtrl.aiGenerateMessage);
router.post  ('/campaigns/:id/send',  authorize('admin','manager'), campaignCtrl.send);

// ── Receipts (called by Channel Service) ────────────────────
router.post  ('/receipts',           campaignCtrl.receipt);

// ── AI Assistant ────────────────────────────────────────────
router.post  ('/ai/chat',            aiCtrl.chat);

module.exports = router;
