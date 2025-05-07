const requireWriteAccess = (req, res, next) => {
  if (req.admin.role === 'owner' || req.admin.role === 'admin') {
        return next();
  }
  if (req.accessType !== 'readWrite') {
    return res.status(403).json({ message: 'You need write access to perform this action.' });
  }
  next();
};

module.exports = requireWriteAccess;