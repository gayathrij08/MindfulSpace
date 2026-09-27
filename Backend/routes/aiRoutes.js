const express = require('express');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const {
  generateChatResponse,
  getConversationHistory,
  clearConversationHistory
} = require('../controllers/aiController');

const router = express.Router();

// The shared home-page widget can chat without an account. Authenticated
// users still get conversation persistence through the same controller.
router.post('/chat', optionalProtect, generateChatResponse);

// Conversation history remains private.
router.use(protect);
router.get('/conversation', getConversationHistory);
router.delete('/conversation', clearConversationHistory);

module.exports = router;
