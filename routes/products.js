const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Product = require("../models/Product");
const Category = require("../models/Category");

// ===== File Upload Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find({}).populate("category").sort({ createdAt: -1 });
        res.render("products", { products, messages: req.flash() });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error loading products");
        res.render("products", { products: [] });
    }
});

// ===== Add Product Form =====
router.get("/add", async (req, res) => {
  try {
    const categories = await Category.find();
    res.render("addProduct", { categories, messages: req.flash() });
  } catch (err) {
    req.flash("error", "Error loading categories");
    res.redirect("/products");
  }
});

// ===== Save Product =====
router.post("/add", upload.single("photo"), async (req, res) => {
  try {
    const { title, category, stock, buyingPrice, sellingPrice } = req.body;

    const newProduct = new Product({
      title,
      category,
      stock,
      buyingPrice,
      sellingPrice,
      photo: req.file ? req.file.filename : null,
    });

    await newProduct.save();
    req.flash("info", "Product added successfully!");
    res.redirect("/products");
  } catch (err) {
    console.error(err);
    req.flash("error", "Error adding product");
    res.redirect("/products/add");
  }
});

// Show edit form
router.get('/edit/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        const categories = await Category.find();
        res.render("editProduct", { product, categories, messages: req.flash() });
    } catch (err) {
        req.flash("error", "Product not found");
        res.redirect("/products");
    }
});

// ===== Update Product =====
router.post("/edit/:id", upload.single("photo"), async (req, res) => {
  try {
    const { title, category, stock, buyingPrice, sellingPrice } = req.body;

    const updatedFields = {
      title,
      category,
      stock,
      buyingPrice,
      sellingPrice,
    };

    if (req.file) {
      updatedFields.photo = req.file.filename;
    }

    await Product.findByIdAndUpdate(req.params.id, updatedFields);
    req.flash("info", "Product updated successfully!");
    res.redirect("/products");
  } catch (err) {
    req.flash("error", "Error updating product");
    res.redirect("/products");
  }
});

// Delete product
router.get('/delete/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success', 'Product deleted successfully');
        res.redirect('/products');
    } catch (err) {
        req.flash('error', 'Error deleting product');
        res.redirect('/products');
    }
});

module.exports = router;
