const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.role !== 'Admin') {
        return res.status(403).json({ error: 'Only admins can manage users' });
    }
    next();
};

// Get all users
router.get('/list', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, full_name, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create user
router.post('/create', isAdmin, async (req, res) => {
    try {
        const { username, password, full_name, role, status } = req.body;

        if (!username || !password || !full_name) {
            return res.status(400).json({ error: 'Username, password, and full name are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if username already exists
        const [existingUser] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        await db.execute(
            'INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, full_name, role, status]
        );

        res.json({ success: true, message: 'User created successfully' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user
router.post('/update/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, full_name, role, status, password } = req.body;

        // Check if username already exists (except for current user)
        const [existingUser] = await db.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        let query = 'UPDATE users SET username = ?, full_name = ?, role = ?, status = ?';
        let values = [username, full_name, role, status];

        // If password is provided, hash and update it
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            values.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        values.push(id);

        await db.execute(query, values);

        res.json({ success: true, message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user
router.delete('/delete/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting own account
        if (req.session.userId === parseInt(id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user by ID
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT id, username, full_name, role, status FROM users WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
