const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  school_id: {
    type: String,
    required: true
  },
  trustee_id: {
    type: String
  },
  student_info: {
    name: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  gateway_name: {
    type: String,
    required: true
  },
  custom_order_id: {
    type: String,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'success', 'failed']
  }
}, {
  timestamps: true
});

// Generate custom_order_id before saving
orderSchema.pre('save', function(next) {
  if (!this.custom_order_id) {
    this.custom_order_id = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);