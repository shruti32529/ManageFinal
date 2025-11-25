const express = require('express');
const router = express.Router();
const Sales = require('../models/Sale'); // Ensure correct model path

// 📌 GET Request → Report Page Open Hoga
router.get('/sales-report', (req, res) => {
    res.render('reportDate', { sales: null, totalIncome: 0, startDate: "", endDate: "", error: null });
});

// 📌 POST Request → Report Generate Based on Dates
router.post('/sales-report', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        // ⚠️ Validation
        if (!startDate || !endDate) {
            return res.render('reportDate', {
                sales: null,
                totalIncome: 0,
                startDate,
                endDate,
                error: "⚠️ Please select both start and end dates."
            });
        }

        // MongoDB date filter
        const sales = await Sales.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59')
            }
        }).sort({ createdAt: -1 }); // Sorted by latest first

        // Total Income Calculation
        let totalIncome = sales.reduce((sum, sale) => sum + sale.total, 0);

        res.render('reportDate', {
            sales,
            totalIncome,
            startDate,
            endDate,
            error: sales.length === 0 ? "⚠️ No sales found for selected date range." : null
        });
    } catch (error) {
        console.error("❌ Error generating report:", error);
        res.render('reportDate', {
            sales: null,
            totalIncome: 0,
            startDate: "",
            endDate: "",
            error: "❌ Something went wrong while generating report."
        });
    }
});

module.exports = router;
