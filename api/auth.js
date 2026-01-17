import express from 'express';
import pool from './db.js';

const router = express.Router();

let isSettingsInitialized = false;

// initSettingsTable removed from top-level execution

// Helper to verify PIN
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
