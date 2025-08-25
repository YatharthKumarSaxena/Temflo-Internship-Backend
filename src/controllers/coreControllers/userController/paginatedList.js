const mongoose = require('mongoose');
const Permission = require('../../../models/userModels/Permission');
const Plant = require('../../../models/appModels/Plant'); // Adjust if needed

const paginatedList = async (req, res) => {
  try {
    const User = mongoose.model('User');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'enabled', sortValue = -1, filter, equal, q: searchQuery = '' } = req.query;

    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    // Init search arrays
    const searchFields = [];
    let plantIds = [];

    if (searchQuery && fieldsArray.length > 0) {
      for (const field of fieldsArray) {
        if (field === 'plantId.name') {
          const matchedPlants = await Plant.find({
            name: { $regex: new RegExp(searchQuery, 'i') },
            companyId: req.admin.companyId,
          }).select('_id');

          plantIds = matchedPlants.map((p) => p._id);
        } else {
          searchFields.push({ [field]: { $regex: new RegExp(searchQuery, 'i') } });
        }
      }
    }

    // Base query
    const baseQuery = {
      removed: false,
      companyId: req.admin.companyId,
      role: { $in: ['admin', 'employee'] },
      ...(filter && equal ? { [filter]: equal } : {}),
    };

    // Plant permissions for employee
    if (req.admin.role === 'employee') {
      const permissions = await Permission.find({ employeeId: req.admin._id });
      const allowedPlantIds = permissions.map((p) => p.plantId);
      if (!allowedPlantIds.length) {
        return res.status(403).json({ message: 'No plant permissions found' });
      }
      baseQuery.plantId = { $in: allowedPlantIds };
    }

    // If plant search is applied
    if (plantIds.length > 0) {
      baseQuery.$or = [
        ...(searchFields.length > 0 ? searchFields : []),
        { plantId: { $in: plantIds } },
      ];
    } else if (searchFields.length > 0) {
      baseQuery.$or = searchFields;
    }

    const resultsPromise = User.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue, _id: 1 })
      .populate('plantId') // needed for display
      .exec();

    const countPromise = User.countDocuments(baseQuery);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    return res.status(count ? 200 : 203).json({
      success: true,
      result,
      pagination,
      message: count ? 'Successfully found all documents' : 'Collection is Empty',
    });
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
