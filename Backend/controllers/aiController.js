const Conversation = require('../models/Conversation');
const { classifyCrisisRisk, handleHighRiskCrisis } = require('../services/crisisService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Safety filter keywords
const EMERGENCY_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'hurt myself',
  'cut myself', 'overdose', 'jump off', 'hang myself', 'not worth living',
  'better off dead', 'end it all', 'can\'t go on', 'taking my life'
];

const HARMFUL_CONTENT = [
  'violence', 'self-medication', 'illegal drugs', 'alcohol abuse'
];

const LOCAL_FALLBACK_RESPONSES = [
  "Hey, I'm still here. What's on your mind?",
  "We can keep this simple. Tell me what you're feeling right now.",
  "You don't need the perfect words. Just start wherever feels easiest.",
  "Okay, I'm listening. What's been going on?",
  "Take your time. You can tell me what's bothering you."
];

// Initialize Google Generative AI (Gemini)
let genAI = null;
let aiInitialized = false;
const isProduction = process.env.NODE_ENV === 'production';

// Function to initialize AI service with better error handling
function initializeAI() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.warn('🚨 No Google AI API key provided. AI responses will use fallback mode.');
      return false;
    }
    
    if (apiKey.length < 30) {
      console.warn('🚨 Google AI API key seems too short. Please check your .env file.');
      return false;
    }
    
    genAI = new GoogleGenerativeAI(apiKey);
    if (!isProduction) {
      console.log('✅ Google AI initialized successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Google AI:', error.message);
    return false;
  }
}

// Initialize on startup
aiInitialized = initializeAI();

// @desc    Generate AI chat response
// @route   POST /api/ai/chat
// @access  Private
const generateChatResponse = async (req, res) => {
  try {
    const { message, context, mood, language } = req.body;
    const userId = req.user?.id;

    if (!isProduction) {
      console.log('AI Chat Request:', {
        userId,
        mood: mood?.label,
        messageLength: message?.length || 0
      });
    }

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Deterministic crisis detection stays authoritative before Gemini.
    const riskLevel = classifyCrisisRisk(message);
    if (riskLevel === 'high') {
      let alertStatus;
      try {
        alertStatus = await handleHighRiskCrisis(userId);
      } catch (alertError) {
        console.error('Emergency alert processing failed:', alertError.message);
        alertStatus = {
          deliveryConfirmed: false,
          alertStatus: 'alert_failed',
          smsStatus: 'failed',
          emailStatus: 'failed'
        };
      }
      const emergencyResponse = getEmergencyResponse(alertStatus);
      
      // Save conversation
      await saveConversation(userId, message, emergencyResponse, 'emergency');
      
      return res.status(200).json({
        success: true,
        response: emergencyResponse,
        reply: emergencyResponse,
        type: 'emergency',
        riskLevel,
        alert: alertStatus
      });
    }

    // Prepare context for AI
    const aiContext = prepareAIContext(message, context, mood, language);
    
    // Generate response using Google Gemini AI
    let aiResponse;
    try {
      if (!isProduction) {
        console.log('Generating AI response with Gemini...');
      }

      aiResponse = await generateGeminiResponse(aiContext, message);

      if (!isProduction) {
        console.log('AI response generated successfully');
      }
    } catch (aiError) {
      console.error('Gemini API Error: returning local fallback response.', {
        message: aiError?.message,
        status: aiError?.status,
        stack: isProduction ? undefined : aiError?.stack
      });

      const fallbackResponse = getLocalFallbackResponse(message, mood);
      await saveConversation(userId, message, fallbackResponse, 'fallback');

      return res.status(200).json({
        success: true,
        response: fallbackResponse,
        reply: fallbackResponse,
        type: 'fallback',
        fallback: true,
        mood: mood?.label || null,
        aiGenerated: false
      });
    }

    // Apply safety filters
    const safeResponse = applySafetyFilters(aiResponse);

    console.log('Gemini reply length:', safeResponse.length);
    console.log('Gemini reply:', safeResponse);
    
    // Save conversation
    await saveConversation(userId, message, safeResponse, 'normal');
    
    res.status(200).json({
      success: true,
      response: safeResponse,
      reply: safeResponse,
      type: 'normal',
      mood: mood?.label || null,
      aiGenerated: true
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get conversation history
// @route   GET /api/ai/conversation
// @access  Private
const getConversationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const conversations = await Conversation.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('userMessage aiResponse type createdAt');
    
    res.status(200).json({
      success: true,
      conversations: conversations.reverse() // Return in chronological order
    });

  } catch (error) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history'
    });
  }
};

// @desc    Clear conversation history
// @route   DELETE /api/ai/conversation
// @access  Private
const clearConversationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Conversation.deleteMany({ user: userId });
    
    res.status(200).json({
      success: true,
      message: 'Conversation history cleared successfully'
    });

  } catch (error) {
    console.error('Clear Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history'
    });
  }
};

