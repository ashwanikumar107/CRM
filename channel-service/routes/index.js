const router = require('express').Router();
const ctrl   = require('../controllers/send.controller');

router.post('/send',   ctrl.send);
router.get ('/health', ctrl.health);

module.exports = router;
