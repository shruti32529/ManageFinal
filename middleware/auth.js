const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.generateToken = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'jwtsecret', { expiresIn: '7d' });
};

exports.ensureAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.session?.token;
  if(!token) return res.status(401).json({ message: 'Unauthorized' });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret');
    req.user = await User.findById(payload.id).select('-password');
    next();
  }catch(e){
    return res.status(401).json({ message: 'Invalid token' });
  }
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
  return res.redirect('/login');
};
