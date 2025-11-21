const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Category = require("../models/Category");

// Middleware to attach io to req
router.use((req, res, next) => {
  req.io = req.app.get("io"); // io server instance from app.js/server.js
  next();
});

// Show All Products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("category");

    res.render("product", {
      products,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Unable to fetch product list");
    res.redirect("/");
  }
});

// Show Add Product Page
router.get("/add", async (req, res) => {
  try {
    const categories = await Category.find();

    res.render("add_product", {
      categories,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Error loading form");
    res.redirect("/products");
  }
});

// Add Product
router.post("/add", async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;

    const product = await Product.create({
      name,
      price,
      stock,
      category,
    });

    // Emit socket event for all clients
    req.io.emit("update-products", await product.populate("category"));

    req.flash("success", "Product added successfully!");
    res.redirect("/products");
  } catch (error) {
    req.flash("error", "Failed to add product");
    res.redirect("/products/add");
  }
});

// Show Edit Page
router.get("/edit/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const categories = await Category.find();

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/products");
    }

    res.render("edit_product", {
      product,
      categories,
      messages: req.flash(),
    });
  } catch (error) {
    req.flash("error", "Unable to load edit page");
    res.redirect("/products");
  }
});

// Update Product
router.post("/edit/:id", async (req, res) => {
  try {
    const { name, price, stock, category } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, stock, category },
      { new: true }
    ).populate("category");

    // Emit socket event for all clients
    req.io.emit("update-products", updatedProduct);

    req.flash("success", "Product updated successfully!");
    res.redirect("/products");
  } catch (error) {
    req.flash("error", "Error updating product");
    res.redirect("/products");
  }
});

// Delete Product
router.post("/delete/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    // Emit socket event for all clients
    req.io.emit("delete-product", req.params.id);

    req.flash("success", "Product deleted successfully!");
    res.redirect("/products");
  } catch (error) {
    req.flash("error", "Error deleting product");
    res.redirect("/products");
  }
});

module.exports = router;
