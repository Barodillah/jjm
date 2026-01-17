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

    // GET - Get all transactions
    if (req.method === 'GET') {
        try {
            const [rows] = await pool.execute('SELECT * FROM transactions ORDER BY date DESC, id DESC');
            return res.status(200).json(rows);
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // POST - Create transaction
    if (req.method === 'POST') {
        try {
            const { title, amount, category, type, date } = req.body;
            const [result] = await pool.execute(
                'INSERT INTO transactions (title, amount, category, type, date) VALUES (?, ?, ?, ?, ?)',
                [title, amount, category, type, date]
            );
            return res.status(201).json({ id: result.insertId, title, amount, category, type, date });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // PUT - Update transaction
    if (req.method === 'PUT') {
        try {
            const { title, amount, category, type, date } = req.body;
            await pool.execute(
                'UPDATE transactions SET title = ?, amount = ?, category = ?, type = ?, date = ? WHERE id = ?',
                [title, amount, category, type, date, id]
            );
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    // DELETE - Delete transaction
    if (req.method === 'DELETE') {
        try {
            await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
