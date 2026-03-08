const db = require('./config/database');

async function checkUsers() {
    try {
        const [rows] = await db.execute('SELECT id, username, role, status FROM users');
        console.log('Users in database:');
        console.log(rows);

        if (rows.length === 0) {
            console.log('No users found. Creating admin user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await db.execute(
                'INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
                ['admin', hashedPassword, 'Administrator', 'Admin', 'Active']
            );

            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Database error:', error);
    } finally {
        process.exit();
    }
}

checkUsers();