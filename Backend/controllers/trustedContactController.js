const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const { maskEmail } = require('../services/emergencyAlertService');
const { sendSms } = require('../services/emergencyAlertService');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s().-]{8,25}$/;

function validateContact(body) {
  const { name, relationship, phone, email, emergencyAlertConsent } = body;
  if (!name || !relationship || !phone || !email) return 'Name, relationship, phone, and email are required';
  if (!phonePattern.test(phone)) return 'Please provide a valid phone number';
  if (!emailPattern.test(email)) return 'Please provide a valid email address';
  if (emergencyAlertConsent !== true && emergencyAlertConsent !== false) return 'Emergency alert consent must be explicitly recorded';
  return null;
}

function publicContact(contact) {
  if (!contact) return null;
  return {
    id: contact._id,
    name: contact.name,
    relationship: contact.relationship,
    phone: contact.phone,
    email: contact.email,
    emergencyAlertConsent: contact.emergencyAlertConsent,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt
  };
}

async function getTrustedContact(req, res) {
  try {
    const contact = await TrustedContact.findOne({ user: req.user.id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'No emergency support contact has been added yet.' });
    }
    res.json({ success: true, trustedContact: publicContact(contact) });
  } catch (error) {
    console.error('Get trusted contact error:', error.message);
    res.status(500).json({ success: false, message: 'Could not load trusted contact' });
  }
}

async function saveTrustedContact(req, res) {
  try {
    const validationError = validateContact(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const contact = await TrustedContact.findOneAndUpdate(
      { user: req.user.id },
      { ...req.body, user: req.user.id },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, trustedContact: publicContact(contact), message: 'Trusted contact saved successfully' });
  } catch (error) {
    console.error('Save trusted contact error:', error.message);
    res.status(500).json({ success: false, message: 'Could not save trusted contact' });
  }
}

async function deleteTrustedContact(req, res) {
  try {
    await TrustedContact.findOneAndDelete({ user: req.user.id });
    res.json({ success: true, message: 'Trusted contact removed' });
  } catch (error) {
    console.error('Delete trusted contact error:', error.message);
    res.status(500).json({ success: false, message: 'Could not remove trusted contact' });
  }
}

async function sendTestEmail(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Development-only endpoint' });
  }

  try {
    const contact = await TrustedContact.findOne({ user: req.user.id });
    if (!contact) return res.status(404).json({ success: false, message: 'No trusted contact found' });
    if (contact.emergencyAlertConsent !== true) {
      return res.status(403).json({ success: false, message: 'Emergency alert consent is disabled' });
    }

    const user = await User.findById(req.user.id).select('firstName');
    if (!user) return res.status(404).json({ success: false, message: 'Authenticated user not found' });

    console.log('TEST_EMAIL_AUTH_USER: RESOLVED');
    console.log('TEST_EMAIL_TRUSTED_CONTACT:', maskEmail(contact.email));
    console.log('TEST_EMAIL_SEND_ATTEMPT: true');
    const result = await sendEmail({
      to: contact.email,
      subject: 'MindfulSpace Emergency Support Alert',
      text: `Hello ${contact.name},\n\nThis is a development test of MindfulSpace emergency support for ${user.firstName || 'the user'}. No private chat content is included.\n\nMindfulSpace Support`
    });

    if (!result.success) {
      console.log('TEST_EMAIL_STATUS: failed');
      console.log('TEST_EMAIL_ERROR_CODE:', result.code || 'send_failed');
      return res.status(502).json({ success: false, emailStatus: 'failed', errorCode: result.code || 'send_failed' });
    }

    console.log('TEST_EMAIL_SMTP_ACCEPTED: true');
    console.log('TEST_EMAIL_MESSAGE_ID:', result.messageId || 'unavailable');
    return res.json({ success: true, emailStatus: 'sent', messageId: result.messageId });
  } catch (error) {
    console.error('Development test email failed:', error.message);
    return res.status(500).json({ success: false, emailStatus: 'failed', errorCode: 'send_failed' });
  }
}

async function sendTestSms(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ success: false, message: 'Development-only endpoint' });
  }

  try {
    const contact = await TrustedContact.findOne({ user: req.user.id });
    if (!contact) return res.status(404).json({ success: false, message: 'No trusted contact found' });
    if (contact.emergencyAlertConsent !== true) {
      return res.status(403).json({ success: false, message: 'Emergency alert consent is disabled' });
    }

    const result = await sendSms(
      contact.phone,
      'MindfulSpace emergency support test. No private chat content is included.'
    );
    if (result.status !== 'sent') {
      return res.status(502).json({
        success: false,
        smsStatus: result.status,
        errorCode: result.errorCode || 'sms_failed',
        errorMessage: result.errorMessage || 'SMS is not configured.'
      });
    }

    return res.json({ success: true, smsStatus: 'sent', messageSid: result.messageSid });
  } catch (error) {
    console.error('Development test SMS failed:', error.message);
    return res.status(500).json({ success: false, smsStatus: 'failed', errorCode: 'sms_failed', errorMessage: 'SMS test failed' });
  }
}

module.exports = { getTrustedContact, saveTrustedContact, deleteTrustedContact, sendTestEmail, sendTestSms };
