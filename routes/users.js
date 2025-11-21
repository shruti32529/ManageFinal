const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.render('users', { users, messages: req.flash() });
  } catch (err) {
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

    const io = req.app.get('io');
    if (io) io.emit('userAdded', user);

    req.flash('info', 'User added successfully');
    res.redirect('/users');
  } catch (err) {
    req.flash('error', 'Failed to add user');
    res.redirect('/users');
  }
});

// ✅ Update user
router.post('/edit/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, email, role });

    req.flash('info', 'User updated successfully');
    res.redirect('/users');
  } catch (err) {
    req.flash('error', 'Failed to update user');
    res.redirect('/users');
  }
});

// ✅ Delete user (POST method)
router.post('/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) io.emit('userDeleted', req.params.id);

    req.flash('info', 'User deleted successfully');
    res.redirect('/users');
  } catch (err) {
    req.flash('error', 'Failed to delete user');
    res.redirect('/users');
  }
});

module.exports = router;