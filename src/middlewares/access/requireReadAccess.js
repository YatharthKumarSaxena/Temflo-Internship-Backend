const requireReadAccess = (req, res, next) => {
  if (req.admin.role === 'owner' || req.admin.role === 'admin') {
    return next();
  }
  // Check if user has either read or readWrite access
  if (req.accessType === 'read' || req.accessType === 'readWrite') {
    return next();
  }

  // Otherwise, deny access
  return res.status(403).json({ message: 'You need read access to perform this action.' });
};

module.exports = requireReadAccess;