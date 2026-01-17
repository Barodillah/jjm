import express from 'express';
import cors from 'cors';
import authHandler from './api/auth.js';
import transactionsHandler from './api/transactions.js';
import categoriesHandler from './api/categories.js';
import chatHandler from './api/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Static routes
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

app.get('/api/health', async (req, res) => {
  try {
    const getPool = (await import('./api/db.js')).default;
    const pool = getPool();
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: error.message });
  }
});

// API Routes
app.use('/api/auth', authHandler);
app.use('/api/transactions', transactionsHandler);
app.use('/api/categories', categoriesHandler);
app.use('/api/chat', chatHandler);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

export default app;

// Local development server
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
