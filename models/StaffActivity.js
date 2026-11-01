const mongoose = require('mongoose');

const staffActivitySchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actorName: { type: String, required: true },
  actorEmail: { type: String, required: true },
  actorRole: { type: String, enum: ['admin', 'staff'], required: true },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'sold', 'signed_in', 'signed_out'],
    required: true
  },
  entityType: { type: String, required: true },
  entityId: { type: String, default: '' },
  entityName: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

staffActivitySchema.index({ createdAt: -1 });
staffActivitySchema.index({ actorId: 1, createdAt: -1 });

module.exports = mongoose.models.StaffActivity
  || mongoose.model('StaffActivity', staffActivitySchema);
