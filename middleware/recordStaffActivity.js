const StaffActivity = require('../models/StaffActivity');

const allowedDetailFields = new Set([
  'name',
  'description',
  'category',
  'parent',
  'stock',
  'price',
  'productName',
  'quantity',
  'salesPrice',
  'total',
  'status',
  'role',
  'email',
  'avatar'
]);

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(details)) {
    if (key === 'before' || key === 'after') {
      sanitized[key] = sanitizeDetails(value);
    } else if (allowedDetailFields.has(key)) {
      if (typeof value === 'string') sanitized[key] = value.slice(0, 300);
      else if (value === null || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value !== undefined) {
        sanitized[key] = String(value);
      }
    }
  }
  return sanitized;
}

async function recordStaffActivity(req, event) {
  const actor = req.session && req.session.user;
  const actorRole = actor && String(actor.role).toLowerCase();
  if (!actor || actorRole !== 'staff' || !actor.id) return;

  try {
    await StaffActivity.create({
      actorId: actor.id,
      actorName: actor.name || actor.email,
      actorEmail: actor.email,
      actorRole,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ? String(event.entityId) : '',
      entityName: event.entityName || '',
      details: sanitizeDetails(event.details)
    });
  } catch (error) {
    console.error('Unable to record staff activity:', error.message);
  }
}

module.exports = recordStaffActivity;
