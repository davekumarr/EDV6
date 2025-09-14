const express = require('express');
const { createWebhookLog, getWebhookLogs } = require('../controllers/webhookController');
const router = express.Router();

router.post('/log', createWebhookLog);
router.get('/logs', getWebhookLogs);

module.exports = router;
