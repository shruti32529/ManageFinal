const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const { ensureAuth } = require('../middleware/auth');

// Create purchase order and (optionally) update stock when completed
router.post('/', ensureAuth, async (req, res) => {
  const po = new PurchaseOrder(req.body);
  await po.save();
  // if status = Completed, update product stocks
  if(po.status === 'Completed'){
    for(const item of po.products){
      await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity }});
    }
  }
  res.json(po);
});

router.get('/', ensureAuth, async (req, res) => res.json(await PurchaseOrder.find().populate('supplierId').populate('products.productId')));
router.put('/:id/complete', ensureAuth, async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if(!po) return res.status(404).json({message:'not found'});
  po.status = 'Completed';
  await po.save();
  for(const item of po.products){
    await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.quantity }});
  }
  res.json(po);
});

module.exports = router;
