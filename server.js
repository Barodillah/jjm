
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authHandler from './api/auth.js';
import transactionsHandler from './api/transactions.js';
import categoriesHandler from './api/categories.js';
import chatHandler from './api/chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request Adapter for Vercel functions
// Vercel functions expect (req, res), which Express provides, 
// but we might need to mock some Vercel-specific properties if used.
// For now, standard Express req/res should be sufficient for the current handlers.

// Routes matches api/*.js
app.use('/api/auth', authHandler);
app.use('/api/transactions', transactionsHandler);
app.use('/api/categories', categoriesHandler);
app.use('/api/chat', chatHandler);

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

export default app;

import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
