const express = require("express");
const router = express.Router();
const Sales = require("../models/Sale");
const recordStaffActivity = require("../middleware/recordStaffActivity");

// 📍 Show all sales
router.get("/", async (req, res) => {
  try {
    const sales = await Sales.find().sort({ createdAt: -1 });
    res.render("sales", { title: "Sales Page", sales });
  } catch (err) {
    res.status(500).send("Server Error");
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
    const actor = req.session.user;

    const newSale = new Sales({
      productName,
      quantity,
      salesPrice,
      total,
      status,
      soldBy: actor.id,
      soldByName: actor.name || actor.email,
      soldByEmail: actor.email,
    });

    await newSale.save();
    await recordStaffActivity(req, {
      action: "sold",
      entityType: "Sale",
      entityId: newSale._id,
      entityName: productName,
      details: { productName, quantity, salesPrice, total, status },
    });
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
    const previousSale = await Sales.findById(req.params.id).lean();
    if (!previousSale) return res.redirect("/sales");

    const updatedSale = await Sales.findByIdAndUpdate(req.params.id, {
      productName,
      quantity,
      salesPrice,
      total,
      status,
      updatedBy: req.session.user.id,
    }, { new: true });

    await recordStaffActivity(req, {
      action: "updated",
      entityType: "Sale",
      entityId: updatedSale._id,
      entityName: updatedSale.productName,
      details: {
        before: {
          productName: previousSale.productName,
          quantity: previousSale.quantity,
          salesPrice: previousSale.salesPrice,
          total: previousSale.total,
          status: previousSale.status,
        },
        after: { productName, quantity, salesPrice, total, status },
      },
    });
    res.redirect("/sales");
  } catch (err) {
    res.status(500).send("Error updating sale");
  }
});

// ❌ Delete Sale
router.get("/delete/:id", async (req, res) => {
  try {
    const sale = await Sales.findByIdAndDelete(req.params.id);
    if (sale) {
      await recordStaffActivity(req, {
        action: "deleted",
        entityType: "Sale",
        entityId: sale._id,
        entityName: sale.productName,
        details: {
          before: {
            productName: sale.productName,
            quantity: sale.quantity,
            salesPrice: sale.salesPrice,
            total: sale.total,
            status: sale.status,
          },
        },
      });
    }
    res.redirect("/sales");
  } catch (err) {
    res.status(500).send("Error deleting sale");
  }
});

module.exports = router;