const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Get all users with Redis caching
router.get('/', async (req, res) => {
  try {
    const redisClient = req.app.get('redisClient');

    // 🔹 Check cache
    const cachedUsers = await redisClient.get('users');

    if (cachedUsers) {
      console.log('Serving users from Redis cache');
      return res.render('users', { users: JSON.parse(cachedUsers), messages: req.flash() });
    }

    // 🔹 If cache miss, fetch from DB
    const users = await User.find();

    // 🔹 Store in Redis cache for 60 seconds
    await redisClient.setEx('users', 60, JSON.stringify(users));

    console.log('Serving users from MongoDB');
    res.render('users', { users, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch users');
    res.redirect('back');
  }
});

// ✅ Add user
router.post('/', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = new User({
      name,
      email,
      role: role || 'staff',
      password: 'default123'
    });
    await user.save();

    const redisClient = req.app.get('redisClient');
    await redisClient.del('users'); // 🔹 Clear cache

    const io = req.app.get('io');
    if (io) io.emit('userAdded', user); // 🔹 Socket.io notification

    req.flash('info', 'User added successfully');
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add user');
    res.redirect('/users');
  }
});

// ✅ Update user
router.post('/edit/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, email, role });

    const redisClient = req.app.get('redisClient');
    await redisClient.del('users'); // 🔹 Clear cache

    const io = req.app.get('io');
    if (io) io.emit('userUpdated', { _id: req.params.id, name, email, role });

    req.flash('info', 'User updated successfully');
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update user');
    res.redirect('/users');
  }
});

// ✅ Delete user
router.post('/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    const redisClient = req.app.get('redisClient');
    await redisClient.del('users'); // 🔹 Clear cache

    const io = req.app.get('io');
    if (io) io.emit('userDeleted', req.params.id);

    req.flash('info', 'User deleted successfully');
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete user');
    res.redirect('/users');
  }
});

module.exports = router;
