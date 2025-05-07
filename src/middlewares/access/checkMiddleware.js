const Permission = require('../../models/userModels/Permission'); 

const checkPermission = (featureName) => {
  return async (req, res, next) => {
    try {
      const user = req.admin; // From auth middleware
      const plantId = req.headers['plant-id'];

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (user.role === 'owner' || user.role === 'admin') {
        return next();
      }

      if (user.role === 'employee') {
        if (!plantId) {
          return res.status(400).json({ message: 'Plant ID is required' });
        }

        // Fetch permissions from DB
        const permission = await Permission.findOne({
          employeeId: user._id,
          plantId: plantId,
        });

        

        if (!permission) {
          return res.status(403).json({ message: 'No permissions found for this plant' });
        }

        const featurePermission = permission.features.find(
          (f) => f.featureName === featureName
        );

        if (!featurePermission) {
          return res.status(403).json({ message: 'Feature access not granted' });
        }

        req.accessType = featurePermission.accessType;
        
        return next();
      }

      return res.status(403).json({ message: 'Invalid role' });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};

module.exports = checkPermission;
