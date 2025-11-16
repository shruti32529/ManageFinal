const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

module.exports = function(){
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_db';
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(()=> console.log('MongoDB connected'))
    .catch(err => {
      console.error('MongoDB connection error', err);
      process.exit(1);
    });
};
