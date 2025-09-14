const WebhookLog = require('../models/WebhookLog');
const OrderStatus = require('../models/OrderStatus');
const Order = require('../models/Order');
const Joi = require('joi');

exports.handleWebhook = async (req, res) => {
  try {
    // Log the webhook payload
    const webhookLog = new WebhookLog({
      payload: req.body
    });
    await webhookLog.save();

    // Validate webhook payload
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
      console.error('Webhook validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { order_info } = req.body;

    // Find the order by custom_order_id (which is collect_id from payment gateway)
    const order = await Order.findOne({ custom_order_id: order_info.order_id });
    
    if (!order) {
      console.error('Order not found for webhook:', order_info.order_id);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create or update OrderStatus
    const orderStatusData = {
      collect_id: order._id,
      order_amount: order_info.order_amount,
      transaction_amount: order_info.transaction_amount,
      payment_mode: order_info.payment_mode,
      payment_details: order_info.payment_details || '',
      bank_reference: order_info.bank_reference || '',
      payment_message: order_info.payment_message || '',
      status: order_info.status,
      error_message: order_info.error_message || 'NA',
      payment_time: new Date(order_info.payment_time)
    };

    // Check if OrderStatus already exists for this order
    let orderStatus = await OrderStatus.findOne({ collect_id: order._id });
    
    if (orderStatus) {
      // Update existing OrderStatus
      Object.assign(orderStatus, orderStatusData);
      await orderStatus.save();
    } else {
      // Create new OrderStatus
      orderStatus = new OrderStatus(orderStatusData);
      await orderStatus.save();
    }

    // Update order status
    order.status = order_info.status.toLowerCase();
    order.gateway_name = order_info.gateway;
    await order.save();

    res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully',
      order_id: order._id 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message 
    });
  }
};

exports.getWebhookLogs = async (req, res) => {
  try {
    const logs = await WebhookLog.find().sort({ event_time: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};