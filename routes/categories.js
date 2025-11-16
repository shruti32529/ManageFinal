// routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// List categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().populate('parent').sort({ createdAt: -1 });
    res.render('categories', { categories, messages: req.flash() });
  } catch (err) {
    console.error('GET /categories error:', err);
    res.status(500).send('Server Error');
  }
});

// Add form
router.get('/add', async (req, res) => {
  try {
    const parents = await Category.find().sort({ name: 1 });
    res.render('category_add', { parents, messages: req.flash() });
  } catch (err) {
    console.error('GET /categories/add error:', err);
    res.status(500).send('Server Error');
  }
});

// ADD POST  -----------------------  WEBSOCKET ADDED
router.post('/add', async (req, res) => {
  try {
    const { name, description, parent, status } = req.body;
    const cat = new Category({
      name: name.trim(),
      description: description || '',
      parent: parent || null,
      status: status || 'Active'
    });
    
    await cat.save();

    // 🔥 WebSocket Emit for New Category
    const io = req.app.get('io');
    io.emit('newCategory', {
      id: cat._id,
      name: cat.name,
      status: cat.status
    });

    req.flash('info', 'Category added successfully');
    res.redirect('/categories');
  } catch (err) {
    console.error('POST /categories/add error:', err);
    if (err.code === 11000) req.flash('error', 'Category name already exists');
    else req.flash('error', 'Failed to add category');
    res.redirect('/categories/add');
  }
});

// Edit form
router.get('/edit/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/categories');
    }
    const parents = await Category.find({ _id: { $ne: req.params.id } }).sort({ name: 1 });
    res.render('category_edit', { category, parents, messages: req.flash() });
  } catch (err) {
    console.error('GET /categories/edit error:', err);
    res.status(500).send('Server Error');
  }
});

// EDIT POST ------------------------ WEBSOCKET ADDED
router.post('/edit/:id', async (req, res) => {
  try {
    const { name, description, parent, status } = req.body;

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        description: description || '',
        parent: parent || null,
        status: status || 'Active'
      },
      { new: true }
    );

    // 🔥 WebSocket Emit for Updated Category
    const io = req.app.get('io');
    io.emit('updateCategory', {
      id: updated._id,
      name: updated.name,
      status: updated.status
    });

    req.flash('info', 'Category updated successfully');
    res.redirect('/categories');
  } catch (err) {
    console.error('POST /categories/edit error:', err);
    if (err.code === 11000) req.flash('error', 'Category name already exists');
    else req.flash('error', 'Failed to update category');
    res.redirect(`/categories/edit/${req.params.id}`);
  }
});

// Delete confirm page
router.get('/delete/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/categories');
    }
    res.render('category_delete', { category, messages: req.flash() });
  } catch (err) {
    console.error('GET /categories/delete error:', err);
    res.status(500).send('Server Error');
  }
});

// DELETE POST ------------------------ WEBSOCKET ADDED
router.post('/delete/:id', async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);

    // 🔥 WebSocket Emit for Deleted Category
    const io = req.app.get('io');
    io.emit('deleteCategory', {
      id: req.params.id,
      name: deleted?.name || "Category"
    });

    req.flash('info', 'Category deleted successfully');
    res.redirect('/categories');
  } catch (err) {
    console.error('POST /categories/delete error:', err);
    req.flash('error', 'Failed to delete category');
    res.redirect('/categories');
  }
});

module.exports = router;