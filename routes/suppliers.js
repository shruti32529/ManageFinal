const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { ensureAuth } = require('../middleware/auth');

router.get('/', async (req, res) => res.json(await Supplier.find()));
router.post('/', ensureAuth, async (req, res) => {
  const s = new Supplier(req.body); await s.save(); res.json(s);
});
router.put('/:id', ensureAuth, async (req, res) => res.json(await Supplier.findByIdAndUpdate(req.params.id, req.body, {new:true})));
router.delete('/:id', ensureAuth, async (req, res) => { await Supplier.findByIdAndDelete(req.params.id); res.json({ok:true}); });

module.exports = router;
