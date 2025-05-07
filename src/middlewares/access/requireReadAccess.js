const requireReadAccess = (req, res, next) => {
  if (req.admin.role === 'owner' || req.admin.role === 'admin') {
        return next();
  }
  if (req.accessType !== 'read') {
    return res.status(403).json({ message: 'You need read access to perform this action.' });
  }
  next();
};

module.exports = requireReadAccess;