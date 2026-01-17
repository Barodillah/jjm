import express from 'express';
import pool from './db.js';

const router = express.Router();

// Ensure settings table exists
async function ensureSettingsTable() {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                key_name VARCHAR(50) UNIQUE NOT NULL,
                value TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Insert default PIN if not exists
        await pool.execute(`
            INSERT IGNORE INTO settings (key_name, value) VALUES ('user_pin', '1234')
        `);
        await pool.execute(`
            INSERT IGNORE INTO settings (key_name, value) VALUES ('backup_pin', '0000')
        `);
        console.log('[Auth] Settings table ready');
    } catch (error) {
        console.error('[Auth] Failed to init settings table:', error);
    }
}

// Helper to verify PIN
async function verifyPin(pin) {
    if (!pin) return false;
    try {
        console.log("[Auth] Connecting to DB pool...");
        // Ensure table exists first
        await ensureSettingsTable();
        // Test query
        const [rows] = await pool.execute(
            "SELECT value FROM settings WHERE key_name IN ('user_pin', 'backup_pin')"
        );
        console.log(`[Auth] Query success. Found ${rows.length} rows.`);
        const validPins = rows.map(r => r.value);
        return validPins.includes(pin);
    } catch (error) {
        console.error("[Auth] verifyPin DB Error:", error);
        throw error;
    }
}

// POST / - Login
router.post('/', async (req, res) => {
    console.log("[Auth] Login request received", req.body);
    try {
        const { pin } = req.body;

        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            console.log("[Auth] Invalid PIN format");
            return res.status(400).json({ success: false, error: 'PIN harus 4 digit angka' });
        }

        console.log("[Auth] Verifying PIN against DB...");
        const isValid = await verifyPin(pin);
        console.log("[Auth] PIN Verification Result:", isValid);

        if (isValid) {
            return res.status(200).json({ success: true, message: 'Login berhasil' });
        } else {
            return res.status(401).json({ success: false, error: 'PIN salah' });
        }
    } catch (error) {
        console.error('[Auth] Login Critical Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error: ' + error.message,
            code: error.code, // DB Error Code (e.g. PROTOCOL_CONNECTION_LOST)
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
