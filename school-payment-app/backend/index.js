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
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/order-status', require('./routes/orderStatusRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/transactionRoutes'));

// Webhook route (no auth required as it's called by payment gateway)
const { handleWebhook } = require('./controllers/webhookController');
app.post('/webhook', handleWebhook);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});