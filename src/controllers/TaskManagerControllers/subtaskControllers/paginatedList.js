const mongoose = require('mongoose');

const paginatedList = async (req, res) => {
  try {
    const Subtask = mongoose.model('Subtask');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'createdAt', sortValue = -1, filter, equal } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    const searchQuery = req.query.q || '';

    // Convert sortValue to number
    const sortOrder = parseInt(sortValue) || -1;

    // Validate sortBy field (whitelist allowed sort fields)
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'removed', '_id'];
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
      taskId: req.params.taskId,
      removed: false,
      companyId: req.admin.companyId,
      ...(filter && equal ? { [filter]: equal } : {}),
      ...fields,
    };

    // Add filter for assigned subtasks
    const assigned = req.query.assigned ? req.query.assigned.split(',') : [];
    if (assigned.length > 0) {
      baseQuery.assignedTo = { $in: assigned };
    }

    // Logging for debugging
    console.log('Page:', page, 'Limit:', limit, 'Skip:', skip);
    console.log('Sort by:', actualSortBy, 'Sort order:', sortOrder);
    console.log('Base Query:', baseQuery);

    // Create sort object properly
    const sortObject = { [actualSortBy]: sortOrder, _id: 1 }; // Ensure stable sorting
    console.log('Sort Object:', sortObject);

    // Query results and count
    const resultsPromise = Subtask.find(baseQuery).skip(skip).limit(limit).sort(sortObject).exec();

    console.log('Executing query...');

    const countPromise = Subtask.countDocuments(baseQuery);

    const [result, count] = await Promise.all([resultsPromise, countPromise]);

    console.log('Results found:', result.length);

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
