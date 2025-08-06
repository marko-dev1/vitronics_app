require('dotenv').config(); // Load environment variables first
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cookieParser = require('cookie-parser');

// DB config
const db = require('./config/db');


// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// Constants
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret';

// CORS config 
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your actual frontend origin
  credentials: true
}));

// Middleware order is important
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session setup (only once)
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './var/db',
    concurrentDB: true
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Serve static files
app.use(express.static('public'));

// Make db accessible to routes
app.set('db', db);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);

// Route guards
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    next();z
  } else {
    res.status(401).json({ error: 'Unauthorized - Please login' });
  }
}

// HTML routes (protected and public)
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/product-upload.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-upload.html'));
});

app.get('/', (req, res) => {
  res.send('Welcome to VitronicsHub API!');
});

// Session check route
app.get('/api/auth/session', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      authenticated: false,
      message: 'Not logged in'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.promise.get('SELECT 1 + 1 AS result')
    .then(() => res.json({
      status: 'healthy',
      database: 'connected'
    }))
    .catch(err => res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    }));
});

// Login route (sample logic)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = { id: user.id, email: user.email };

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Logout route
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
