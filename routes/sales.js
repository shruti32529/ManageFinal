const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');

// =========================
// 🛒 SALES CRUD ROUTES
// =========================

// Show all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().populate('product');
    res.render('sales', { sales, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading sales');
    res.redirect('/');
  }
});

// Show add sale page
router.get('/add', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('addSale', { products, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading add sale page');
    res.redirect('/sales');
  }
});

// Handle new sale
router.post('/add', async (req, res) => {
  try {
    const { product, quantity, price, status } = req.body;
    const total = quantity * price;

    const sale = new Sale({
      product,
      quantity,
      price,
      total,
      status
    });

    await sale.save();
    req.flash('success', 'Sale added successfully');
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error adding sale');
    res.redirect('/sales/add');
  }
});

// Show edit sale page
router.get('/edit/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('product');
    const products = await Product.find();
    if (!sale) {
      req.flash('error', 'Sale not found');
      return res.redirect('/sales');
    }
    res.render('editSale', { sale, products, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading sale');
    res.redirect('/sales');
  }
});

// Handle edit form
router.post('/edit/:id', async (req, res) => {
  try {
    const { product, quantity, price, status } = req.body;
    const total = quantity * price;

    await Sale.findByIdAndUpdate(req.params.id, {
      product,
      quantity,
      price,
      total,
      status
    });

    req.flash('success', 'Sale updated successfully');
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating sale');
    res.redirect('/sales');
  }
});

// Handle delete
router.get('/delete/:id', async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    req.flash('success', 'Sale deleted successfully');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting sale');
  }
  res.redirect('/sales');
});

// =========================
// 📊 REPORTING ROUTES
// =========================

// DAILY REPORT
router.get('/report/daily', async (req, res) => {
  try {
    const dailySales = await Sale.aggregate([
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$sale_date" },
            month: { $month: "$sale_date" },
            year: { $year: "$sale_date" }
          },
          totalSales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
    ]);

    res.render('dailyReport', { dailySales, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error generating daily report');
    res.redirect('/sales');
  }
});

// PDF for daily report
router.get('/report/daily/pdf', async (req, res) => {
  try {
    const dailySales = await Sale.aggregate([
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$sale_date" },
            month: { $month: "$sale_date" },
            year: { $year: "$sale_date" }
          },
          totalSales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
    ]);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=daily_sales.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Daily Sales Report", { align: "center" }).moveDown();
    dailySales.forEach(sale => {
      doc.fontSize(12).text(
        `${sale._id.day}-${sale._id.month}-${sale._id.year} | Orders: ${sale.count} | Total: ${sale.totalSales}`
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.redirect('/sales/report/daily');
  }
});

// MONTHLY REPORT
router.get('/report/monthly', async (req, res) => {
  try {
    const monthlySales = await Sale.aggregate([
      {
        $group: {
          _id: { month: { $month: "$sale_date" }, year: { $year: "$sale_date" } },
          totalSales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.render('monthlyReport', { monthlySales, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error generating monthly report');
    res.redirect('/sales');
  }
});

// PDF for monthly report
router.get('/report/monthly/pdf', async (req, res) => {
  try {
    const monthlySales = await Sale.aggregate([
      {
        $group: {
          _id: { month: { $month: "$sale_date" }, year: { $year: "$sale_date" } },
          totalSales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=monthly_sales.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Monthly Sales Report", { align: "center" }).moveDown();
    monthlySales.forEach(sale => {
      doc.fontSize(12).text(
        `${sale._id.month}-${sale._id.year} | Orders: ${sale.count} | Total: ${sale.totalSales}`
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.redirect('/sales/report/monthly');
  }
});

// CUSTOM DATE RANGE REPORT
router.get('/report/bydate', (req, res) => {
  res.render('dateReportForm', { sales: null, messages: req.flash() });
});

router.post('/report/bydate', async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    const sales = await Sale.find({
      sale_date: { $gte: new Date(start_date), $lte: new Date(end_date) }
    }).populate('product');

    res.render('dateReport', { sales, start_date, end_date, messages: req.flash() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error generating report');
    res.redirect('/sales');
  }
});

// PDF for custom date range
router.get('/report/bydate/pdf', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const sales = await Sale.find({
      sale_date: { $gte: new Date(start_date), $lte: new Date(end_date) }
    }).populate('product');

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales_by_date.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Sales Report by Date Range", { align: "center" }).moveDown();
    doc.text(`From: ${start_date}  To: ${end_date}`).moveDown();

    sales.forEach(sale => {
      doc.fontSize(12).text(
        `${sale.sale_date.toDateString()} | ${sale.product ? sale.product.name : ''} | Qty: ${sale.quantity} | Total: ${sale.total} | Status: ${sale.status}`
      );
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.redirect('/sales/report/bydate');
  }
});

module.exports = router;
