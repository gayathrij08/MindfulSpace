const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const moodRoutes = require('./routes/moodRoutes');
const profileRoutes = require('./routes/profileRoutes');
const settingRoutes = require('./routes/settingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mentalHealthRoutes = require('./routes/mentalHealthRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { generateChatResponse } = require('./controllers/aiController');
const trustedContactRoutes = require('./routes/trustedContactRoutes');
const { optionalProtect } = require('./middleware/authMiddleware');

// Initialize express app
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Azure/Linux reverse proxy support
app.set('trust proxy', 1);

// Validate required environment variables in production
if (isProduction) {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter((name) => !process.env[name]);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

if (!isProduction) {
  console.log('Environment variables loaded');
  console.log('PORT:', process.env.PORT || 'Not set');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('Gemini API key exists:', !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY));
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use(express.json({ limit: '2mb' }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Configure CORS to allow requests from multiple frontend origins
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS - Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Use the CORS middleware with options
app.use(cors(corsOptions));

// MongoDB connection with improved error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('Server will continue without database-backed features until MongoDB is reachable.');
    return null;
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/user/profile', profileRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/ai', aiRoutes);
app.post('/api/chat', optionalProtect, generateChatResponse);
app.use('/api/trusted-contact', trustedContactRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/appointments', appointmentRoutes);

// Config endpoint to serve environment URLs to frontend
app.get('/api/config', (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      backendApiUrl: process.env.BACKEND_API_URL || '',
      mlServiceUrl: process.env.ML_SERVICE_URL || ''
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    database: dbStatus,
    aiEnabled: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const errorMessage = isProduction ? err.message : (err.stack || err.message);
  console.error('❌ Error:', errorMessage);

  res.status(500).json({ 
    status: 'error', 
    message: err.message || 'Something went wrong on the server'
  });
});

// Start server
const startServer = () => {
  connectDB();
  const PORT = process.env.PORT || 5001;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing MindfulSpace backend before starting another one.`);
      return;
    }
    console.error('Backend server error:', error.message);
  });
};

startServer();
