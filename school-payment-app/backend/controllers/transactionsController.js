const Order = require('../models/Order');
const OrderStatus = require('../models/OrderStatus');
const mongoose = require('mongoose');

exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, school_id, sort = 'payment_time', order = 'desc' } = req.query;
    
    // Build match conditions
    const matchConditions = {};
    if (status) matchConditions.status = status;
    if (school_id) matchConditions.school_id = school_id;

    // MongoDB aggregation pipeline to join Order and OrderStatus
    const aggregationPipeline = [
      // Match orders based on conditions
      { $match: matchConditions },
      
      // Lookup (join) with OrderStatus collection
      {
        $lookup: {
          from: 'orderstatuses', // MongoDB pluralizes collection names
          localField: '_id',
          foreignField: 'collect_id',
          as: 'order_status'
        }
      },
      
      // Unwind the order_status array (convert array to object)
      {
        $unwind: {
          path: '$order_status',
          preserveNullAndEmptyArrays: true // Keep orders without status
        }
      },
      
      // Project the required fields
      {
        $project: {
          collect_id: '$_id',
          school_id: 1,
          gateway: '$gateway_name',
          order_amount: '$amount',
          transaction_amount: '$order_status.transaction_amount',
          status: 1,
          custom_order_id: 1,
          payment_time: '$order_status.payment_time',
          payment_mode: '$order_status.payment_mode',
          bank_reference: '$order_status.bank_reference',
          student_info: 1,
          createdAt: 1
        }
      },
      
      // Sort
      {
        $sort: {
          [sort]: order === 'desc' ? -1 : 1
        }
      }
    ];

    // Get total count for pagination
    const totalCountPipeline = [...aggregationPipeline, { $count: 'total' }];
    const countResult = await Order.aggregate(totalCountPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination to main pipeline
    aggregationPipeline.push(
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    );

    // Execute aggregation
    const transactions = await Order.aggregate(aggregationPipeline);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error.message 
    });
  }
};

exports.getTransactionsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const aggregationPipeline = [
      // Match by school_id
      { $match: { school_id: schoolId } },
      
      // Join with OrderStatus
      {
        $lookup: {
          from: 'orderstatuses',
          localField: '_id',
          foreignField: 'collect_id',
          as: 'order_status'
        }
      },
      
      {
        $unwind: {
          path: '$order_status',
          preserveNullAndEmptyArrays: true
        }
      },
      
      {
        $project: {
          collect_id: '$_id',
          school_id: 1,
          gateway: '$gateway_name',
          order_amount: '$amount',
          transaction_amount: '$order_status.transaction_amount',
          status: 1,
          custom_order_id: 1,
          payment_time: '$order_status.payment_time',
          payment_mode: '$order_status.payment_mode',
          student_info: 1
        }
      },
      
      { $sort: { payment_time: -1 } },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ];

    const transactions = await Order.aggregate(aggregationPipeline);

    // Get total count
    const total = await Order.countDocuments({ school_id: schoolId });

    res.json({
      success: true,
      school_id: schoolId,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching school transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch school transactions',
      details: error.message 
    });
  }
};

exports.getTransactionStatus = async (req, res) => {
  try {
    const { custom_order_id } = req.params;

    const order = await Order.findOne({ custom_order_id });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Transaction not found',
        custom_order_id 
      });
    }

    // Get order status details if available
    const orderStatus = await OrderStatus.findOne({ collect_id: order._id });

    res.json({
      success: true,
      custom_order_id,
      status: order.status,
      amount: order.amount,
      school_id: order.school_id,
      student_info: order.student_info,
      payment_details: orderStatus ? {
        transaction_amount: orderStatus.transaction_amount,
        payment_mode: orderStatus.payment_mode,
        bank_reference: orderStatus.bank_reference,
        payment_time: orderStatus.payment_time,
        payment_message: orderStatus.payment_message
      } : null
    });

  } catch (error) {
    console.error('Error fetching transaction status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transaction status',
      details: error.message 
    });
  }
};