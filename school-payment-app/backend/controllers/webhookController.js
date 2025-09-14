const WebhookLog = require('../models/WebhookLog');
const OrderStatus = require('../models/OrderStatus');
const Order = require('../models/Order');
const Joi = require('joi');

exports.handleWebhook = async (req, res) => {
  try {
    console.log('=== Webhook Received ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Log the webhook payload
    const webhookLog = new WebhookLog({
      payload: req.body
    });
    await webhookLog.save();

    // Handle different webhook formats (Edviron and Cashfree)
    let orderInfo = null;
    let webhookType = 'unknown';

    // Check if it's an Edviron webhook
    if (req.body.order_info) {
      webhookType = 'edviron';
      orderInfo = req.body.order_info;
      
      // Validate Edviron webhook payload
      const schema = Joi.object({
        status: Joi.number().required(),
        order_info: Joi.object({
          order_id: Joi.string().required(),
          order_amount: Joi.number().required(),
          transaction_amount: Joi.number().required(),
          gateway: Joi.string().required(),
          bank_reference: Joi.string().allow(''),
          status: Joi.string().required(),
          payment_mode: Joi.string().required(),
          payment_details: Joi.string().allow(''),
          payment_message: Joi.string().allow(''),
          payment_time: Joi.date().required(),
          error_message: Joi.string().allow('')
        }).required()
      });

      const { error } = schema.validate(req.body);
      if (error) {
        console.error('Edviron webhook validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }
    } 
    // Check if it's a Cashfree webhook
    else if (req.body.type || req.body.cf_payment_id || req.body.order_id) {
      webhookType = 'cashfree';
      
      // Map Cashfree webhook to our format
      orderInfo = {
        order_id: req.body.order_id || req.body.cf_order_id,
        order_amount: parseFloat(req.body.order_amount || req.body.payment_amount || 0),
        transaction_amount: parseFloat(req.body.payment_amount || req.body.order_amount || 0),
        gateway: 'Cashfree',
        bank_reference: req.body.bank_reference || req.body.cf_payment_id || '',
        status: mapCashfreeStatus(req.body.payment_status || req.body.order_status),
        payment_mode: req.body.payment_method || req.body.payment_group || 'online',
        payment_details: JSON.stringify({
          cf_payment_id: req.body.cf_payment_id,
          payment_method: req.body.payment_method,
          payment_group: req.body.payment_group
        }),
        payment_message: req.body.payment_message || req.body.failure_reason || '',
        payment_time: new Date(req.body.payment_time || req.body.txTime || Date.now()),
        error_message: req.body.failure_reason || req.body.error_details || ''
      };

      console.log('Mapped Cashfree webhook:', orderInfo);
    }
    // Generic webhook format
    else {
      webhookType = 'generic';
      orderInfo = {
        order_id: req.body.order_id || req.body.orderId || req.body.id,
        order_amount: parseFloat(req.body.amount || req.body.order_amount || 0),
        transaction_amount: parseFloat(req.body.amount || req.body.transaction_amount || 0),
        gateway: req.body.gateway || 'Unknown',
        bank_reference: req.body.reference || req.body.txn_id || '',
        status: normalizeStatus(req.body.status || req.body.payment_status),
        payment_mode: req.body.payment_mode || req.body.method || 'online',
        payment_details: JSON.stringify(req.body),
        payment_message: req.body.message || '',
        payment_time: new Date(req.body.timestamp || req.body.payment_time || Date.now()),
        error_message: req.body.error || ''
      };
    }

    if (!orderInfo || !orderInfo.order_id) {
      console.error('Invalid webhook: No order ID found');
      console.log('Request body:', req.body);
      return res.status(400).json({ error: 'Invalid webhook: No order ID found' });
    }

    console.log(`Processing ${webhookType} webhook for order:`, orderInfo.order_id);

    // Find the order by custom_order_id (which is collect_id from payment gateway)
    const order = await Order.findOne({ custom_order_id: orderInfo.order_id });
    
    if (!order) {
      console.error('Order not found for webhook:', orderInfo.order_id);
      // Still return success to avoid webhook retries for non-existent orders
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook received but order not found',
        order_id: orderInfo.order_id 
      });
    }

    console.log('Found order:', order._id);

    // Create or update OrderStatus
    const orderStatusData = {
      collect_id: order._id,
      order_amount: orderInfo.order_amount,
      transaction_amount: orderInfo.transaction_amount,
      payment_mode: orderInfo.payment_mode,
      payment_details: orderInfo.payment_details || '',
      bank_reference: orderInfo.bank_reference || '',
      payment_message: orderInfo.payment_message || '',
      status: orderInfo.status,
      error_message: orderInfo.error_message || 'NA',
      payment_time: orderInfo.payment_time
    };

    console.log('Order status data:', orderStatusData);

    // Check if OrderStatus already exists for this order
    let orderStatus = await OrderStatus.findOne({ collect_id: order._id });
    
    if (orderStatus) {
      // Update existing OrderStatus
      Object.assign(orderStatus, orderStatusData);
      await orderStatus.save();
      console.log('Updated existing OrderStatus');
    } else {
      // Create new OrderStatus
      orderStatus = new OrderStatus(orderStatusData);
      await orderStatus.save();
      console.log('Created new OrderStatus');
    }

    // Update order status
    const previousStatus = order.status;
    order.status = orderInfo.status.toLowerCase();
    order.gateway_name = orderInfo.gateway;
    await order.save();

    console.log(`Order status updated from "${previousStatus}" to "${order.status}"`);

    res.status(200).json({ 
      success: true,
      message: `${webhookType} webhook processed successfully`,
      order_id: order._id,
      status: order.status
    });

  } catch (error) {
    console.error('=== Webhook Processing Error ===');
    console.error('Error Details:', error.message);
    console.error('Full Error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to process webhook',
      details: error.message 
    });
  }
};

// Helper function to map Cashfree status to our standard status
function mapCashfreeStatus(cashfreeStatus) {
  if (!cashfreeStatus) return 'pending';
  
  const statusMap = {
    'SUCCESS': 'success',
    'PAID': 'success',
    'ACTIVE': 'pending',
    'PENDING': 'pending',
    'FAILED': 'failed',
    'CANCELLED': 'failed',
    'USER_DROPPED': 'failed',
    'VOID': 'failed',
    'TERMINATED': 'failed',
    'EXPIRED': 'failed'
  };
  
  return statusMap[cashfreeStatus.toUpperCase()] || 'pending';
}

// Helper function to normalize status from generic webhooks
function normalizeStatus(status) {
  if (!status) return 'pending';
  
  const statusLower = status.toLowerCase();
  
  if (['success', 'successful', 'completed', 'paid', 'confirmed'].includes(statusLower)) {
    return 'success';
  } else if (['failed', 'failure', 'declined', 'cancelled', 'rejected'].includes(statusLower)) {
    return 'failed';
  } else {
    return 'pending';
  }
}

exports.getWebhookLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await WebhookLog.find()
      .sort({ event_time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await WebhookLog.countDocuments();
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};