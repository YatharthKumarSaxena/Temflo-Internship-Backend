const LeavePolicy = require('../../models/LeaveModels/leavePolicy');
const LeaveBalance = require('../../models/LeaveModels/LeaveBalanace');
const LeaveRequest = require('../../models/LeaveModels/LeaveRequest');
const User = require('../../models/userModels/User')

// 1. Create Leave Policy
exports.createLeavePolicy = async (req, res) => {
  try {
      
    const {name,count,frequency,creditDay,expiryType,expiryDate,creditOnCreation} = req.body

    if(!name || !count || !frequency || !creditDay || !expiryType){
        res.status(500).json({ success: false, message: "All field Required" });
    }

    const policy = new LeavePolicy({companyId:req.admin.companyId,name,count,frequency,creditDay,expiryType,expiryDate,creditOnCreation});
    await policy.save();

    res.status(200).json({ success: true, message:"Leave Policy created successfully",policy });
  } catch (err) {
    console.error('Error creating Leav Policy:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Update Leave Policy
exports.updateLeavePolicy = async (req, res) => {
  try {

    const {name,count,frequency,creditDay,expiryType,expiryDate,creditOnCreation} = req.body

    if(!name || !count || !frequency || !creditDay || !expiryType){
        res.status(500).json({ success: false, message: "All field Required" });
    }

    const policy = await LeavePolicy.findOneAndUpdate({companyId:req.admin.companyId,_id:req.params.id},
    {name,count,frequency,creditDay,expiryType,expiryDate,creditOnCreation}, 
    { new: true });

    if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
    res.status(200).json({ success: true, policy });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Delete Leave Policy
exports.deleteLeavePolicy = async (req, res) => {
  try {
    await LeavePolicy.findOneAndDelete({companyId:req.admin.companyId, _id:req.params.id});
    res.json({ success: true, message: 'Policy deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get all policies for a company
exports.getCompanyLeavePolicies = async (req, res) => {
  try {
    const policies = await LeavePolicy.find({ companyId: req.admin.companyId });
    res.json({ success: true, policies });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed To Fetch Policies" });
  }
};

// 5. View all leave balances
exports.getCompanyLeaveBalances = async (req, res) => {
  try {
    const balances = await LeaveBalance.find({ companyId: req.params.companyId }).populate('employeeId');
    res.json({ success: true, balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



exports.markLeave = async (req,res) =>{

  try {
      const { userId,plantId, leaveType, durationType, fromDate, toDate, reason } = req.body;
  
      // Check if leaveType is valid for the company
      const policy = await LeavePolicy.findOne({
        companyId: req.admin.companyId,
        _id: leaveType
      });
      if (!policy) {
        return res.status(400).json({
          success: false,
          message: 'This Leave Type is not allowed by your company'
        });
      }
  
      // Fetch leave balance
      const balance = await LeaveBalance.findOne({
        userId,
        leaveTypeId: leaveType,
        companyId: req.admin.companyId
      });
  
      let daysRequested;
  
      if (durationType === 'first' || durationType === 'second') {
        daysRequested = 0.5;
      } else {
        daysRequested =
          (new Date(toDate) - new Date(fromDate)) / (1000 * 3600 * 24) + 1;
      }
  
      if (!balance || balance.balance < daysRequested) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient leave balance to apply'
        });
      }
  
      // Create leave request
      const request = new LeaveRequest({
        userId,
        companyId: req.admin.companyId,
        plantId,
        leaveTypeId: leaveType,
        fromDate,
        toDate,
        durationType,
        daysRequested,
        reason,
        status:"Approved"
      });
  
      await request.save();
  
      // Update leave balance
      balance.balance -= daysRequested;
      balance.availed = (balance.availed || 0) + daysRequested;
      await balance.save();
  
      res.status(200).json({
        success: true,
        message: 'Leave request submitted and balance updated',
        request
      });
    } catch (err) {
      console.error('Error applying for leave:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Server error'
      });
    }
  

}

// 6. View all leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
  const page = req.query.page || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = page * limit - limit;
  
    const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;
  
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  
    let fields;
  
    fields = fieldsArray.length === 0 ? {} : { $or: [] };
  
    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }
  
    //  Query the database for a list of all results
    const resultsPromise = LeaveRequest.find({
  companyId: req.admin.companyId,
  [filter]: equal,
  ...fields,
})
  .populate({
    path: 'plantId',
    select: 'name',
  })
  .populate({
    path: 'userId',
    select: 'employeeCode email',
  })
  .populate({
    path: 'leaveTypeId',
    select: 'name',
  })
  .skip(skip)
  .limit(limit)
  .sort({ [sortBy]: sortValue })
  .exec();
  
    // Counting the total documents
    const countPromise = LeaveRequest.countDocuments({  
      [filter]: equal,
      ...fields,
    });
  
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
  
    // Calculating total pages
    const pages = Math.ceil(count / limit);
  
    // Getting Pagination Object
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
    }  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Approve/Reject a leave request
exports.updateLeaveRequestStatus = async (req, res) => {
  try {
    const { status} = req.body;

    const request = await LeaveRequest.findById(req.params.id);

    if(request.status == status){
        return res.status(404).json({ success: false, message: `Leave Status is already ${status}` })

    }

    if(request.status == "Rejected"){
      return res.status(404).json({ success: false, message: 'Leave request already rejected, try to mark new leaves.' })
    }

    if(request.status == "Pending" && status == "Approved"){
      request.status = status;
      await request.save();

      return res.status(200).json({ success: true,message:"Leave Aprroved Sucessfully",request });
    }

    if(request.status == "Approved" && status == "Pending"){
      request.status = status;
      await request.save();

      return res.status(200).json({ success: true,message:"Leave Changed To Pending Sucessfully",request });
    }

    request.status = status;
    await request.save();

    const balance = await LeaveBalance.findOne({
        userId: request.userId,
        leaveTypeId: request.leaveTypeId,
        companyId: req.admin.companyId
      });

      balance.balance += request.daysRequested;
      balance.availed = balance.availed - request.daysRequested;
      await balance.save();

      res.status(200).json({
        success: true,
        message: 'Leave request Rejected Sucessfully',
        request
      });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLeaveBalance = async (req,res) => {
  try {
    const employees = await User.find({companyId:req.admin.companyId});
    const policy = await LeavePolicy.findOne({ _id:req.params.policyId,companyId:req.admin.companyId});

    if (employees.length === 0 || policy.length === 0) {
      return res.status(400).json({ success: false, message: 'No employees or policies found.' });
    }

    let createdCount = 0;
    for (const employee of employees) {
        const existing = await LeaveBalance.findOne({
          userId: employee._id,
          leaveTypeId: policy._id
        });

        if (!existing) {
          await LeaveBalance.create({
            userId: employee._id,
            leaveTypeId: policy._id,
            companyId:req.admin.companyId,
            leaveTypeName:policy.name,
            balance: policy.count,
            lastCredited: new Date()
          });
          createdCount++;
        }
      
    }

    res.json({ success: true, message: `${createdCount} leave balances created.` });

  } catch (err) {
    console.error('Error creating balances:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
