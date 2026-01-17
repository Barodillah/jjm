import getPool from './db.js';

// Ensure settings table exists
async function ensureSettingsTable(pool) {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                key_name VARCHAR(50) UNIQUE NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await pool.execute(`INSERT IGNORE INTO settings (key_name, value) VALUES ('user_pin', '1234')`);
        await pool.execute(`INSERT IGNORE INTO settings (key_name, value) VALUES ('backup_pin', '0000')`);
    } catch (error) {
        console.error('[Auth] Failed to init settings table:', error);
    }
}

// Verify PIN against database
async function verifyPin(pin, pool) {
    if (!pin) return false;
    try {
        await ensureSettingsTable(pool);
        const [rows] = await pool.execute(
            "SELECT value FROM settings WHERE key_name IN ('user_pin', 'backup_pin')"
        );
        const validPins = rows.map(r => r.value);
        return validPins.includes(pin);
    } catch (error) {
        console.error("[Auth] verifyPin DB Error:", error);
        throw error;
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const pool = getPool();

    // GET - Test endpoint
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'auth working',
            time: new Date().toISOString()
        });
    }

    // POST - Login
    if (req.method === 'POST') {
        try {
            const { pin } = req.body;

            if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                return res.status(400).json({ success: false, error: 'PIN harus 4 digit angka' });
            }

            const isValid = await verifyPin(pin, pool);

            if (isValid) {
                return res.status(200).json({ success: true, message: 'Login berhasil' });
            } else {
                return res.status(401).json({ success: false, error: 'PIN salah' });
            }
        } catch (error) {
            console.error('[Auth] Login Error:', error);
            return res.status(500).json({
                success: false,
                error: 'Server error: ' + error.message
            });
        }
    }

    // PUT - Change PIN
    if (req.method === 'PUT') {
        try {
            const { currentPin, newPin } = req.body;

            if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
                return res.status(400).json({ success: false, error: 'PIN baru harus 4 digit angka' });
            }

            const isValid = await verifyPin(currentPin, pool);
            if (!isValid) {
                return res.status(401).json({ success: false, error: 'PIN saat ini salah' });
            }

            await pool.execute("UPDATE settings SET value = ? WHERE key_name = 'user_pin'", [newPin]);
            return res.status(200).json({ success: true, message: 'PIN berhasil diubah' });

        } catch (error) {
            console.error('Auth error:', error);
            return res.status(500).json({ error: 'Server error: ' + error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
