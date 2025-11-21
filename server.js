// ------------------- IMPORTS -------------------
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

dotenv.config();

// ------------------- DATABASE CONNECTION -------------------
require('./config/db')();

// ------------------- ROUTES IMPORT -------------------
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes'); // ✔ Product Route Activated
const salesRoutes = require('./routes/sales');
const categoriesRoutes = require('./routes/categories');
const userRoutes = require('./routes/users'); // Users Route
const groupRoutes = require('./routes/groups');
const { attachUserToView } = require('./middleware/auth');

// ------------------- APP INITIALIZATION -------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Make Socket.IO available globally
app.set('io', io);

// ------------------- REDIS CLIENT -------------------
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch((err) => console.error('❌ Redis connection error:', err));
app.set('redisClient', redisClient);

// ------------------- VIEW ENGINE SETUP -------------------
let ejsMate;
try {
  ejsMate = require('ejs-mate');
  app.engine('ejs', ejsMate);
} catch (err) {
  console.error('❌ Missing "ejs-mate". Install with: npm install ejs-mate');
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

// Flash messages + logged-in user global access
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.currentUser = req.session.user || null;
  next();
});

// Prevent crash on EJS error
app.use((req, res, next) => {
  const originalRender = res.render;
  res.render = function (view, options, callback) {
    try {
      return originalRender.call(this, view, options, callback);
    } catch (err) {
      return next(err);
    }
  };
  next();
});

// Attach user to EJS views
app.use(attachUserToView);

// ------------------- ROUTES -------------------
app.get('/login', (req, res) => res.render('login'));

app.use('/', authRoutes);
app.use('/products', productRoutes);           // ⭐ Product Routes
app.use('/sales', salesRoutes);                // ⭐ Sales Routes
app.use('/categories', categoriesRoutes);     // ⭐ Categories Routes
app.use('/users', userRoutes);                 // ⭐ Users Routes
app.use('/users/groups', groupRoutes);

app.get('/', (req, res) => res.redirect('/login'));

// ------------------- HEALTH CHECK -------------------
app.get('/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

// ------------------- WEBSOCKET EVENTS -------------------
io.on('connection', (socket) => {
  console.log('🔹 WebSocket connected:', socket.id);

  // Example: listen for a test event
  socket.on('test-event', (data) => {
    console.log('Test event received:', data);
    io.emit('test-event', data); // broadcast to all
  });

  socket.on('disconnect', () => {
    console.log('🔹 WebSocket disconnected:', socket.id);
  });
});

// ------------------- ERROR HANDLING -------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  req.flash('error', err.message || 'Something went wrong!');
  res.status(500).redirect('back');
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).render('404', { messages: req.flash() });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
