const mongoose = require('mongoose');

const TrustedContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  relationship: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  emergencyAlertConsent: {
    type: Boolean,
    required: true,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.models.TrustedContact || mongoose.model('TrustedContact', TrustedContactSchema);
