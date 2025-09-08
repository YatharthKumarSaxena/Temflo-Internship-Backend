const Asset = require('../../models/AssetModels/Asset');
const AssetTransfer = require('../../models/AssetModels/AssetTransfer');
const User = require('../../models/userModels/User');
const mongoose = require('mongoose');

// Get assets assigned to the current employee
exports.getMyAssets = async (req, res) => {
  try {
    const employeeId = req.admin._id;
    const companyId = req.admin.companyId;
    const plantId = req.headers['plant-id'];

    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID is required',
      });
    }

    const assets = await Asset.find({
      companyId,
      plantId,
      assignedTo: employeeId,
      status: 'Assigned',
    })
      .populate('assetType', 'name')
      .populate('responsible', 'name employeeCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('Get my assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Request asset transfer to another employee
exports.requestAssetTransfer = async (req, res) => {
  try {
    const { assetId, toEmployeeId, reason } = req.body;
    const fromEmployeeId = req.admin._id;
    const companyId = req.admin.companyId;
    const plantId = req.headers['plant-id'];

    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID is required',
      });
    }

    if (!assetId || !toEmployeeId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID, target employee, and reason are required',
      });
    }

    // Verify the asset is assigned to the requesting employee
    const asset = await Asset.findOne({
      _id: assetId,
      companyId,
      plantId,
      assignedTo: fromEmployeeId,
      status: 'Assigned',
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found or not assigned to you',
      });
    }

    // Verify target employee exists and belongs to same company and plant
    const toEmployee = await User.findOne({
      _id: toEmployeeId,
      companyId,
      plantId,
      role: 'employee',
      removed: false,
    });

    if (!toEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Target employee not found',
      });
    }

    // Check if there's already a pending transfer for this asset
    const existingTransfer = await AssetTransfer.findOne({
      assetId,
      status: 'Pending',
    });

    if (existingTransfer) {
      return res.status(409).json({
        success: false,
        message: 'There is already a pending transfer request for this asset',
      });
    }

    // Create transfer request
    const transferRequest = new AssetTransfer({
      companyId,
      plantId,
      assetId,
      fromEmployee: fromEmployeeId,
      toEmployee: toEmployeeId,
      requestedBy: fromEmployeeId,
      reason: reason.trim(),
    });

    await transferRequest.save();

    res.status(201).json({
      success: true,
      message: 'Asset transfer request submitted successfully',
      data: transferRequest,
    });
  } catch (error) {
    console.error('Request asset transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get transfer requests (sent and received)
exports.getTransferRequests = async (req, res) => {
  try {
    const employeeId = req.admin._id;
    const companyId = req.admin.companyId;
    const plantId = req.headers['plant-id'];
    const { type = 'all' } = req.query; // 'sent', 'received', 'all'

    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID is required',
      });
    }

    let query = {
      companyId,
      plantId,
    };

    if (type === 'sent') {
      query.fromEmployee = employeeId;
    } else if (type === 'received') {
      query.toEmployee = employeeId;
    } else {
      query.$or = [{ fromEmployee: employeeId }, { toEmployee: employeeId }];
    }

    const transfers = await AssetTransfer.find(query)
      .populate('assetId', 'name serialNumber')
      .populate('fromEmployee', 'name employeeCode')
      .populate('toEmployee', 'name employeeCode')
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

// Get employees in the same plant for transfer selection
exports.getEmployeesForTransfer = async (req, res) => {
  try {
    const currentEmployeeId = req.admin._id;
    const companyId = req.admin.companyId;
    const plantId = req.headers['plant-id'];

    if (!plantId) {
      return res.status(400).json({
        success: false,
        message: 'Plant ID is required',
      });
    }

    const employees = await User.find({
      companyId,
      plantId,
      role: 'employee',
      removed: false,
      _id: { $ne: currentEmployeeId }, // Exclude current employee
    })
      .select('name employeeCode email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Get employees for transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
