const path = require('path');
// Load environment variables from server directory, or workspace root as fallback
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const normalizedClientUrl = rawClientUrl.trim().replace(/\/+$/, '');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, health monitors)
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // Allow configured frontend origin or local development origins
    if (
      cleanOrigin === normalizedClientUrl ||
      cleanOrigin === 'http://localhost:5173' ||
      cleanOrigin === 'http://localhost:3000' ||
      cleanOrigin === 'http://127.0.0.1:5173'
    ) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }

    // In development mode, allow other origins for testing
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parser with size limit
app.use(express.json({ limit: '10kb' }));

// Health check endpoint distinguishing process liveness from database readiness
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const healthData = {
    status: isDbConnected ? 'ok' : 'degraded',
    service: 'mindspace-backend',
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  };

  if (!isDbConnected) {
    return res.status(503).json(healthData);
  }

  res.status(200).json(healthData);
});

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/moods', require('./routes/moods'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/insights', require('./routes/insights'));

// Centralized error handler
app.use(errorHandler);

// Port and Host configuration
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, HOST, () => {
      console.log(`[Server] MindSpace backend listening on http://${HOST}:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health check: http://${HOST}:${PORT}/api/health`);
    });
    return server;
  } catch (error) {
    console.error('[Server] Fatal startup failure: Server cannot start without database connection.');
    process.exit(1);
  }
};

// Export app for test suites
module.exports = app;

if (require.main === module) {
  startServer();
}
