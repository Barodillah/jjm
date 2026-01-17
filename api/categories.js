import express from 'express';
import pool from './db.js';

const router = express.Router();

// GET / - Get all categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Category error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// POST / - Create category
router.post('/', async (req, res) => {
    try {
        const { name, color, type } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO categories (name, color, type) VALUES (?, ?, ?)',
            [name, color, type || 'expense']
        );
        return res.status(201).json({ id: result.insertId, name, color, type: type || 'expense' });
    } catch (error) {
        console.error('Category error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// PUT / - Update category
router.put('/', async (req, res) => {
    try {
        const { id } = req.query;
        const { name, color, type } = req.body;
        await pool.execute(
            'UPDATE categories SET name = ?, color = ?, type = ? WHERE id = ?',
            [name, color, type, id]
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Category error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// DELETE / - Delete category
router.delete('/', async (req, res) => {
    try {
        const { id } = req.query;
        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Category error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

export default router;
