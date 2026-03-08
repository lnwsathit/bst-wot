// Script to generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL Command to update admin password:');
    console.log(`UPDATE users SET password = '${hash}' WHERE username = 'admin';`);
}

generateHash();
