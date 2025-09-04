const mongoose = require('mongoose');

const paginatedList = async (req, res) => {
  try {
    const Workspace = mongoose.model('Workspace');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'createdAt', sortValue = -1, filter, equal } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    const searchQuery = req.query.q || '';

    // Convert sortValue to number
    const sortOrder = parseInt(sortValue) || -1;

    // Validate sortBy field (whitelist allowed sort fields)
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'enabled', '_id'];
    const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Search filters
    let fields = {};
    if (fieldsArray.length && searchQuery) {
      fields.$or = fieldsArray.map((field) => ({
        [field]: { $regex: new RegExp(searchQuery, 'i') },
      }));
    }

    // Base query
    const baseQuery = {
      companyId: req.admin.companyId,
      ...(filter && equal ? { [filter]: equal } : {}),
      ...fields,
    };

    // Create sort object properly
    const sortObject = { [actualSortBy]: sortOrder, _id: 1 }; // Ensure stable sorting

    // Query results and count
    const resultsPromise = Workspace.find(baseQuery)
      .skip(skip)
      .limit(limit)
      .sort(sortObject)
      .exec();

    const countPromise = Workspace.countDocuments(baseQuery);

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
    console.error('Error stack:', err.stack);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message,
    });
  }
};

module.exports = paginatedList;
