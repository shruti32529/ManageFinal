/**
 * Run with: node scripts/seed.js
 * Creates an admin user and some sample products/suppliers.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
require('../config/db')();

async function seed(){
  try{
    let admin = await User.findOne({ email:'admin@example.com' });
    if(!admin){
      admin = new User({ name:'Admin', email:'admin@example.com', password:'password', role:'admin' });
      await admin.save();
      console.log('admin created');
    }
    let s = new Supplier({ name:'Acme Supplies', contactEmail:'supplier@acme.com', phone:'123456' });
    s = await s.save();
    let p = new Product({ name:'Sample Widget', sku:'SW-001', category:'Widgets', price:99.99, stockQuantity:50, reorderLevel:10, supplierId: s._id });
    await p.save();
    console.log('seed complete');
  }catch(e){ console.error(e); }
  process.exit(0);
}

seed();
