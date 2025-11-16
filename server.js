// ------------------- IMPORTS -------------------
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const http = require('http');          // 🔹 Add this
const { Server } = require('socket.io'); // 🔹 Add this
dotenv.config();

// ------------------- DATABASE CONNECTION -------------------
require('./config/db')();

// ------------------- ROUTES IMPORT -------------------
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const supplierRoutes = require('./routes/suppliers');
const purchaseRoutes = require('./routes/purchases');
const salesRoutes = require('./routes/sales');
const categoriesRoutes = require('./routes/categories');
const groupRoutes = require('./routes/groups');

const { attachUserToView } = require('./middleware/auth');

// ------------------- APP INITIALIZATION -------------------
const app = express();
const server = http.createServer(app); // 🔹 replace app.listen with server
const io = new Server(server);          // 🔹 Initialize Socket.io

// Make io accessible in routes
app.set('io', io);

// ------------------- VIEW ENGINE SETUP -------------------
let ejsMate;
try {
  ejsMate = require('ejs-mate');
  app.engine('ejs', ejsMate);
} catch (err) {
  console.error('❌ Required package "ejs-mate" is not installed.');
  console.error('👉 Run this command in your project root:');
  console.error('   npm install ejs-mate');
  process.exit(1);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ------------------- MIDDLEWARE -------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboardcat',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());

// Expose flash + current user globally in EJS views
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.currentUser = req.session.user || null;
  next();
});

// Wrap res.render safely
app.use((req, res, next) => {
  const _render = res.render;
  res.render = function (view, options, callback) {
    try {
      if (typeof options === 'function') {
        callback = options;
        options = undefined;
      }
      return _render.call(this, view, options, function (err, html) {
        if (err) return next(err);
        if (typeof callback === 'function') return callback(null, html);
        res.send(html);
      });
    } catch (err) {
      return next(err);
    }
  };
  next();
});

// Custom middleware to attach user (if logged in)
app.use(attachUserToView);

// ------------------- ROUTES -------------------

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Core routes
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/sales', salesRoutes);
app.use('/categories', categoriesRoutes);
app.use('/users/groups', groupRoutes); // ✅ Correct path

// Simple home redirect
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ------------------- WEBSOCKET EVENTS -------------------
io.on('connection', (socket) => {
  console.log('🔹 New WebSocket connection:', socket.id);

  // Example: listen for test message
  socket.on('test', (msg) => {
    console.log('Test message from client:', msg);
  });
});

// ------------------- ERROR HANDLING -------------------

// Server-side error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash('error', err.message || 'Something went wrong!');
  res.status(500).redirect('back');
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).render('404', { messages: req.flash() });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`)); 