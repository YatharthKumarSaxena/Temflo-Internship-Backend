const AssetType = require('../../models/AssetModels/AssetType')
const Asset = require('../../models/AssetModels/Asset')
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// create Asset Type
exports.createAssetType = async (req, res) => {
  try {
      
    const {name,description} = req.body

    if(!name){
        res.status(500).json({ success: false, message: "All field Required" });
    }

    const assetTypes = new AssetType({companyId:req.admin.companyId,name,description});
    await assetTypes.save();

    res.status(200).json({ success: true, message:"Asset Type created successfully",assetTypes });
  } catch (err) {
    console.error('Error creating Asset Type:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// 4. Get all policies for a company
exports.getAssetType = async (req, res) => {
  try {
    const assetTypes = await AssetType.find({ companyId: req.admin.companyId });
        res.json({ success: true, assetTypes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed To Fetch Asset Types" });
  }
};

exports.deleteAssetType = async (req, res) => {
  try {
    await AssetType.findOneAndDelete({companyId:req.admin.companyId, _id:req.params.id});
    res.json({ success: true, message: 'Asset Type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAssetType = async (req, res) => {
  try {

    const {name,description} = req.body

    if(!name){
        res.status(500).json({ success: false, message: "All field Required" });
    }

    const assetType = await AssetType.findOneAndUpdate({companyId:req.admin.companyId,_id:req.params.id},
    {name,description}, 
    { new: true });

    if (!assetType) return res.status(404).json({ success: false, message: 'Asset Type Not Found' });
    res.status(200).json({ success: true, assetType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.addAsset = async (req,res) =>{

try{

    const {plantId, name, assetType,serialNumber, description, status, assignedTo,purchaseDate,expiryDate,location,manufacturer,responsible} = req.body;

    if(!plantId || !name || !assetType || !serialNumber){
        res.status(500).json({ success: false, message: "All field Required" });

    }

        const asset = new Asset({companyId:req.admin.companyId,plantId, name, assetType,serialNumber, description, status, assignedTo,purchaseDate,expiryDate,location,manufacturer,responsible});
        await asset.save();
    
        res.status(200).json({ success: true, message:"Asset Added successfully"});
    

}
catch (err) {
    res.status(500).json({ success: false, message: err.message });
}

}

exports.getAssets = async (req, res) => {
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
    const resultsPromise = Asset.find({
  companyId: req.admin.companyId,
  plantId:req.params.plantId,
  [filter]: equal,
  ...fields,
})
  .populate({
    path: 'plantId',
    select: 'name',
  })
  .populate({
    path: 'assignedTo',
    select: 'employeeCode email',
  })
  .populate({
    path: 'assetType',
    select: 'name',
  })
  .populate({
    path: 'responsible',
    select: 'employeeCode email',
  })
  .skip(skip)
  .limit(limit)
  .sort({ [sortBy]: sortValue })
  .exec();
  
    // Counting the total documents
    const countPromise = Asset.countDocuments({  
      [filter]: equal,
      ...fields,
    });

    // Summary counts for status categories
    const totalCountPromise = Asset.countDocuments({
      companyId: req.admin.companyId,
      plantId: req.params.plantId,
    });

    const statusCountsPromise = Asset.aggregate([
      {
        $match: {
          companyId: req.admin.companyId,
          plantId: new mongoose.Types.ObjectId(req.params.plantId),
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);


    const [result, count, totalCount, statusCounts] = await Promise.all([
      resultsPromise,
      countPromise,
      totalCountPromise,
      statusCountsPromise,
    ]);
  
    // Convert statusCounts array to key-value object
    const statusSummary = {
  Available: 0,
  Assigned: 0,
  'Under Maintenance': 0,
  Disposed: 0,
  Expired: 0,
};

statusCounts.forEach(({ _id, count }) => {
  if (statusSummary.hasOwnProperty(_id)) {
    statusSummary[_id] = count;
  }
})  
    // Calculating total pages
    const pages = Math.ceil(count / limit);
  
    // Getting Pagination Object
    const pagination = { page, pages, count };
    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        summary: {
  totalAssets: totalCount,
  available: statusSummary['Available'],
  assigned: statusSummary['Assigned'],
  underMaintenance: statusSummary['Under Maintenance'],
  disposed: statusSummary['Disposed'],
  expired: statusSummary['Expired'],
},
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


exports.deleteAsset = async (req,res) =>{

    try {
        await Asset.findOneAndDelete({companyId:req.admin.companyId, _id:req.params.id});
        res.json({ success: true, message: 'Asset deleted' });
      } catch (err) {
        res.status(500).json({ success: false, message: err.message });
      }

}

exports.updateAsset = async (req, res) => {
  try {
    const assetId = req.params.id;
    const updateData = req.body;

    // Fetch the existing asset
    const existingAsset = await Asset.findOne({
      companyId: req.admin.companyId,
      _id: assetId,
    });

    if (!existingAsset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const wasAssignedTo = existingAsset.assignedTo;
    const isAssignedTo = updateData.assignedTo;

    // Case 1: If it was unassigned and now it's assigned
    if (!wasAssignedTo && isAssignedTo) {
      updateData.status = 'Assigned';
    }

    // Case 2: If it was assigned and now it's unassigned, and status was Assigned
    if (
      wasAssignedTo &&
      (!isAssignedTo || isAssignedTo === '') &&
      existingAsset.status === 'Assigned'
    ) {
      updateData.status = 'Available';
    }

    // Case 3: If status is explicitly set to 'Available', clear assignedTo
    if (updateData.status === 'Available') {
      updateData.assignedTo = null;
    }

    // Perform the update
    const updatedAsset = await Asset.findOneAndUpdate(
      { companyId: req.admin.companyId, _id: assetId },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      result: updatedAsset,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.createBulkAssets = async (req, res) => {
  const filePath = req.file.path;
  const Asset = mongoose.model('Asset');
  const User = mongoose.model('User');
  const AssetType = mongoose.model('AssetType');


  try {
    const companyId = req.admin.companyId;

    // Read Excel
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const assetsData = xlsx.utils.sheet_to_json(sheet);

    // Get unique assetTypeNames and employeeCodes
    const assetTypeNames = [...new Set(assetsData.map(a => a['AssetType']).filter(Boolean))];
    
    const employeeCodes = [
      ...new Set(
        assetsData.flatMap(a => [a['AssignedTo'], a['Responsible']]).filter(Boolean)
      ),
    ];

    // Fetch AssetTypes and Users
    const assetTypes = await AssetType.find({ companyId, name: { $in: assetTypeNames } });
    console.log(assetTypes)
    const users = await User.find({
      companyId,
      employeeCode: { $in: employeeCodes },
      removed: false
    });

    // Create maps for quick lookup
    const assetTypeMap = Object.fromEntries(assetTypes.map(a => [a.name, a._id]));
    console.log(assetTypeMap)
    const userMap = Object.fromEntries(users.map(u => [u.employeeCode, u._id]));
    const created = [], failed = [];

    for (const row of assetsData) {
      try {
        const assetTypeId = assetTypeMap[row['AssetType']];
        const assignedToId = userMap[row['AssignedTo']] || null;
        const responsibleId = userMap[row['Responsible']] || null;

        console.log(row.Name,assetTypeId,row['SerialNumber'])

        if (!row.Name || !assetTypeId || !row['SerialNumber']) {
          failed.push({ row, reason: 'Missing required fields (Name, Serial Number, Asset Type)' });
          continue;
        }

        const newAsset = new Asset({
          name: row.Name,
          serialNumber: row['SerialNumber'],
          description: row.Description || '',
          status: row.Status || 'Available',
          assignedTo: assignedToId,
          responsible: responsibleId,
          purchaseDate: row['PurchaseDate'] ? new Date(row['PurchaseDate']) : null,
          expiryDate: row['ExpiryDate'] ? new Date(row['ExpiryDate']) : null,
          location: row.Location || '',
          manufacturer: row.Manufacturer || '',
          assetType: assetTypeId,
          companyId,
          plantId: req.params.plantId,
          enabled: true,
        });

        await newAsset.save();
        created.push({ name: newAsset.name, serialNumber: newAsset.serialNumber });
      } catch (err) {
        failed.push({ row, reason: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Bulk asset upload complete',
      logs: {
        created,
        failed,
      },
    });
  } catch (err) {
    console.error('Bulk asset upload failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  } finally {
    // Always delete the temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

};

