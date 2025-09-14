const Order = require('../models/Order');
const Joi = require('joi');

exports.createOrder = async (req, res) => {
  try {
    const schema = Joi.object({
      school_id: Joi.string().required(),
      amount: Joi.number().required(),
      status: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrdersBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const orders = await Order.find({ school_id: schoolId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const orders = await Order.find({ status });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.filterOrders = async (req, res) => {
  try {
    const { school_id, status } = req.query;
    let filter = {};

    if (school_id) filter.school_id = school_id;
    if (status) filter.status = status;

    const orders = await Order.find(filter);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
