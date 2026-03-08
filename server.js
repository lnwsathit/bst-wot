const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true automatically in production
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer Configuration for File Upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
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

// Make upload available globally
app.locals.upload = upload;

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Routes
console.log('Loading routes...');
const authRoutes = require('./routes/auth');
console.log('Auth routes loaded');
const workOrderRoutes = require('./routes/workorder');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');

// API Routes
app.use('/api/auth', authRoutes);

// Public routes (no authentication required) - must come BEFORE authenticated routes
app.get('/api/workorder/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const db = require('./config/database');
        const [rows] = await db.execute(
            'SELECT id, quotation_no, customer_name, status, updated_at FROM work_orders WHERE quotation_no LIKE ? OR customer_name LIKE ? ORDER BY created_at DESC',
            [`%${query}%`, `%${query}%`]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error searching work orders:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Public details route (no authentication required) - handle numeric IDs only
app.get('/api/workorder/:id(\\d+)$', async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('./config/database');
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

// Authenticated routes (come after public routes)
app.use('/api/workorder', isAuthenticated, workOrderRoutes);
app.use('/api/users', isAuthenticated, userRoutes);
app.use('/api/customers', isAuthenticated, customerRoutes);

// Public Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: { id: req.session.userId, username: req.session.username, role: req.session.role } });
});

app.get('/workorder', isAuthenticated, (req, res) => {
    res.render('workorder', { user: { id: req.session.userId, username: req.session.username, role: req.session.role } });
});

app.get('/users', isAuthenticated, (req, res) => {
    if (req.session.role !== 'Admin') {
        return res.status(403).render('error', { message: 'Access denied' });
    }
    res.render('users', { user: { id: req.session.userId, username: req.session.username, role: req.session.role } });
});

app.get('/customers', isAuthenticated, (req, res) => {
    if (req.session.role !== 'Admin') {
        return res.status(403).render('error', { message: 'Access denied' });
    }
    res.render('customers', { user: { id: req.session.userId, username: req.session.username, role: req.session.role } });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Public search route (no authentication required)
app.get('/api/workorder/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const db = require('./config/database');
        const [rows] = await db.execute(
            'SELECT id, quotation_no, customer_name, status, updated_at FROM work_orders WHERE quotation_no LIKE ? OR customer_name LIKE ? ORDER BY created_at DESC',
            [`%${query}%`, `%${query}%`]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error searching work orders:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
