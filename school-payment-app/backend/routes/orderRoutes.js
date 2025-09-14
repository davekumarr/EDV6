const express = require('express');
const {
  createOrder,
  getAllOrders,
  getOrdersBySchool,
  getOrdersByStatus,
  filterOrders
} = require('../controllers/orderController');
const authenticateToken = require('../middleware/authenticate');

const router = express.Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getAllOrders);
router.get('/school/:schoolId', authenticateToken, getOrdersBySchool);
router.get('/status/:status', authenticateToken, getOrdersByStatus);
router.get('/filter', authenticateToken, filterOrders);

module.exports = router;
