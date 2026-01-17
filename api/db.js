import mysql from 'mysql2/promise';

let pool = null;

export default function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 5,
            connectTimeout: 10000,
            ssl: { rejectUnauthorized: false }
        });
    }
    return pool;
}
