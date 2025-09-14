const axios = require('axios');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const Joi = require('joi');

// Updated Payment Gateway Credentials
const PG_KEY = 'edvtest01';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0cnVzdGVlSWQiOiI2NWIwZTU1MmRkMzE5NTBhOWI0MWM1YmEiLCJJbmRleE9mQXBpS2V5Ijo2fQ.IJWTYCOurGCFdRM2xyKtw6TEcuwXxGnmINrXFfsAdt0';
const SCHOOL_ID = '65b0e6293e9f76a9694d84b4';
const PAYMENT_API_URL = 'https://dev-vanilla.edviron.com/erp';

exports.createPayment = async (req, res) => {
  try {
    console.log('=== Payment Creation Started ===');
    console.log('Request Body:', req.body);

    // Validation
    const schema = Joi.object({
      amount: Joi.number().required().min(1),
      student_name: Joi.string().required(),
      student_id: Joi.string().required(),
      student_email: Joi.string().email().required(),
      school_name: Joi.string().required(),
      preferred_payment_mode: Joi.string().valid('upi', 'netbanking', 'card', 'wallet', 'any').default('any'),
      callback_url: Joi.string().uri().optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      console.log('Validation Error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { 
      amount, 
      student_name, 
      student_id, 
      student_email, 
      school_name,
      preferred_payment_mode = 'any',
      callback_url = 'http://localhost:5173/payment-success' 
    } = req.body;

    console.log('Validated Data:', {
      amount,
      school_name,
      preferred_payment_mode,
      callback_url
    });

    // Create order in database
    const order = new Order({
      school_id: SCHOOL_ID,
      school_name: school_name,
      trustee_id: req.user?.userId || 'default_trustee',
      student_info: {
        name: student_name,
        id: student_id,
        email: student_email
      },
      gateway_name: 'Edviron',
      amount: amount,
      preferred_payment_mode: preferred_payment_mode,
      status: 'pending'
    });

    await order.save();
    console.log('Order saved to database:', order._id);

    // Create JWT payload for signing
    const payloadToSign = {
      school_id: SCHOOL_ID,
      amount: amount.toString(),
      callback_url: callback_url
    };

    console.log('JWT Payload to Sign:', payloadToSign);
    console.log('PG Key:', PG_KEY);

    // Generate JWT sign
    const sign = jwt.sign(payloadToSign, PG_KEY);
    console.log('Generated JWT Sign:', sign);

    // Prepare API request
    const apiPayload = {
      school_id: SCHOOL_ID,
      amount: amount.toString(),
      callback_url: callback_url,
      sign: sign
    };

    console.log('API Payload:', apiPayload);
    console.log('API URL:', `${PAYMENT_API_URL}/create-collect-request`);
    console.log('API Key:', API_KEY);

    // Call payment gateway API
    const paymentResponse = await axios.post(
      `${PAYMENT_API_URL}/create-collect-request`,
      apiPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    console.log('Payment API Full Response:', JSON.stringify(paymentResponse.data, null, 2));

    // Check if the response has the expected structure
    if (!paymentResponse.data || !paymentResponse.data.collect_request_id) {
      console.error('Invalid API response structure:', paymentResponse.data);
      return res.status(500).json({ 
        error: 'Invalid response from payment gateway',
        details: paymentResponse.data 
      });
    }

    // Update order with collect_request_id
    order.custom_order_id = paymentResponse.data.collect_request_id;
    await order.save();
    console.log('Order updated with collect_request_id:', order.custom_order_id);

    // Try different possible field names for the payment URL
    let paymentUrl = null;
    const possibleUrlFields = [
      'Collect_request_url',
      'collect_request_url', 
      'payment_url',
      'url',
      'redirect_url',
      'paymentUrl'
    ];

    for (const field of possibleUrlFields) {
      if (paymentResponse.data[field]) {
        paymentUrl = paymentResponse.data[field];
        console.log(`Found payment URL in field '${field}':`, paymentUrl);
        break;
      }
    }

    if (!paymentUrl) {
      console.error('No payment URL found in response:', paymentResponse.data);
      return res.status(500).json({ 
        error: 'Payment URL not found in gateway response',
        details: paymentResponse.data 
      });
    }

    // Return success response
    const response = {
      success: true,
      order_id: order._id,
      custom_order_id: order.custom_order_id,
      payment_url: paymentUrl,
      amount: amount,
      school_name: school_name,
      preferred_payment_mode: preferred_payment_mode,
      message: 'Payment link generated successfully'
    };

    console.log('Final Response:', response);
    console.log('=== Payment Creation Completed ===');

    res.status(201).json(response);

  } catch (error) {
    console.error('=== Payment Creation Error ===');
    console.error('Error Details:', error.response?.data || error.message);
    console.error('Full Error:', error);
    
    res.status(500).json({ 
      error: 'Failed to create payment',
      details: error.response?.data || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  try {
    console.log('=== Payment Status Check Started ===');
    const { collect_request_id } = req.params;
    console.log('Checking status for collect_request_id:', collect_request_id);

    // Create JWT sign for status check
    const payloadToSign = {
      school_id: SCHOOL_ID,
      collect_request_id: collect_request_id
    };

    console.log('Status Check JWT Payload:', payloadToSign);
    const sign = jwt.sign(payloadToSign, PG_KEY);
    console.log('Status Check JWT Sign:', sign);

    const statusUrl = `${PAYMENT_API_URL}/collect-request/${collect_request_id}?school_id=${SCHOOL_ID}&sign=${sign}`;
    console.log('Status Check URL:', statusUrl);

    // Call payment gateway status API
    const statusResponse = await axios.get(statusUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    console.log('Status API Response:', statusResponse.data);

    // Update order status in database
    const updatedOrder = await Order.findOneAndUpdate(
      { custom_order_id: collect_request_id },
      { status: statusResponse.data.status.toLowerCase() },
      { new: true }
    );

    console.log('Updated Order Status:', updatedOrder?.status);

    const response = {
      success: true,
      status: statusResponse.data.status,
      amount: statusResponse.data.amount,
      details: statusResponse.data.details
    };

    console.log('Status Check Response:', response);
    console.log('=== Payment Status Check Completed ===');

    res.json(response);

  } catch (error) {
    console.error('=== Payment Status Check Error ===');
    console.error('Error Details:', error.response?.data || error.message);
    
    res.status(500).json({ 
      error: 'Failed to check payment status',
      details: error.response?.data || error.message 
    });
  }
};