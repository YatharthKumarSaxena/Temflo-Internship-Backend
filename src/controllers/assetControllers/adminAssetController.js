const AssetType = require('../../models/AssetModels/AssetType')
const Asset = require('../../models/AssetModels/Asset')
const mongoose = require('mongoose');



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

    const {plantId, name, assetType,serialNumber, description, status, assignedTo,purchaseDate,expiryDate,location,manufacturer} = req.body;

    if(!plantId || !name || !assetType || !serialNumber){
        res.status(500).json({ success: false, message: "All field Required" });

    }

        const asset = new Asset({companyId:req.admin.companyId,plantId, name, assetType,serialNumber, description, status, assignedTo,purchaseDate,expiryDate,location,manufacturer});
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

