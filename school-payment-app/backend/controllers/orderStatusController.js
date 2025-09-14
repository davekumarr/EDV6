const OrderStatus = require('../models/OrderStatus');
const Joi = require('joi');

exports.createOrderStatus = async (req, res) => {
  try {
    const schema = Joi.object({
      collect_id: Joi.string().required(),
      order_amount: Joi.number().required(),
      transaction_amount: Joi.number().required(),
      payment_mode: Joi.string().required(),
      payment_details: Joi.string().allow(''),
      bank_reference: Joi.string().allow(''),
      payment_message: Joi.string().allow(''),
      status: Joi.string().required(),
      error_message: Joi.string().allow(''),
      payment_time: Joi.date()
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const orderStatus = new OrderStatus(req.body);
    await orderStatus.save();
    res.status(201).json(orderStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
