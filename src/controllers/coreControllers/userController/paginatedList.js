const mongoose = require('mongoose');
const Permission = require('../../../models/userModels/Permission'); // Adjust the path as needed

const paginatedList = async (req, res) => {
  const User = mongoose.model('User');
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;
  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

  let fields = fieldsArray.length === 0 ? {} : { $or: [] };
  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }

  // Base query
  const baseQuery = {
    removed: false,
    companyId: req.admin.companyId,
    role: { $in: ['admin', 'employee'] },
    ...(filter && equal ? { [filter]: equal } : {}),
    ...fields,
  };

  // If user is employee, restrict plant scope
  if (req.admin.role === 'employee') {
    const permissions = await Permission.find({ employeeId: req.admin._id });
    const allowedPlantIds = permissions.map(p => p.plantId);

    if (allowedPlantIds.length === 0) {
      return res.status(403).json({ message: 'No plant permissions found' });
    }

    baseQuery.plantId = { $in: allowedPlantIds };
  }

  // Query + Count
  const resultsPromise = User.find(baseQuery)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
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
};

module.exports = paginatedList;
