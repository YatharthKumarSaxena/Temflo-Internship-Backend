module.exports = (req, res, next) => {
  const user = req.admin;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
  }

  if (user.role === 'admin' || user.role === 'owner') {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied: Only Admin or Owner allowed' });
};
