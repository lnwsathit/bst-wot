const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
    if (!req.session.role || req.session.role !== 'Admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
}

// Get active customer options (all authenticated users)
router.get('/options', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name FROM customers WHERE status = ? ORDER BY name ASC',
            ['Active']
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching customer options:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Get all customers
router.get('/list', requireAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM customers ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Create customer
router.post('/create', requireAdmin, async (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    try {
        const [result] = await db.execute(
            'INSERT INTO customers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [name, contact_person || null, email || null, phone || null, address || null]
        );
        res.json({ success: true, message: 'Customer created successfully', id: result.insertId });
    } catch (err) {
        console.error('Error creating customer:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, error: 'Customer name already exists' });
        } else {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }
});

// Update customer
router.post('/update/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, contact_person, email, phone, address, status } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'Customer name is required' });
    }

    try {
        await db.execute(
            'UPDATE customers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?',
            [name, contact_person || null, email || null, phone || null, address || null, status || 'Active', id]
        );
        res.json({ success: true, message: 'Customer updated successfully' });
    } catch (err) {
        console.error('Error updating customer:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ success: false, error: 'Customer name already exists' });
        } else {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }
});

// Delete customer
router.delete('/delete/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Check if customer is used in work orders
        const [workOrders] = await db.execute('SELECT COUNT(*) as count FROM work_orders WHERE customer_name = (SELECT name FROM customers WHERE id = ?)', [id]);
        if (workOrders[0].count > 0) {
            return res.status(400).json({ success: false, error: 'Cannot delete customer with existing work orders' });
        }

        await db.execute('DELETE FROM customers WHERE id = ?', [id]);
        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

// Get customer by ID
router.get('/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching customer:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

module.exports = router;