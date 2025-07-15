const User = require('../../../models/userModels/User')


const employeeList = async (req, res) => {
    try {
      const { plantId, search = '', page = 1, limit = 20 } = req.query;
  
      const regex = new RegExp(search, 'i');
  
      const query = {
        plantId,
        $or: [
          { employeeCode: { $regex: regex } },
          { name: { $regex: regex } },
        ],
      };
  
      const total = await User.countDocuments(query);
  
      const employees = await User.find(query)
        .select('_id name employeeCode')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
  
      res.status(200).json({
        success: true,
        result: employees,
        hasMore: page * limit < total,
      });
    } catch (err) {
      console.error('Error in get Employee List:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
  

  module.exports = employeeList
