import express from 'express';
import getPool from './db.js';

const router = express.Router();

// GET / - Get all transactions
router.get('/', async (req, res) => {
    try {
        const pool = getPool();
        const [rows] = await pool.execute('SELECT * FROM transactions ORDER BY date DESC, id DESC');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Transaction error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// POST / - Create transaction
router.post('/', async (req, res) => {
    try {
        const pool = getPool();
        const { title, amount, category, type, date } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO transactions (title, amount, category, type, date) VALUES (?, ?, ?, ?, ?)',
            [title, amount, category, type, date]
        );
        return res.status(201).json({ id: result.insertId, title, amount, category, type, date });
    } catch (error) {
        console.error('Transaction error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// PUT / - Update transaction
router.put('/', async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.query;
        const { title, amount, category, type, date } = req.body;
        await pool.execute(
            'UPDATE transactions SET title = ?, amount = ?, category = ?, type = ?, date = ? WHERE id = ?',
            [title, amount, category, type, date, id]
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Transaction error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// DELETE / - Delete transaction
router.delete('/', async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.query;
        await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Transaction error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

export default router;
