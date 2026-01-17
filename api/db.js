import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('[DB] Initializing Pool with:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    db: process.env.DB_NAME,
    port: process.env.DB_PORT
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 5000, // Fail within 5s
    // Enable SSL for Vercel/Cloud DBs (Production)
    ...((process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true') && {
        ssl: {
            rejectUnauthorized: false
        }
    })
});

export default pool;
