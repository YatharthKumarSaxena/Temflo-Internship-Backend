const AssetType = require('../../models/AssetModels/AssetType');
const Asset = require('../../models/AssetModels/Asset');
const User = require('../../models/userModels/User');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { MODEL_AFFECTED, MODULE, ACTIONS, FILE } = require("@/config/structure.config");
const { activityTracker } = require("@/utils/activityTracker");
const { PERMISSION_CREATED, ASSET_TYPE_CREATED, ASSET_TYPE_DELETED, ASSET_TYPE_UPDATED, ASSET_ADDED, ASSET_DELETED, ASSET_UPDATED, ASSET_BULK_CREATED, ASSET_TRANSFER_APPROVED, ASSET_TRANSFER_REJECTED } = require("@/config/activity.enums");
const { masterTemplate } = require("@/config/emailTemplate");
const { generateMasterTemplate } = require("@/emailTemplate/masterTemplate");
const { sendEmail } = require("@/utils/emailSender");

// create Asset Type
exports.createAssetType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(500).json({ success: false, message: 'All field Required' });
    }

    const assetTypes = new AssetType({ companyId: req.admin.companyId, name, description });
    await assetTypes.save();

    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_assetType],
      eventType: ASSET_TYPE_CREATED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: assetTypes.toObject()
    });

    res.status(200).json({ success: true, message: 'Asset Type created successfully', assetTypes });
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
    res.status(500).json({ success: false, message: 'Failed To Fetch Asset Types' });
  }
};

