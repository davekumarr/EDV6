const WebhookLog = require('../models/WebhookLog');
const Joi = require('joi');

exports.createWebhookLog = async (req, res) => {
  try {
    const schema = Joi.object({
      payload: Joi.object().required()
    });

    const { error } = schema.validate({ payload: req.body });
    if (error) return res.status(400).json({ error: error.details[0].message });

    const log = new WebhookLog({
      payload: req.body
    });

    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWebhookLogs = async (req, res) => {
  try {
    const logs = await WebhookLog.find().sort({ event_time: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
