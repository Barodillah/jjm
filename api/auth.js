import express from 'express';
import pool from './db.js';

const router = express.Router();

let isSettingsInitialized = false;

async function ensureSettingsTable() {
    if (isSettingsInitialized) return;

    // Use a fresh connection to ensure we don't block main pool if possible, or just use pool
    const conn = await pool.getConnection();
    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                key_name VARCHAR(50) UNIQUE NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Check and insert default PIN
        const [userPin] = await conn.execute("SELECT COUNT(*) as cnt FROM settings WHERE key_name = 'user_pin'");
        if (userPin[0].cnt === 0) {
            await conn.execute("INSERT INTO settings (key_name, value) VALUES ('user_pin', '4321')");
        }

        // Check and insert backup PIN
        const [backupPin] = await conn.execute("SELECT COUNT(*) as cnt FROM settings WHERE key_name = 'backup_pin'");
        if (backupPin[0].cnt === 0) {
            await conn.execute("INSERT INTO settings (key_name, value) VALUES ('backup_pin', '2098')");
        }

        isSettingsInitialized = true;
    } catch (error) {
        console.error("Failed to init settings table:", error);
        // Don't throw here to allow retry next time, but logic downstream might fail
        throw error;
    } finally {
        conn.release();
    }
}

// initSettingsTable removed from top-level execution

async function verifyPin(pin) {
    if (!pin) return false;
    // ensureSettingsTable is called in the route handler, so table should exist
    const [rows] = await pool.execute(
        "SELECT value FROM settings WHERE key_name IN ('user_pin', 'backup_pin')"
    );
    const validPins = rows.map(r => r.value);
    return validPins.includes(pin);
}

// POST / - Login
router.post('/', async (req, res) => {
    try {
        await ensureSettingsTable(); // Ensure table exists
        const { pin } = req.body;

        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({ success: false, error: 'PIN harus 4 digit angka' });
        }

        const isValid = await verifyPin(pin);
        if (isValid) {
            return res.status(200).json({ success: true, message: 'Login berhasil' });
        } else {
            return res.status(401).json({ success: false, error: 'PIN salah' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// PUT / - Change PIN
router.put('/', async (req, res) => {
    try {
        const { currentPin, newPin } = req.body;

        if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            return res.status(400).json({ success: false, error: 'PIN baru harus 4 digit angka' });
        }

        const isValid = await verifyPin(currentPin);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'PIN saat ini salah' });
        }

        await pool.execute("UPDATE settings SET value = ? WHERE key_name = 'user_pin'", [newPin]);
        return res.status(200).json({ success: true, message: 'PIN berhasil diubah' });

    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

export default router;