exports.deleteAssetType = async (req, res) => {
  try {
    // Fetch the asset type first
    const assetType = await AssetType.findOne({ companyId: req.admin.companyId, _id: req.params.id });
    if (!assetType) {
      return res.status(404).json({ success: false, message: 'Asset Type not found' });
    }

    // Delete it
    await AssetType.deleteOne({ _id: req.params.id });
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_assetType],
      eventType: ASSET_TYPE_DELETED,
      actionDone: ACTIONS.delete,
      oldData: assetType.toObject(),
      newData: null
    });

    return res.json({ success: true, message: 'Asset Type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAssetType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(500).json({ success: false, message: 'All field Required' });
    }

    // Fetch the existing asset type first
    const assetType = await AssetType.findOne({ companyId: req.admin.companyId, _id: req.params.id });
    if (!assetType) {
      return res.status(404).json({ success: false, message: 'Asset Type not found' });
    }

    // Save oldData for activity tracking (only changed fields)
    const oldData = {};
    const newData = {};
    oldData._id = req.params.id
    if (name && name !== assetType.name) {
      oldData.name = assetType.name;
      newData.name = name;
      assetType.name = name;
    }
    if (description && description !== assetType.description) {
      oldData.description = assetType.description;
      newData.description = description;
      assetType.description = description;
    }

    // Save updated asset type
    await assetType.save();


    if (!assetType)
      return res.status(404).json({ success: false, message: 'Asset Type Not Found' });
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_assetType],
      eventType: ASSET_TYPE_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldData,
      newData: newData
    });

    return res.status(200).json({ success: true, assetType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.addAsset = async (req, res) => {
  try {
    const {
      plantId,
      name,
      assetType,
      serialNumber,
      description,
      status,
      assignedTo,
      purchaseDate,
      expiryDate,
      location,
      manufacturer,
      responsible,
    } = req.body;

    // Check required fields
    if (!plantId || !name || !assetType || !serialNumber) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID, Name, Asset Type, and Serial Number are required.',
      });
    }

    const companyId = req.admin.companyId;

    // Check if serialNumber is already used under the same company
    const existingAsset = await Asset.findOne({ companyId, serialNumber });
    if (existingAsset) {
      return res.status(409).json({
        success: false,
        message: 'Asset with this serial number already exists in the company.',
      });
    }

    // Clean up empty string values for ObjectId fields
    const cleanAssignedTo =
      assignedTo === '' || assignedTo === null || assignedTo === undefined ? null : assignedTo;
    const cleanResponsible =
      responsible === '' || responsible === null || responsible === undefined ? null : responsible;

    // Auto-update status to 'Assigned' if assignedTo is not null
    const finalStatus = cleanAssignedTo ? 'Assigned' : status || 'Available';

    // Create asset
    const asset = new Asset({
      companyId,
      plantId,
      name,
      assetType,
      serialNumber,
      description,
      status: finalStatus,
      assignedTo: cleanAssignedTo,
      purchaseDate,
      expiryDate,
      location,
      manufacturer,
      responsible: cleanResponsible,
    });

    await asset.save();

    // Activity Tracker for asset creation
    activityTracker({
      userId: req.admin._id,
      companyId: companyId,
      plantId: plantId,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_asset],
      eventType: ASSET_ADDED,
      actionDone: ACTIONS.create,
      oldData: null,
      newData: asset.toObject(),
    });

    return res.status(200).json({
      success: true,
      message: 'Asset added successfully.',
    });
  } catch (err) {
    console.error('Add Asset Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAssets = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = page * limit - limit;

    const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;

    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
    const searchQuery = req.query.q || '';

    let fields = [];

    let assignedToIds = [];
    let responsibleIds = [];

    if (searchQuery && fieldsArray.length > 0) {
      for (const field of fieldsArray) {
        if (field === 'assignedTo.employeeCode') {
          assignedToIds = await User.find({
            employeeCode: { $regex: new RegExp(searchQuery, 'i') },
          }).distinct('_id');
        } else if (field === 'responsible.employeeCode') {
          responsibleIds = await User.find({
            employeeCode: { $regex: new RegExp(searchQuery, 'i') },
          }).distinct('_id');
        } else {
          fields.push({ [field]: { $regex: new RegExp(searchQuery, 'i') } });
        }
      }
    }

    const query = {
      companyId: req.admin.companyId,
      plantId: req.params.plantId,
    };

    if (filter && equal) {
      query[filter] = equal;
    }

    if (fields.length > 0) {
      query.$or = fields;
    }

    if (assignedToIds.length > 0 || responsibleIds.length > 0) {
      query.$or = [
        ...(query.$or || []),
        ...(assignedToIds.length ? [{ assignedTo: { $in: assignedToIds } }] : []),
        ...(responsibleIds.length ? [{ responsible: { $in: responsibleIds } }] : []),
      ];
    }

    const resultsPromise = Asset.find(query)
      .populate('plantId', 'name')
      .populate('assignedTo', 'employeeCode email')
      .populate('responsible', 'employeeCode email')
      .populate('assetType', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortValue });

    const countPromise = Asset.countDocuments(query);

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
    });

    const pages = Math.ceil(count / limit);
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
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    // Fetch the asset first for activity tracking
    const asset = await Asset.findOne({ companyId: req.admin.companyId, _id: req.params.id });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Delete the asset
    await Asset.deleteOne({ _id: req.params.id });

    // Activity Tracker for asset deletion
    activityTracker({
      userId: req.admin._id,
      companyId: req.admin.companyId,
      plantId: req.admin.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_asset],
      eventType: ASSET_DELETED,
      actionDone: ACTIONS.delete,
      oldData: asset.toObject(),
      newData: null,
    });

    return res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const assetId = req.params.id;
    const updateData = { ...req.body };

    // Clean up empty string values for ObjectId fields to prevent casting errors
    const objectIdFields = ['assetType', 'assignedTo', 'responsible'];
    objectIdFields.forEach((field) => {
      if (
        updateData[field] === '' ||
        updateData[field] === null ||
        updateData[field] === undefined
      ) {
        if (field === 'assetType') {
          delete updateData[field]; // required, don't update if empty
        } else {
          updateData[field] = null; // optional fields set to null
        }
      }
    });

    // Remove plantId from updateData since it shouldn't be updated
    delete updateData.plantId;

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

    // Handle auto status updates based on assignment
    if (!wasAssignedTo && isAssignedTo) {
      updateData.status = 'Assigned';
    } else if (wasAssignedTo && (!isAssignedTo || isAssignedTo === '') && existingAsset.status === 'Assigned') {
      updateData.status = 'Available';
    }

    if (updateData.status === 'Available') {
      updateData.assignedTo = null;
    }

    // Prepare oldData and newData only for changed fields
    const oldData = {};
    const newData = {};
    oldData._id = req.params.id;
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== existingAsset[key]) {
        oldData[key] = existingAsset[key];
        newData[key] = updateData[key];
        existingAsset[key] = updateData[key]; // update existingAsset object
      }
    });

    // Save updated asset
    await existingAsset.save();

    // Activity Tracker
    if (Object.keys(newData).length > 0) {
      activityTracker({
        userId: req.admin._id,
        companyId: req.admin.companyId,
        plantId: req.admin.plantId || null,
        module: MODULE.asset,
        subModuleAffected: null,
        fileAffected: FILE.file_admin_asset,
        modelAffected: [MODEL_AFFECTED.model_asset],
        eventType: ASSET_UPDATED,
        actionDone: ACTIONS.update,
        oldData: oldData,
        newData: newData,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      result: existingAsset,
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
    const assetTypeNames = [...new Set(assetsData.map((a) => a['AssetType']).filter(Boolean))];

    const employeeCodes = [
      ...new Set(assetsData.flatMap((a) => [a['AssignedTo'], a['Responsible']]).filter(Boolean)),
    ];

    // Fetch AssetTypes and Users
    const assetTypes = await AssetType.find({ companyId, name: { $in: assetTypeNames } });
    const users = await User.find({
      companyId,
      employeeCode: { $in: employeeCodes },
      removed: false,
    });

    // Create maps for quick lookup
    const assetTypeMap = Object.fromEntries(assetTypes.map((a) => [a.name, a._id]));
    const userMap = Object.fromEntries(users.map((u) => [u.employeeCode, u._id]));
    const created = [],
      failed = [];

    for (const row of assetsData) {
      try {
        const assetTypeId = assetTypeMap[row['AssetType']];
        const assignedToId = userMap[row['AssignedTo']] || null;
        const responsibleId = userMap[row['Responsible']] || null;

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

        // Activity Tracker for each successfully created asset
        activityTracker({
          userId: req.admin._id,
          companyId: companyId,
          plantId: req.admin.plantId || null,
          module: MODULE.asset,
          subModuleAffected: null,
          fileAffected: FILE.file_admin_asset,
          modelAffected: [MODEL_AFFECTED.model_asset],
          eventType: ASSET_BULK_CREATED,
          actionDone: ACTIONS.create,
          oldData: null,
          newData: newAsset.toObject(),
        });

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

// Import AssetTransfer model at the top with other imports
const AssetTransfer = require('../../models/AssetModels/AssetTransfer');

// Get all pending transfer requests for admin approval
exports.getTransferRequests = async (req, res) => {
  try {
    const companyId = req.admin.companyId;
    const plantId = req.params.plantId;
    const { status = 'Pending' } = req.query;

    let query = {
      companyId,
      plantId,
    };

    // Only add status filter if it's not 'all'
    if (status !== 'all') {
      query.status = status;
    }

    const transfers = await AssetTransfer.find(query)
      .populate('assetId', 'name serialNumber')
      .populate('fromEmployee', 'name employeeCode email')
      .populate('toEmployee', 'name employeeCode email')
      .populate('approvedBy', 'name employeeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error('Get transfer requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Approve asset transfer
exports.approveAssetTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transferId = req.params.transferId;
    const { adminNotes = '' } = req.body;
    const adminId = req.admin._id;
    const companyId = req.admin.companyId;

const transfer = await AssetTransfer.findOne({
  _id: transferId,
  companyId,
  status: 'Pending',
})
.populate('assetId')
.populate('fromEmployee', 'name email')
.populate('toEmployee', 'name email');

    if (!transfer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found or already processed',
      });
    }

    // Verify the asset is still assigned to the from employee
    const asset = await Asset.findOne({
      _id: transfer.assetId._id,
      assignedTo: transfer.fromEmployee,
      status: 'Assigned',
    });

    if (!asset) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Asset is no longer assigned to the requesting employee',
      });
    }

    // Save old data for activity tracker
    const oldAssetData = { _id: transfer.assetId._id, assignedTo: asset.assignedTo, status: asset.status };
    const oldTransferData = {
      _id: transferId,
      status: transfer.status,
      approvedBy: transfer.approvedBy,
      approvedAt: transfer.approvedAt,
      completedAt: transfer.completedAt,
      adminNotes: transfer.adminNotes
    };

    // Update the asset assignment
    asset.assignedTo = transfer.toEmployee;
    asset.status = 'Assigned';
    await asset.save({ session });

    activityTracker({
      userId: adminId,
      companyId: companyId,
      plantId: asset.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_asset],
      eventType: ASSET_UPDATED,
      actionDone: ACTIONS.update,
      oldData: oldAssetData,
      newData: { assignedTo: asset.assignedTo, status: asset.status },
    });

    const newData = {
      status: 'Completed',
      approvedBy: adminId,
      approvedAt: new Date(),
      completedAt: new Date(),
      adminNotes: adminNotes.trim()
    }

    // Update the transfer request
    transfer.status = 'Completed';
    transfer.approvedBy = adminId;
    transfer.approvedAt = new Date();
    transfer.completedAt = new Date();
    transfer.adminNotes = adminNotes.trim();
    await transfer.save({ session });

    activityTracker({
      userId: adminId,
      companyId: companyId,
      plantId: asset.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_assetTransfer],
      eventType: ASSET_TRANSFER_APPROVED,
      actionDone: ACTIONS.update,
      oldData: oldTransferData,
      newData: newData,
    });

    await session.commitTransaction();
    session.endSession();

    const approveDate = new Date().toLocaleString();

    // ----- EMAILS -----
    const baseNotes = `
      Asset Name: ${asset.name}<br/>
      Asset ID: ${asset._id}<br/>
      Serial Number: ${asset.serialNumber || 'N/A'}
    `;

    // From Employee (requester)
    const fromEmployeeMsg = `
      ${baseNotes}<br/>
      Your request for this asset has been approved by Admin.<br/>
      Transferred to Employee ID: <b>${transfer.toEmployee._id}</b>.<br/>
      Notes: ${adminNotes.trim() || 'None'}</b>.<br/>
      Date: ${approveDate}
    `;

    // To Employee (receiver)
    const toEmployeeMsg = `
      ${baseNotes}<br/>
      Admin has transferred this asset to you.<br/>
      Requested by Employee ID: <b>${transfer.fromEmployee._id}</b>.<br/>
      Notes: ${adminNotes.trim() || 'None'}</b>.<br/>
      Date: ${approveDate}
    `;

    // Admin
    const adminMsg = `
      ${baseNotes}<br/>
      You have approved this asset transfer.<br/>
      From Employee ID: <b>${transfer.fromEmployee._id}</b> to Employee ID: <b>${transfer.toEmployee._id}</b>.<br/>
      Notes: ${adminNotes.trim() || 'None'}'}</b>.<br/>
      Date: ${approveDate}
    `;

    sendEmail(
      transfer.fromEmployee.email,
      masterTemplate.assetTransferApproved.subject,
      generateMasterTemplate({ ...masterTemplate.assetTransferApproved, notes: fromEmployeeMsg })
    );

    sendEmail(
      transfer.toEmployee.email,
      masterTemplate.assetTransferApproved.subject,
      generateMasterTemplate({ ...masterTemplate.assetTransferApproved, notes: toEmployeeMsg })
    );

    sendEmail(
      req.admin.email,
      masterTemplate.assetTransferApproved.subject,
      generateMasterTemplate({ ...masterTemplate.assetTransferApproved, notes: adminMsg })
    );

    res.status(200).json({
      success: true,
      message: 'Asset transfer approved and completed successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Approve asset transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Reject asset transfer
exports.rejectAssetTransfer = async (req, res) => {
  try {
    const transferId = req.params.transferId;
    const { adminNotes = '' } = req.body;
    const adminId = req.admin._id;
    const companyId = req.admin.companyId;

const transfer = await AssetTransfer.findOne({
  _id: transferId,
  companyId,
  status: 'Pending',
})
.populate('assetId')
.populate('fromEmployee', 'name email')
.populate('toEmployee', 'name email');

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer request not found or already processed',
      });
    }

    // Verify the asset is still assigned to the from employee
    const asset = await Asset.findOne({
      _id: transfer.assetId._id,
      assignedTo: transfer.fromEmployee,
      status: 'Assigned',
    });

    const oldTransferData = {
      _id: transferId,
      status: transfer.status,
      approvedBy: transfer.approvedBy,
      rejectedAt: transfer.rejectedAt,
      adminNotes: transfer.adminNotes
    };

    const newData = {
      status: 'Rejected',
      approvedBy: adminId,
      rejectedAt: new Date(),
      adminNotes: adminNotes.trim()
    }

    transfer.status = 'Rejected';
    transfer.approvedBy = adminId;
    transfer.rejectedAt = new Date();
    transfer.adminNotes = adminNotes.trim();
    await transfer.save();

    activityTracker({
      userId: adminId,
      companyId: companyId,
      plantId: transfer.plantId || null,
      module: MODULE.asset,
      subModuleAffected: null,
      fileAffected: FILE.file_admin_asset,
      modelAffected: [MODEL_AFFECTED.model_assetTransfer],
      eventType: ASSET_TRANSFER_REJECTED,
      actionDone: ACTIONS.update,
      oldData: oldTransferData,
      newData: newData
    });

    // ----- EMAILS -----
    const baseNotes = `
      Asset Name: ${asset.name}<br/>
      Asset ID: ${asset._id}<br/>
      Serial Number: ${asset.serialNumber}
    `;

    const rejectDate = new Date().toLocaleString();
// From Employee (requester)
const fromEmployeeMsg = `
  ${baseNotes}<br/>
  Your request for this asset has been rejected by Admin for asset transfer to Employee ID: ${transfer.toEmployee._id}</b>.<br/>
  Reason: ${adminNotes.trim() || 'Not provided'}</b>.<br/>
  Date: ${rejectDate}
`;

// To Employee (receiver)
const toEmployeeMsg = `
  ${baseNotes}<br/>
  This asset transfer to you has been rejected by Admin.<br/>
  Requested by Employee ID: <b>${transfer.fromEmployee._id}</b>.<br/>
  Reason: ${adminNotes.trim() || 'Not provided'}</b>.<br/>
  Date: ${rejectDate}
`;

// Admin
const adminMsg = `
  ${baseNotes}<br/>
  You have rejected the transfer request for this asset.<br/>
  Request was made by Employee ID: <b>${transfer.fromEmployee._id}</b> to transfer to Employee ID: <b>${transfer.toEmployee._id}</b>.<br/>
  Reason: ${adminNotes.trim() || 'Not provided'}</b>.<br/>
  Date: ${rejectDate}
`;

    sendEmail(
      transfer.fromEmployee.email,
      masterTemplate.assetTransferRejected.subject,
      generateMasterTemplate({ ...masterTemplate.assetTransferRejected, notes: fromEmployeeMsg })
    );

    sendEmail(
      transfer.toEmployee.email,
      masterTemplate.assetTransferRejected.subject,
      generateMasterTemplate({ ...masterTemplate.assetTransferRejected, notes: toEmployeeMsg })
    );

    sendEmail(
      req.admin.email,
      masterTemplate.assetTransferRejected.subject,
      generateMasterTemplate({ ...masterTemplate.assetTransferRejected, notes: adminMsg })
    );

    res.status(200).json({
      success: true,
      message: 'Asset transfer request rejected',
      data: transfer,
    });
  } catch (error) {
    console.error('Reject asset transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get transfer history for an asset
exports.getAssetTransferHistory = async (req, res) => {
  try {
    const assetId = req.params.assetId;
    const companyId = req.admin.companyId;

    const transfers = await AssetTransfer.find({
      assetId,
      companyId,
    })
      .populate('fromEmployee', 'name employeeCode')
      .populate('toEmployee', 'name employeeCode')
      .populate('approvedBy', 'name employeeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.error('Get asset transfer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};