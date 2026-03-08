const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const fs = require('fs');

// Multer Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Get all work orders
router.get('/list', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM work_orders ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching work orders:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get work order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM work_orders WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('Error fetching work order:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create work order
router.post('/create', upload.fields([
    { name: 'quotation_file', maxCount: 1 },
    { name: 'po_customer_file', maxCount: 1 },
    { name: 'po_supplier_file', maxCount: 1 },
    { name: 'invoice_file', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            customer_name,
            quotation_no,
            quotation_detail,
            po_customer_no,
            po_customer_detail,
            po_supplier_no,
            po_supplier_detail,
            invoice_no,
            invoice_detail,
            completion_date,
            status
        } = req.body;

        // Validate customer exists
        if (!customer_name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        const [customerCheck] = await db.execute('SELECT id FROM customers WHERE name = ? AND status = ?', [customer_name, 'Active']);
        if (customerCheck.length === 0) {
            return res.status(400).json({ error: 'Invalid customer. Please select from the customer list.' });
        }

        const uploadedFiles = req.files || {};
        const files = {
            quotation_file: uploadedFiles.quotation_file ? uploadedFiles.quotation_file[0].filename : null,
            po_customer_file: uploadedFiles.po_customer_file ? uploadedFiles.po_customer_file[0].filename : null,
            po_supplier_file: uploadedFiles.po_supplier_file ? uploadedFiles.po_supplier_file[0].filename : null,
            invoice_file: uploadedFiles.invoice_file ? uploadedFiles.invoice_file[0].filename : null
        };

        const query = `
      INSERT INTO work_orders (
        customer_name, quotation_no, quotation_file, quotation_detail,
        po_customer_no, po_customer_file, po_customer_detail,
        po_supplier_no, po_supplier_file, po_supplier_detail,
        invoice_no, invoice_file, invoice_detail,
                completion_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            customer_name,
            quotation_no,
            files.quotation_file,
            quotation_detail || null,
            po_customer_no || null,
            files.po_customer_file,
            po_customer_detail || null,
            po_supplier_no || null,
            files.po_supplier_file,
            po_supplier_detail || null,
            invoice_no || null,
            files.invoice_file,
            invoice_detail || null,
            completion_date || null,
            status
        ];

        await db.execute(query, values);

        res.json({ success: true, message: 'Work order created successfully' });
    } catch (err) {
        console.error('Error creating work order:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update work order
router.post('/update/:id', upload.fields([
    { name: 'quotation_file', maxCount: 1 },
    { name: 'po_customer_file', maxCount: 1 },
    { name: 'po_supplier_file', maxCount: 1 },
    { name: 'invoice_file', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customer_name,
            quotation_no,
            quotation_detail,
            po_customer_no,
            po_customer_detail,
            po_supplier_no,
            po_supplier_detail,
            invoice_no,
            invoice_detail,
            completion_date,
            status
        } = req.body;

        // Validate customer exists
        if (!customer_name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }

        const [customerCheck] = await db.execute('SELECT id FROM customers WHERE name = ? AND status = ?', [customer_name, 'Active']);
        if (customerCheck.length === 0) {
            return res.status(400).json({ error: 'Invalid customer. Please select from the customer list.' });
        }

        // Get current work order to keep existing files
        const [currentOrder] = await db.execute('SELECT * FROM work_orders WHERE id = ?', [id]);

        if (currentOrder.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        const current = currentOrder[0];

        const uploadedFiles = req.files || {};
        const files = {
            quotation_file: uploadedFiles.quotation_file ? uploadedFiles.quotation_file[0].filename : current.quotation_file,
            po_customer_file: uploadedFiles.po_customer_file ? uploadedFiles.po_customer_file[0].filename : current.po_customer_file,
            po_supplier_file: uploadedFiles.po_supplier_file ? uploadedFiles.po_supplier_file[0].filename : current.po_supplier_file,
            invoice_file: uploadedFiles.invoice_file ? uploadedFiles.invoice_file[0].filename : current.invoice_file
        };

        const query = `
      UPDATE work_orders SET
        customer_name = ?,
        quotation_no = ?,
        quotation_file = ?,
        quotation_detail = ?,
        quotation_timestamp = NOW(),
        po_customer_no = ?,
        po_customer_file = ?,
        po_customer_detail = ?,
        po_customer_timestamp = NOW(),
        po_supplier_no = ?,
        po_supplier_file = ?,
        po_supplier_detail = ?,
        po_supplier_timestamp = NOW(),
        invoice_no = ?,
        invoice_file = ?,
        invoice_detail = ?,
        invoice_timestamp = NOW(),
                completion_date = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

        const values = [
            customer_name,
            quotation_no,
            files.quotation_file,
            quotation_detail || null,
            po_customer_no || null,
            files.po_customer_file,
            po_customer_detail || null,
            po_supplier_no || null,
            files.po_supplier_file,
            po_supplier_detail || null,
            invoice_no || null,
            files.invoice_file,
            invoice_detail || null,
            completion_date || null,
            status,
            id
        ];

        await db.execute(query, values);

        res.json({ success: true, message: 'Work order updated successfully' });
    } catch (err) {
        console.error('Error updating work order:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete work order (Admin only)
router.delete('/delete/:id', async (req, res) => {
    try {
        if (req.session.role !== 'Admin') {
            return res.status(403).json({ error: 'Only admins can delete work orders' });
        }

        const { id } = req.params;

        // Get work order to delete files
        const [rows] = await db.execute('SELECT * FROM work_orders WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Work order not found' });
        }

        const workOrder = rows[0];

        // Delete files
        const filesToDelete = [
            workOrder.quotation_file,
            workOrder.po_customer_file,
            workOrder.po_supplier_file,
            workOrder.invoice_file
        ];

        filesToDelete.forEach(file => {
            if (file) {
                const filePath = path.join(__dirname, '../uploads', file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });

        await db.execute('DELETE FROM work_orders WHERE id = ?', [id]);

        res.json({ success: true, message: 'Work order deleted successfully' });
    } catch (err) {
        console.error('Error deleting work order:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Search work orders
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const [rows] = await db.execute(
            'SELECT * FROM work_orders WHERE quotation_no LIKE ? OR customer_name LIKE ? ORDER BY created_at DESC',
            [`%${query}%`, `%${query}%`]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error searching work orders:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
