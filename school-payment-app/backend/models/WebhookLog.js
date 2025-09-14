const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema({
  event_time: {
    type: Date,
    default: Date.now
  },
  payload: {
    type: Object,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
