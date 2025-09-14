const express = require('express');
const { createPayment, checkPaymentStatus } = require('../controllers/paymentController');
const authenticateToken = require('../middleware/authenticate');

const router = express.Router();

// Create payment link
router.post('/create-payment', authenticateToken, createPayment);

// Check payment status
router.get('/payment-status/:collect_request_id', authenticateToken, checkPaymentStatus);

module.exports = router;