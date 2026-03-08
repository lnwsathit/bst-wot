const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool;

try {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        port: process.env.DB_PORT,
        connectTimeout: 5000, // 5 second timeout
    });

    // Test the connection
    pool.getConnection().then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    }).catch(err => {
        console.error('❌ Database connection failed:', err.message);
        console.log('⚠️  Server will run in limited mode without database functionality');
    });

} catch (err) {
    console.error('❌ Database configuration error:', err.message);
    console.log('⚠️  Server will run in limited mode without database functionality');
    pool = null;
}

module.exports = pool;
