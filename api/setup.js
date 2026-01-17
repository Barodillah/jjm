import express from 'express';
import pool from './db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();

        // Create settings table
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

        res.json({ success: true, message: 'Database Setup Completed Successfully' });
    } catch (error) {
        console.error("Setup failed:", error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (conn) conn.release();
    }
});

export default router;
