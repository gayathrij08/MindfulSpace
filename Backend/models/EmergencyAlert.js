const mongoose = require('mongoose');

const EmergencyAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trustedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrustedContact',
    required: true
  },
  crisisEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrisisEvent',
    required: true
  },
  smsStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'not_configured'],
    default: 'pending'
  },
  smsErrorCode: String,
  smsErrorMessage: String,
  emailStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'not_configured'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'not_configured'],
    default: 'pending'
  },
  sentAt: Date,
  acknowledgedAt: Date
}, { timestamps: true });

EmergencyAlertSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.EmergencyAlert || mongoose.model('EmergencyAlert', EmergencyAlertSchema);
