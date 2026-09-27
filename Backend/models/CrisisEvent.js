const mongoose = require('mongoose');

const CrisisEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  detectedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  alertTriggered: {
    type: Boolean,
    default: false
  },
  alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmergencyAlert'
  },
  status: {
    type: String,
    enum: ['detected', 'alert_sent', 'alert_failed', 'resolved'],
    default: 'detected'
  }
});

CrisisEventSchema.index({ user: 1, detectedAt: -1 });

module.exports = mongoose.models.CrisisEvent || mongoose.model('CrisisEvent', CrisisEventSchema);
