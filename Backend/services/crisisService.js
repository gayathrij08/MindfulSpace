const CrisisEvent = require('../models/CrisisEvent');
const TrustedContact = require('../models/TrustedContact');
const { sendEmergencyAlert } = require('./emergencyAlertService');

const HIGH_RISK_PATTERNS = [
  /\bwant(?:ed)? to (?:die|kill myself|end my life|hurt myself)\b/i,
  /\b(?:going|planning|plan) to (?:kill myself|hurt myself|end my life|commit suicide)\b/i,
  /\b(?:might|may|could) kill myself\b/i,
  /\b(?:don't|do not|dont) want to live anymore\b/i,
  /\bfeel like dying\b/i,
  /\b(?:i am|i'm) suicidal\b/i,
  /\bself[- ]harm(?:ing)?\b/i,
  /\b(?:immediate danger|not safe|unsafe right now)\b/i
];

const EDUCATIONAL_PATTERNS = [
  /\bwhat (?:does|is|are) suicide prevention\b/i,
  /\b(?:learn|learning|educational|education|meaning|definition|information|informational)\b.*\b(?:suicide|self[- ]harm)\b/i,
  /\b(?:suicide|self[- ]harm)\b.*\b(?:prevention|awareness|statistics|meaning|definition|information|informational)\b/i
];

function classifyCrisisRisk(message) {
  const normalized = message.trim();
  if (EDUCATIONAL_PATTERNS.some(pattern => pattern.test(normalized)) &&
      !HIGH_RISK_PATTERNS.some(pattern => pattern.test(normalized))) {
    return 'low';
  }
  if (HIGH_RISK_PATTERNS.some(pattern => pattern.test(normalized))) return 'high';
  if (/\b(?:hopeless|can't go on|cannot go on|overwhelmed|severely distressed)\b/i.test(normalized)) return 'medium';
  return 'low';
}

async function handleHighRiskCrisis(userId) {
  if (!userId) {
    return { deliveryConfirmed: false, alertStatus: 'no_authenticated_user' };
  }

  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  let event = await CrisisEvent.findOne({
    user: userId,
    riskLevel: 'high',
    detectedAt: { $gte: cutoff },
    status: { $ne: 'resolved' }
  }).sort({ detectedAt: -1 });

  if (event) {
    const existingAlert = event.alert ? await require('../models/EmergencyAlert').findById(event.alert) : null;
    if (event.status === 'detected' && !event.alert) {
      const trustedContact = await TrustedContact.findOne({ user: userId });
      if (trustedContact?.emergencyAlertConsent) {
        return sendEmergencyAlert({
          userId,
          crisisEventId: event._id,
          trustedContact
        });
      }
    }

    return {
      deliveryConfirmed: event.status === 'alert_sent',
      alertStatus: event.status,
      smsStatus: existingAlert?.smsStatus || 'not_configured',
      emailStatus: existingAlert?.emailStatus || 'not_configured',
      duplicate: true
    };
  }

  event = await CrisisEvent.create({ user: userId, riskLevel: 'high' });
  const trustedContact = await TrustedContact.findOne({ user: userId });

  if (!trustedContact || !trustedContact.emergencyAlertConsent) {
    console.log('CRISIS_RISK: HIGH');
    console.log(`TRUSTED_CONTACT: ${trustedContact ? 'FOUND' : 'NOT_FOUND'}`);
    if (trustedContact) console.log('TRUSTED_CONTACT_CONSENT:', trustedContact.emergencyAlertConsent);
    console.log('EMAIL_STATUS:', 'not_configured');
    event.status = 'detected';
    await event.save();
    return {
      deliveryConfirmed: false,
      alertStatus: trustedContact ? 'consent_disabled' : 'no_trusted_contact',
      smsStatus: 'not_configured',
      emailStatus: 'not_configured'
    };
  }

  return sendEmergencyAlert({
    userId,
    crisisEventId: event._id,
    trustedContact
  });
}

module.exports = { classifyCrisisRisk, handleHighRiskCrisis };
