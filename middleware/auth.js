const jwt = require('jsonwebtoken');

exports.generateToken = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email };
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.requireRole = (role) => (req, res, next) => {
  if(!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if(req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
  next();
};

// attachUserToView is for EJS pages: attach req.session user if present
exports.attachUserToView = (req, res, next) => {
  res.locals.currentUser = (req.session && req.session.user) ? req.session.user : null;
  next();
};

exports.ensureAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  req.flash('error', 'Please login to continue');
  return res.redirect('/login');
};

// New: ensureAdmin - allow only users with role === 'admin'
exports.ensureAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Admin access required');
  return res.redirect(req.session && req.session.user ? '/dashboard' : '/login');
};
