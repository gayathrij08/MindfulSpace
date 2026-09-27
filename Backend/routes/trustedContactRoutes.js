const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getTrustedContact,
  saveTrustedContact,
  deleteTrustedContact,
  sendTestEmail,
  sendTestSms
} = require('../controllers/trustedContactController');

const router = express.Router();
router.use(protect);
router.post('/test-email', sendTestEmail);
router.post('/test-sms', sendTestSms);
router.route('/').get(getTrustedContact).put(saveTrustedContact).delete(deleteTrustedContact);

module.exports = router;
