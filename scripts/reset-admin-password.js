// Reset admin password to 'admin123'
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function resetAdminPassword() {
    let connection;
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'workorder_tracking'
        });

        console.log('✅ Connected to database');

        // Generate new password hash
        const newPassword = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        console.log('🔐 Generated new password hash for:', newPassword);

        // Update admin user
        const [result] = await connection.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            [hash, 'admin']
        );

        if (result.affectedRows > 0) {
            console.log('✅ Admin password reset successfully!');
            console.log('\n📋 Login credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('\n🌐 Access: http://192.168.1.139/login');
        } else {
            console.log('❌ No admin user found to update');
            console.log('💡 Creating new admin user...');
            
            await connection.execute(
                'INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
                ['admin', hash, 'Administrator', 'Admin', 'Active']
            );
            
            console.log('✅ Admin user created successfully!');
            console.log('\n📋 Login credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

resetAdminPassword();
