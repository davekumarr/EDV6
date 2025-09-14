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
const { handleWebhook, getWebhookLogs } = require('./controllers/webhookController');

// Main webhook endpoint - handles all payment gateway webhooks
app.post('/webhook', handleWebhook);

// Specific webhook endpoints for different gateways (all point to same handler)
app.post('/webhook/edviron', handleWebhook);
app.post('/webhook/cashfree', handleWebhook);
app.post('/webhook/payment-gateway', handleWebhook);

// Webhook management routes (with auth)
const authenticateToken = require('./middleware/authenticate');
app.get('/api/webhook-logs', authenticateToken, getWebhookLogs);

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
  console.log(`Webhook endpoints available at:`);
  console.log(`  - POST /webhook (generic)`);
  console.log(`  - POST /webhook/edviron`);
  console.log(`  - POST /webhook/cashfree`);
  console.log(`  - GET /api/webhook-logs (authenticated)`);
});