// Helper Functions

function getEmergencyResponse(alertStatus = {}) {
  const deliveryMessage = alertStatus.deliveryConfirmed
    ? 'MindfulSpace confirmed delivery of an emergency-support alert through at least one configured channel.'
    : 'I could not confirm delivery of a trusted-contact alert. Please contact someone you trust directly.';

  return `I'm really glad you told me. Your safety matters, and you do not have to handle this alone.

**Immediate Support:**
• **Crisis Helpline: 9152987821** (Available 24/7)
• **Emergency Services: 100**
• **AASRA: 022-27546669** (24x7 Suicide Prevention)

Please stay with someone you trust if you can and seek immediate human support. ${deliveryMessage}

If you're in immediate danger, call emergency services or go to the nearest emergency department now. Are you in immediate danger right now?`;
}

function prepareAIContext(message, context, mood, language) {
  let aiContext = `You are the MindfulSpace AI Assistant, a warm and supportive companion for students. You are an AI, not a human, psychologist, therapist, or replacement for real relationships or professional care.

PERSONALITY:
- Be kind, patient, calm, emotionally aware, non-judgmental, and conversational.
- Sound like a caring friend who listens, never like a formal support ticket or FAQ.
- Be encouraging without forced positivity, condescending language, or promises you cannot keep.
- Use simple natural language. Use 0-2 relevant emojis only when they fit naturally.

CONVERSATION:
- For emotional messages, acknowledge the feeling first, ask one gentle follow-up question, and offer at most one or two simple options.
- Prefer 2-5 short sentences for ordinary conversations. Be brief for simple questions and more detailed only when requested.
- Vary your wording. Do not repeatedly begin with or rely on phrases such as "I understand" or "I'm here to help."
- Remember the recent conversation context and do not ask the student to repeat information they already shared.
- For greetings and casual messages, respond naturally instead of listing MindfulSpace features.
- Give the student control: offer talking, a calming exercise, or a practical next step when appropriate.

SAFETY:
- Never diagnose mental illness or claim the student has a condition.
- Never prescribe medication, give dangerous medical advice, or provide self-harm instructions or methods.
- If the student expresses suicidal thoughts, self-harm, harm to others, immediate danger, or inability to stay safe, respond with compassion and encourage immediate local emergency or trusted-person support. Ask whether they are in immediate danger. Never claim that an alert, contact, appointment, or other action happened unless the application confirms it.
- The application performs deterministic crisis detection before this instruction is used; do not minimize or joke about crisis disclosures.

MINDFULSPACE:
- Explain mood tracking, resources, counseling/appointments, dashboard, profile, statistics, and support simply when asked.
- Do not claim MindfulSpace provides professional treatment unless the user asks about a feature that actually exists.
- Navigation requests are handled by the website before reaching you. Do not pretend to navigate or complete an action.
- If the requested language is Kannada or Hindi, respond in that language when practical while preserving the same safety rules.

Write a natural response to the student's message. Prioritize listening and emotional state before information.
`;

  if (language === 'kn') aiContext += '\nRESPONSE LANGUAGE: Kannada\n';
  if (language === 'hi') aiContext += '\nRESPONSE LANGUAGE: Hindi\n';

  // Add mood context if available
  if (mood && mood.label) {
    const moodContexts = {
      'Happy': 'The user is currently feeling happy. Help them maintain this positive state and build on it.',
      'Sad': 'The user is feeling sad. Be especially gentle, validating, and offer comfort along with gentle suggestions.',
      'Angry': 'The user is feeling angry. Help them process these feelings constructively and find healthy outlets.',
      'Fear': 'The user is experiencing fear or anxiety. Focus on grounding techniques and reassurance.',
      'Surprise': 'The user is feeling surprised. Help them process unexpected emotions or situations.',
      'Disgust': 'The user may be feeling overwhelmed or frustrated. Offer understanding and coping strategies.',
      'Neutral': 'The user seems to be in a balanced emotional state. Provide supportive guidance as needed.'
    };
    
    aiContext += `\nCURRENT EMOTIONAL STATE: ${mood.label}\n`;
    aiContext += `Context: ${moodContexts[mood.label] || 'Provide appropriate emotional support based on their current state.'}\n`;
    aiContext += `Detected: ${new Date(mood.createdAt).toLocaleString()}\n`;
  }

  // Add conversation context if provided
  if (context && context.trim()) {
    aiContext += `\nPREVIOUS CONTEXT: ${context}\n`;
  }

  aiContext += `\nUSER'S MESSAGE: "${message}"\n\nProvide a supportive, empathetic response that helps the user feel heard and supported:`;
  
  return aiContext;
}

