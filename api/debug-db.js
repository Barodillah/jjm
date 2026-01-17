import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get('/', async (req, res) => {
    let connection;
    try {
        console.log('[DebugDB] Starting standalone connection test...');
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD, // Not logging this
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306'),
            connectTimeout: 5000 // 5s timeout
        };

        console.log('[DebugDB] Config:', { ...config, password: '***' });

        // Create connection (not pool)
        connection = await mysql.createConnection(config);
        console.log('[DebugDB] Connection established!');

        const [rows] = await connection.execute('SELECT 1 as val');
        console.log('[DebugDB] Query result:', rows);

        res.json({
            success: true,
            message: 'Standalone connection successful',
            result: rows[0]
        });

    } catch (error) {
        console.error('[DebugDB] Connection failed:', error);
        res.status(500).json({
            success: false,
            message: 'Connection failed',
            error: {
                message: error.message,
                code: error.code,
                errno: error.errno,
                syscall: error.syscall,
                hostname: error.hostname
            }
        });
    } finally {
        if (connection) {
            await connection.end();
            console.log('[DebugDB] Connection closed');
        }
    }
});

export default router;
