const express = require('express');
const { 
  getAllTransactions, 
  getTransactionsBySchool, 
  getTransactionStatus 
} = require('../controllers/transactionsController');
const authenticateToken = require('../middleware/authenticate');

const router = express.Router();

// Get all transactions with aggregation
router.get('/transactions', authenticateToken, getAllTransactions);

// Get transactions by school
router.get('/transactions/school/:schoolId', authenticateToken, getTransactionsBySchool);

// Check transaction status by custom_order_id
router.get('/transaction-status/:custom_order_id', authenticateToken, getTransactionStatus);

module.exports = router;