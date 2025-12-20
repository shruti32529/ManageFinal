const express = require("express");
const router = express.Router();
const Sales = require("../models/Sale");
const redis = require("../config/redis");

// 📍 Show all sales (WITH REDIS CACHE)
router.get("/", async (req, res) => {
  try {
    // 1️⃣ Check Redis
    const cachedSales = await redis.get("sales:data");

    if (cachedSales) {
      console.log("⚡ Cache HIT – Sales data from Redis");
      return res.render("sales", {
        title: "Sales Page",
        sales: JSON.parse(cachedSales),
      });
    }

    console.log("🐢 Cache MISS – Sales data from MongoDB");

    // 2️⃣ Fetch from MongoDB
    const sales = await Sales.find().sort({ createdAt: -1 });

    // 3️⃣ Store in Redis (60 seconds)
    await redis.set("sales:data", JSON.stringify(sales), { EX: 60 });


    res.render("sales", { title: "Sales Page", sales });

  } catch (err) {
    console.log("❌ Redis error:", err.message);
    res.render("sales", { title: "Sales Page", sales: [] });
  }
});

// 📍 Add Sale Page
router.get("/add", (req, res) => {
  res.render("addSale", { title: "Add Sale", sale: null });
});

// 📍 Add Sale
router.post("/add", async (req, res) => {
  try {
    const { productName, quantity, salesPrice, status } = req.body;
    const total = quantity * salesPrice;

    const newSale = new Sales({
      productName,
      quantity,
      salesPrice,
      total,
      status,
    });

    await newSale.save();

    // ❗ Clear Redis cache after data change
    await redis.del("sales:data");

    res.redirect("/sales");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving sale: " + err.message);
  }
});

// 📍 Edit Sale Page
router.get("/edit/:id", async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) return res.redirect("/sales");

    res.render("editSale", { title: "Edit Sale", sale });
  } catch (err) {
    res.status(500).send("Error loading sale");
  }
});

// 📍 Edit Sale
router.post("/edit/:id", async (req, res) => {
  try {
    const { productName, quantity, salesPrice, status } = req.body;
    const total = quantity * salesPrice;

    await Sales.findByIdAndUpdate(req.params.id, {
      productName,
      quantity,
      salesPrice,
      total,
      status,
    });

    // ❗ Clear Redis cache
    await redis.del("sales:data");

    res.redirect("/sales");
  } catch (err) {
    res.status(500).send("Error updating sale");
  }
});

// ❌ Delete Sale
router.get("/delete/:id", async (req, res) => {
  try {
    await Sales.findByIdAndDelete(req.params.id);

    // ❗ Clear Redis cache
    await redis.del("sales:data");

    res.redirect("/sales");
  } catch (err) {
    res.status(500).send("Error deleting sale");
  }
});

module.exports = router;
