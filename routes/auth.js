// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer setup for avatar uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

// ------------------- AUTH ROUTES -------------------
// Login & Register pages
router.get('/login', (req, res) => res.render('login', { title: 'Login' }));
router.get('/register', (req, res) => res.render('register', { title: 'Register' }));

// Register handler
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  try {
    if (!name || !email || !password) {
      req.flash('error', 'Please fill all required fields');
      return res.redirect('/register');
    }
    const exist = await User.findOne({ email });
    if (exist) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }
    const user = new User({ name, email, password, role: role || 'staff' });
    await user.save();
    req.flash('info', 'Registration successful — please login');
    return res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Registration failed');
    return res.redirect('/register');
  }
});

// Login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      req.flash('error', 'Provide email and password');
      return res.redirect('/login');
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // create session
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    if (user.role === 'admin') return res.redirect('/admin');
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Login failed');
    return res.redirect('/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ------------------- DASHBOARD -------------------
router.get('/dashboard', ensureAuth, (req, res) => {
  res.render('dashboard', { title: 'Dashboard', user: req.session.user });
});

router.get('/admin', ensureAuth, ensureAdmin, (req, res) => {
  res.render('admin_dashboard', { title: 'Admin Dashboard', user: req.session.user });
});

// ------------------- PROFILE -------------------
router.get('/profile', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).lean();
    res.render('profile', { title: 'Profile', user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load profile');
    res.redirect('/dashboard');
  }
});

router.post('/profile', ensureAuth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { name, email } = req.body;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email.toLowerCase();
    if (req.file) update.avatar = `/uploads/${req.file.filename}`;

    if (update.email) {
      const other = await User.findOne({ email: update.email, _id: { $ne: userId } });
      if (other) {
        req.flash('error', 'Email already in use');
        return res.redirect('/profile');
      }
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || null };
    req.flash('info', 'Profile updated');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update profile');
    res.redirect('/profile');
  }
});

// ------------------- USER MANAGEMENT -------------------
router.get('/users', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().lean();
    res.render('users', { title: 'User Management', users });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load users');
    res.redirect('/admin');
  }
});

// Add user
router.get('/users/add', ensureAuth, ensureAdmin, (req, res) => res.render('user_add', { title: 'Add User' }));
router.post('/users/add', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      req.flash('error', 'Fill all fields');
      return res.redirect('/users/add');
    }
    if (await User.findOne({ email })) {
      req.flash('error', 'Email already registered');
      return res.redirect('/users/add');
    }

    const user = new User({ name, email, password, role: role || 'staff' });
    await user.save();

    // WebSocket: emit new user
    const io = req.app.get('io');
    io.emit('newUser', { id: user._id, name: user.name, email: user.email, role: user.role });

    req.flash('info', 'User added successfully');
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add user');
    res.redirect('/users/add');
  }
});

// Edit user
router.get('/users/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.redirect('/users');
    res.render('user_edit', { title: 'Edit User', user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load user');
    res.redirect('/users');
  }
});

router.post('/users/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, email, role });
    req.flash('info', 'User updated successfully');
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update user');
    res.redirect(`/users/edit/${req.params.id}`);
  }
});

// Delete user
router.post('/users/delete/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('info', 'User deleted successfully');
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete user');
    res.redirect('/users');
  }
});

// ------------------- USER GROUP MANAGEMENT -------------------
router.get('/users/groups', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const groups = await UserGroup.find().lean();
    res.render('user_groups', { title: 'User Groups', groups });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load groups');
    res.redirect('/admin');
  }
});

// Add group
router.get('/users/groups/add', ensureAuth, ensureAdmin, (req, res) => res.render('user_group_add', { title: 'Add User Group' }));
router.post('/users/groups/add', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { name, level, status } = req.body;
    if (!name || !level || !status) {
      req.flash('error', 'Fill all fields');
      return res.redirect('/users/groups/add');
    }
    const group = new UserGroup({ name, level, status });
    await group.save();

    // WebSocket: emit new group
    const io = req.app.get('io');
    io.emit('newGroup', { id: group._id, name: group.name, level: group.level, status: group.status });

    req.flash('info', 'User group added successfully');
    res.redirect('/users/groups');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add group');
    res.redirect('/users/groups/add');
  }
});

// Edit group
router.get('/users/groups/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const group = await UserGroup.findById(req.params.id).lean();
    if (!group) return res.redirect('/users/groups');
    res.render('user_group_edit', { title: 'Edit User Group', group });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Unable to load group');
    res.redirect('/users/groups');
  }
});

router.post('/users/groups/edit/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { name, level } = req.body;
    await UserGroup.findByIdAndUpdate(req.params.id, { name, level });
    req.flash('info', 'User group updated successfully');
    res.redirect('/users/groups');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update group');
    res.redirect(`/users/groups/edit/${req.params.id}`);
  }
});

// Delete group
router.post('/users/groups/delete/:id', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    await UserGroup.findByIdAndDelete(req.params.id);
    req.flash('info', 'User group deleted successfully');
    res.redirect('/users/groups');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete group');
    res.redirect('/users/groups');
  }
});

module.exports = router;  