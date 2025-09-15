require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for webhook payloads
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/order-status', require('./routes/orderStatusRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/transactionRoutes'));

// Webhook routes (no auth required as they're called by payment gateways)
const { handleWebhook, getWebhookLogs, simulateWebhook } = require('./controllers/webhookController');

// Main webhook endpoint - handles all payment gateway webhooks
app.post('/webhook', handleWebhook);

// Specific webhook endpoints for different gateways (all point to same handler)
app.post('/webhook/edviron', handleWebhook);
app.post('/webhook/cashfree', handleWebhook);
app.post('/webhook/payment-gateway', handleWebhook);

// Test webhook endpoint for development
app.post('/webhook/test', simulateWebhook);

// Webhook management routes (with auth)
const authenticateToken = require('./middleware/authenticate');
app.get('/api/webhook-logs', authenticateToken, getWebhookLogs);

// Test data creation endpoints for development
app.post('/api/test/create-dummy-data', authenticateToken, async (req, res) => {
  try {
    const Order = require('./models/Order');
    const OrderStatus = require('./models/OrderStatus');

    // Create 10 dummy orders
    const dummyOrders = [];
    const statuses = ['pending', 'success', 'failed'];
    const gateways = ['Edviron', 'Cashfree', 'PhonePe', 'Paytm'];
    const schools = [
      { id: '65b0e6293e9f76a9694d84b4', name: 'Delhi Public School' },
      { id: '65b0e6293e9f76a9694d84b5', name: 'Kendriya Vidyalaya' },
      { id: '65b0e6293e9f76a9694d84b6', name: 'St. Xavier School' }
    ];

    for (let i = 0; i < 10; i++) {
      const school = schools[Math.floor(Math.random() * schools.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const gateway = gateways[Math.floor(Math.random() * gateways.length)];
      const amount = Math.floor(Math.random() * 5000) + 500;

      const order = new Order({
        school_id: school.id,
        school_name: school.name,
        trustee_id: 'dummy_trustee',
        student_info: {
          name: `Student ${i + 1}`,
          id: `STU${String(i + 1).padStart(3, '0')}`,
          email: `student${i + 1}@school.edu`
        },
        gateway_name: gateway,
        amount: amount,
        preferred_payment_mode: 'any',
        status: status
      });

      await order.save();
      dummyOrders.push(order);

      // Create OrderStatus for some orders
      if (Math.random() > 0.3) { // 70% chance
        const orderStatus = new OrderStatus({
          collect_id: order._id,
          order_amount: amount,
          transaction_amount: status === 'success' ? amount : Math.floor(amount * 0.9),
          payment_mode: ['upi', 'netbanking', 'card'][Math.floor(Math.random() * 3)],
          payment_details: `${gateway} payment details`,
          bank_reference: `REF${Date.now()}${i}`,
          payment_message: status === 'success' ? 'Payment successful' : 'Payment processed',
          status: status,
          error_message: status === 'failed' ? 'Payment declined by bank' : 'NA',
          payment_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
        });

        await orderStatus.save();
      }
    }

    res.json({
      success: true,
      message: `Created ${dummyOrders.length} dummy orders with order statuses`,
      orders: dummyOrders.length
    });

  } catch (error) {
    console.error('Error creating dummy data:', error);
    res.status(500).json({
      error: 'Failed to create dummy data',
      details: error.message
    });
  }
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Webhook endpoints available at:`);
  console.log(`  - POST /webhook (generic)`);
  console.log(`  - POST /webhook/edviron`);
  console.log(`  - POST /webhook/cashfree`);
  console.log(`  - POST /webhook/test (for development)`);
  console.log(`  - GET /api/webhook-logs (authenticated)`);
  console.log(`Test endpoints:`);
  console.log(`  - POST /api/test/create-dummy-data (authenticated)`);
});