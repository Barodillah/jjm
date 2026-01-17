
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authHandler from './api/auth.js';
import transactionsHandler from './api/transactions.js';
import categoriesHandler from './api/categories.js';
import chatHandler from './api/chat.js';
import setupHandler from './api/setup.js';
import debugDbHandler from './api/debug-db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Debug Handlers
console.log('[Server] Checking Handlers:');
console.log('Auth:', typeof authHandler);
console.log('Transactions:', typeof transactionsHandler);
console.log('Categories:', typeof categoriesHandler);
console.log('Chat:', typeof chatHandler);
console.log('Setup:', typeof setupHandler);
console.log('DebugDB:', typeof debugDbHandler);

// Request Adapter for Vercel functions
// Vercel functions expect (req, res), which Express provides, 
// but we might need to mock some Vercel-specific properties if used.
// For now, standard Express req/res should be sufficient for the current handlers.

// Routes matches api/*.js
app.use('/api/auth', authHandler);
app.use('/api/transactions', transactionsHandler);
app.use('/api/categories', categoriesHandler);
app.use('/api/chat', chatHandler);
app.use('/api/setup', setupHandler);
app.use('/api/debug-db', debugDbHandler);

// Simple Ping (No DB) - Show Env Status
app.get('/api/ping', (req, res) => {
  res.json({
    pong: true,
    time: new Date().toISOString(),
    env: {
      DB_HOST: !!process.env.DB_HOST ? 'Set' : 'Missing',
      DB_USER: !!process.env.DB_USER ? 'Set' : 'Missing',
      DB_PASS: !!process.env.DB_PASSWORD ? 'Set' : 'Missing',
      DB_NAME: !!process.env.DB_NAME ? 'Set' : 'Missing'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    type: 'GlobalErrorHandler'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connection = await import('./api/db.js').then(m => m.default);
    await connection.execute('SELECT 1');
    res.json({ status: 'ok', environment: 'vercel-express', db: 'connected' });
  } catch (error) {
    console.error('Health check db error:', error);
    res.status(500).json({ status: 'error', environment: 'vercel-express', db: 'disconnected', error: error.message });
  }
});

console.log("[Server] App initialized");

export default app;

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