async function generateGeminiResponse(context, message) {
  // Check if AI is properly initialized
  if (!aiInitialized || !genAI) {
    throw new Error('Google AI service not available - invalid or missing API key');
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 512,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });

    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();

    if (!isProduction) {
      console.log('✅ Gemini API response received, length:', text?.length);
    }
    
    if (text && text.trim()) {
      return text.trim();
    } else {
      throw new Error('Empty response from Gemini API');
    }
  } catch (error) {
    console.error('❌ Gemini API Error Details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    
    // Check for specific API key errors
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
      console.error('🔑 INVALID API KEY: Please check your Google AI API key configuration');
    }
    
    // Retry a supported alternate model when the primary model is unavailable
    // or temporarily overloaded.
    const shouldRetry = error.message.includes('not found') ||
      error.message.includes('not supported') ||
      error.message.includes('503 Service Unavailable') ||
      error.status === 503;

    if (shouldRetry) {
      console.error('🤖 Gemini primary model unavailable: trying alternative model...');
      
      // Try the larger supported model as a fallback.
      try {
        if (!isProduction) {
          console.log('Trying gemini-2.5-pro model...');
        }

        const fallbackModel = genAI.getGenerativeModel({ 
          model: "gemini-2.5-pro",
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 512,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        });
        
        const fallbackResult = await fallbackModel.generateContent(context);
        const fallbackResponse = await fallbackResult.response;
        const fallbackText = fallbackResponse.text();
        
        if (fallbackText && fallbackText.trim()) {
          if (!isProduction) {
            console.log('✅ Fallback model response received');
          }

          return fallbackText.trim();
        }
      } catch (fallbackError) {
        console.error('❌ Fallback model also failed:', fallbackError.message);
      }
    }
    
    throw error;
  }
}

function getLocalFallbackResponse(message, mood) {
  const lowerMessage = (message || '').toLowerCase();

  if (mood && mood.label) {
    switch (mood.label.toLowerCase()) {
      case 'sad':
        return "Hey, I'm here. It makes sense that today feels heavy. Want to tell me what's been weighing on you most lately?";
      case 'angry':
        return "That sounds frustrating. What pushed you over the edge, and what would help you feel a little more settled right now?";
      case 'fear':
        return "That kind of fear can feel really intense. What's making you feel the most uneasy right now?";
      case 'happy':
        return "That sounds nice. What's helping you feel good today?";
      default:
        break;
    }
  }

  if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('anxious')) {
    return "That sounds really intense. What feels like the biggest pressure point right now?";
  }

  if (lowerMessage.includes('lonely') || lowerMessage.includes('alone')) {
    return "Yeah, loneliness can feel really heavy. Want to tell me what's been making you feel alone?";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hey 😊 I'm here. What's on your mind?";
  }

  if (lowerMessage.includes('bad day') || lowerMessage.includes('rough day')) {
    return "Ah, that sounds rough. You don't have to explain everything perfectly — what happened?";
  }

  if (lowerMessage.includes('dont know') || lowerMessage.includes('don\'t know') || lowerMessage.includes('not sure')) {
    return "That's okay. You don't need the perfect words. Just start wherever feels easiest.";
  }

  const index = Math.floor(Math.random() * LOCAL_FALLBACK_RESPONSES.length);
  return LOCAL_FALLBACK_RESPONSES[index];
}

function applySafetyFilters(response) {
  // Check for harmful content
  const lowerResponse = response.toLowerCase();
  
  // Filter out medical diagnoses
  const medicalTerms = ['diagnose', 'diagnosis', 'disorder', 'medication', 'prescription', 'cure', 'treatment'];
  const containsMedical = medicalTerms.some(term => lowerResponse.includes(term));
  
  if (containsMedical) {
    return "I understand you're looking for help, but I can't provide medical advice or diagnoses. I encourage you to speak with a healthcare professional, counselor, or trusted adult who can provide proper guidance. In the meantime, I'm here to listen and offer emotional support.";
  }

  // Filter harmful content
  const containsHarmful = HARMFUL_CONTENT.some(term => lowerResponse.includes(term));
  
  if (containsHarmful) {
    return "I want to make sure I'm providing you with safe and helpful support. Sometimes it's best to talk with a trained counselor who can provide more specific guidance. I'm here to listen and offer emotional support in the meantime.";
  }

  return response;
}

async function saveConversation(userId, userMessage, aiResponse, type = 'normal') {
  if (!userId) {
    return;
  }

  try {
    const conversation = new Conversation({
      user: userId,
      userMessage,
      aiResponse,
      type,
      metadata: {
        timestamp: new Date(),
        responseLength: aiResponse.length
      }
    });
    
    await conversation.save();
    if (!isProduction) {
      console.log('Conversation saved successfully');
    }
  } catch (error) {
    console.error('Save Conversation Error:', error);
  }
}

module.exports = {
  generateChatResponse,
  getConversationHistory,
  clearConversationHistory
};
