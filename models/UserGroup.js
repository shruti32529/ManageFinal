const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,       // must be provided
      trim: true,           // removes extra spaces
      unique: true,         // group name cannot be duplicated
    },
    level: {
      type: String,
      default: 'Normal',    // if not provided, default is Normal
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],  // only these 2 values allowed
      default: 'Active',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }      // auto adds createdAt & updatedAt
);

module.exports = mongoose.model('UserGroup', userGroupSchema);
