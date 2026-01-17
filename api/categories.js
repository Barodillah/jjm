import getPool from './db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const pool = getPool();
    const { id } = req.query;

    // GET - Get all categories
    if (req.method === 'GET') {
        try {
            const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
            return res.status(200).json(rows);
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // POST - Create category
    if (req.method === 'POST') {
        try {
            const { name, color, type } = req.body;
            const [result] = await pool.execute(
                'INSERT INTO categories (name, color, type) VALUES (?, ?, ?)',
                [name, color, type || 'expense']
            );
            return res.status(201).json({ id: result.insertId, name, color, type: type || 'expense' });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // PUT - Update category
    if (req.method === 'PUT') {
        try {
            const { name, color, type } = req.body;
            await pool.execute(
                'UPDATE categories SET name = ?, color = ?, type = ? WHERE id = ?',
                [name, color, type, id]
            );
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // DELETE - Delete category
    if (req.method === 'DELETE') {
        try {
            await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
