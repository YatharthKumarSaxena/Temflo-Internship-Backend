const mongoose = require('mongoose');
const Permission = require('../../../models/userModels/Permission'); // Adjust the path as needed

const paginatedList = async (req, res) => {
  try {
    const User = mongoose.model('User');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    const searchQuery = req.query.q || '';

    // Search filters
    let fields = {};
    if (fieldsArray.length && searchQuery) {
      fields.$or = fieldsArray.map(field => ({
        [field]: { $regex: new RegExp(searchQuery, 'i') }
      }));
    }

    // Base query
    const baseQuery = {
      removed: false,
      companyId: req.admin.companyId,
      role: { $in: ['admin', 'employee'] },
      ...(filter && equal ? { [filter]: equal } : {}),
      ...fields,
    };

    // If user is employee, restrict to allowed plantIds
    if (req.admin.role === 'employee') {
      const permissions = await Permission.find({ employeeId: req.admin._id });
      const allowedPlantIds = permissions.map(p => p.plantId);

      if (allowedPlantIds.length === 0) {
        return res.status(403).json({ message: 'No plant permissions found' });
      }

      baseQuery.plantId = { $in: allowedPlantIds };
    }

    // Logging for debugging
    console.log('Page:', page, 'Limit:', limit, 'Skip:', skip);
    console.log('Base Query:', baseQuery);

    // Query results and count
    const resultsPromise = User.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue, _id: 1 }) // Ensure stable sorting
      .populate('plantId')
      .exec();

    const countPromise = User.countDocuments(baseQuery);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: true,
        result: [],
        pagination,
        message: 'Collection is Empty',
      });
    }

  } catch (err) {
    console.error('Error in paginatedList:', err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message,
    });
  }
};

module.exports = paginatedList;
