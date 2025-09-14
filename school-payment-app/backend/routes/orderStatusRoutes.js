const express = require('express');
const { createOrderStatus } = require('../controllers/orderStatusController');
const router = express.Router();

router.post('/', createOrderStatus);

module.exports = router;
