const axios = require('axios');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const Joi = require('joi');

// Payment Gateway Credentials from assessment
const PG_KEY = 'edvtest01';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cnVzdGVlSWQiOiI2NWIwZTU1MmRkMzE5NTBhOWI0MWM1YmEiLCJJbmRleE9mQXBpS2V5Ijo2LCJpYXQiOjE3MTE2MjIyNzAsImV4cCI6MTc0MzE3OTg3MH0.Rye77Dp59GGxwCmwWekJHRj6edXWJnff9finjMhxKuw';
const SCHOOL_ID = '65b0e6293e9f76a9694d84b4';
const PAYMENT_API_URL = 'https://dev-vanilla.edviron.com/erp';

exports.createPayment = async (req, res) => {
  try {
    // Validate request body
    const schema = Joi.object({
      amount: Joi.number().required().min(1),
      student_name: Joi.string().required(),
      student_id: Joi.string().required(),
      student_email: Joi.string().email().required(),
      callback_url: Joi.string().uri().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { amount, student_name, student_id, student_email, callback_url = 'http://localhost:5173/payment-success' } = req.body;

    // Create order in database
    const order = new Order({
      school_id: SCHOOL_ID,
      trustee_id: req.user?.userId || 'default_trustee',
      student_info: {
        name: student_name,
        id: student_id,
        email: student_email
      },
      gateway_name: 'Edviron',
      amount: amount,
      status: 'pending'
    });

    await order.save();

    // Create JWT sign for payment gateway
    const payloadToSign = {
      school_id: SCHOOL_ID,
      amount: amount.toString(),
      callback_url: callback_url
    };

    const sign = jwt.sign(payloadToSign, PG_KEY);

    // Call payment gateway API
    const paymentResponse = await axios.post(
      `${PAYMENT_API_URL}/create-collect-request`,
      {
        school_id: SCHOOL_ID,
        amount: amount.toString(),
        callback_url: callback_url,
        sign: sign
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // Update order with collect_request_id
    order.custom_order_id = paymentResponse.data.collect_request_id;
    await order.save();

    // Return payment URL and order details
    res.status(201).json({
      success: true,
      order_id: order._id,
      custom_order_id: order.custom_order_id,
      payment_url: paymentResponse.data.Collect_request_url,
      amount: amount,
      message: 'Payment link generated successfully'
    });

  } catch (error) {
    console.error('Payment creation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to create payment',
      details: error.response?.data || error.message 
    });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    const { collect_request_id } = req.params;

    // Create JWT sign for status check
    const payloadToSign = {
      school_id: SCHOOL_ID,
      collect_request_id: collect_request_id
    };

    const sign = jwt.sign(payloadToSign, PG_KEY);

    // Call payment gateway status API
    const statusResponse = await axios.get(
      `${PAYMENT_API_URL}/collect-request/${collect_request_id}?school_id=${SCHOOL_ID}&sign=${sign}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // Update order status in database
    await Order.findOneAndUpdate(
      { custom_order_id: collect_request_id },
      { status: statusResponse.data.status.toLowerCase() }
    );

    res.json({
      success: true,
      status: statusResponse.data.status,
      amount: statusResponse.data.amount,
      details: statusResponse.data.details
    });

  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to check payment status',
      details: error.response?.data || error.message 
    });
  }
};