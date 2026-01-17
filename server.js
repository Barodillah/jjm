
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: 'local-express' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
